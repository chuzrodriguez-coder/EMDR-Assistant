import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { therapistsTable, sessionsTable, usedSessionCodesTable, savedThemesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// /auth/me is the server-side "login" gate: Clerk handles credential verification
// externally; after a successful Clerk sign-in the client calls /auth/me to retrieve
// the therapist profile and confirm server-side status. Keeping this limit tighter
// than the registration limit (10 vs 20) blocks credential-stuffing/enumeration while
// allowing normal browser page reloads within a session.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// Registration is more lenient: a single sign-up attempt may trigger multiple /sync
// calls (retries, tab duplication), so a higher quota over a longer window is appropriate.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again later." },
});

const deleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many deletion requests. Please try again later." },
});

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

router.post("/sync", registerLimiter, async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(auth.userId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail?.emailAddress) {
      res.status(400).json({ error: "No verified primary email address on Clerk account" });
      return;
    }

    const rawEmail = primaryEmail.emailAddress;
    if (rawEmail.length > MAX_EMAIL_LENGTH) {
      res.status(400).json({ error: "Email address is too long" });
      return;
    }

    const email = rawEmail.toLowerCase().trim();
    const rawName = (
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser.username ||
      email.split("@")[0]
    );

    if (rawName.length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Display name must be ${MAX_NAME_LENGTH} characters or fewer` });
      return;
    }

    const name = rawName.trim();

    const [existing] = await db
      .select()
      .from(therapistsTable)
      .where(eq(therapistsTable.clerkUserId, auth.userId));

    if (existing) {
      res.json({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        status: existing.status,
        isAdmin: existing.isAdmin,
      });
      return;
    }

    const [byEmail] = await db
      .select()
      .from(therapistsTable)
      .where(eq(therapistsTable.email, email));

    if (byEmail) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    const [created] = await db
      .insert(therapistsTable)
      .values({
        clerkUserId: auth.userId,
        name,
        email,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      id: created.id,
      name: created.name,
      email: created.email,
      status: created.status,
      isAdmin: created.isAdmin,
    });
  } catch (err) {
    req.log.error({ err }, "Sync error");
    res.status(500).json({ error: "Failed to sync account" });
  }
});

router.get("/me", loginLimiter, async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [therapist] = await db
      .select()
      .from(therapistsTable)
      .where(eq(therapistsTable.clerkUserId, auth.userId));

    if (!therapist) {
      res.status(404).json({ error: "Therapist account not found" });
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

router.put("/update-profile", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` });
      return;
    }

    const [updated] = await db
      .update(therapistsTable)
      .set({ name: name.trim(), updatedAt: new Date() })
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

router.delete("/account", deleteLimiter, requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const auth = getAuth(req);

    await db.transaction(async (tx) => {
      await tx.delete(usedSessionCodesTable).where(eq(usedSessionCodesTable.therapistId, therapist.id));
      await tx.delete(sessionsTable).where(eq(sessionsTable.therapistId, therapist.id));
      await tx.delete(savedThemesTable).where(eq(savedThemesTable.therapistId, therapist.id));
      await tx.delete(therapistsTable).where(eq(therapistsTable.id, therapist.id));
    });

    if (auth?.userId) {
      try {
        await clerkClient.users.deleteUser(auth.userId);
      } catch (clerkErr) {
        req.log.warn({ clerkErr }, "Failed to delete Clerk user; local record already removed");
      }
    }

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Account deletion error");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
