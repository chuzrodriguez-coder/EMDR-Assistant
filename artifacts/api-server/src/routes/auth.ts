import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { therapistsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/sync", async (req, res) => {
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

    const email = primaryEmail.emailAddress.toLowerCase().trim();
    const name = (
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser.username ||
      email.split("@")[0]
    );

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

router.get("/me", async (req, res) => {
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

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
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

export default router;
