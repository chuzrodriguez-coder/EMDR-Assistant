import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { therapistsTable, authSessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import { sendConfirmationEmail } from "../lib/email";
import { getTherapistFromSession, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [existing] = await db.select().from(therapistsTable).where(eq(therapistsTable.email, email.toLowerCase()));
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const confirmationToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(therapistsTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      status: "pending",
      confirmationToken,
      confirmationTokenExpiry: tokenExpiry,
    });

    const appUrl = process.env.APP_URL || `https://${req.hostname}`;
    await sendConfirmationEmail(email, confirmationToken);

    res.status(201).json({ message: "Registration successful. Please check your email to confirm your account." });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [therapist] = await db.select().from(therapistsTable).where(eq(therapistsTable.email, email.toLowerCase()));

    if (!therapist) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await argon2.verify(therapist.passwordHash, password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(authSessionsTable).values({
      token,
      therapistId: therapist.id.toString(),
      expiresAt,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });

    res.json({
      id: therapist.id,
      name: therapist.name,
      email: therapist.email,
      status: therapist.status,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.["auth_token"] as string | undefined;
    if (token) {
      await db.delete(authSessionsTable).where(eq(authSessionsTable.token, token));
    }
    res.clearCookie("auth_token");
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    req.log.error({ err }, "Logout error");
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const therapist = await getTherapistFromSession(req);
    if (!therapist) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({
      id: therapist.id,
      name: therapist.name,
      email: therapist.email,
      status: therapist.status,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [therapist] = await db
      .select()
      .from(therapistsTable)
      .where(eq(therapistsTable.confirmationToken, token));

    if (!therapist) {
      res.status(400).json({ error: "Invalid or expired confirmation link" });
      return;
    }

    if (therapist.confirmationTokenExpiry && therapist.confirmationTokenExpiry < new Date()) {
      res.status(400).json({ error: "This confirmation link has expired. Please re-register." });
      return;
    }

    await db
      .update(therapistsTable)
      .set({
        status: "active",
        confirmationToken: null,
        confirmationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(therapistsTable.id, therapist.id));

    res.json({ message: "Email confirmed successfully! You can now log in and start sessions." });
  } catch (err) {
    req.log.error({ err }, "Confirm email error");
    res.status(500).json({ error: "Confirmation failed" });
  }
});

router.put("/update-profile", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const { name, email } = req.body;

    const updates: Partial<typeof therapistsTable.$inferInsert> = {};
    if (name) updates.name = name;
    if (email) {
      const [existing] = await db.select().from(therapistsTable).where(eq(therapistsTable.email, email.toLowerCase()));
      if (existing && existing.id !== therapist.id) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
      updates.email = email.toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No updates provided" });
      return;
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(therapistsTable)
      .set(updates)
      .where(eq(therapistsTable.id, therapist.id))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      status: updated.status,
    });
  } catch (err) {
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const valid = await argon2.verify(therapist.passwordHash, currentPassword);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await db
      .update(therapistsTable)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(therapistsTable.id, therapist.id));

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
