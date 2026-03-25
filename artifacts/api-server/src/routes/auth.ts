import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { therapistsTable, authSessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import { sendAdminNotificationEmail } from "../lib/email";
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

    const activationToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(therapistsTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      status: "pending",
      activationToken,
      activationTokenExpiry: tokenExpiry,
    });

    const appUrl = process.env.APP_URL || `https://${req.hostname}`;
    await sendAdminNotificationEmail(name, email.toLowerCase(), activationToken, appUrl);

    res.status(201).json({ message: "Registration successful. Your account is pending activation." });
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
      isAdmin: therapist.isAdmin,
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
      isAdmin: therapist.isAdmin,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.get("/activate/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [therapist] = await db
      .select()
      .from(therapistsTable)
      .where(eq(therapistsTable.activationToken, token));

    if (!therapist) {
      res.status(400).send(`
        <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;">
          <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;box-shadow:0 1px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#dc2626;">Invalid Link</h2>
            <p style="color:#4a5568;">This activation link is invalid or has already been used.</p>
          </div>
        </body></html>
      `);
      return;
    }

    if (therapist.activationTokenExpiry && therapist.activationTokenExpiry < new Date()) {
      res.status(400).send(`
        <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;">
          <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;box-shadow:0 1px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#dc2626;">Link Expired</h2>
            <p style="color:#4a5568;">This activation link has expired. Please activate from the Admin Panel.</p>
          </div>
        </body></html>
      `);
      return;
    }

    if (therapist.status === "active") {
      res.send(`
        <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;">
          <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;box-shadow:0 1px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#0891b2;">Already Active</h2>
            <p style="color:#4a5568;"><strong>${therapist.name}</strong> (${therapist.email}) is already active.</p>
          </div>
        </body></html>
      `);
      return;
    }

    await db
      .update(therapistsTable)
      .set({
        status: "active",
        activationToken: null,
        activationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(therapistsTable.id, therapist.id));

    const appUrl = process.env.APP_URL || `https://${req.hostname}`;
    res.send(`
      <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#f8fafc;">
        <div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;box-shadow:0 1px 6px rgba(0,0,0,0.1);">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h2 style="color:#059669;">Account Activated</h2>
          <p style="color:#4a5568;"><strong>${therapist.name}</strong> (${therapist.email}) has been successfully activated and can now log in.</p>
          <a href="${appUrl}/?admin=admin" style="display:inline-block;margin-top:20px;background:#0891b2;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Admin Panel</a>
        </div>
      </body></html>
    `);
  } catch (err) {
    req.log.error({ err }, "Activate account error");
    res.status(500).send(`
      <html><body style="font-family:Arial,sans-serif;text-align:center;padding:60px;">
        <h2 style="color:#dc2626;">Error</h2>
        <p>An error occurred. Please try again or use the Admin Panel.</p>
      </body></html>
    `);
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
      isAdmin: updated.isAdmin,
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
