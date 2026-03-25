import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { therapistsTable } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function therapistView(t: typeof therapistsTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    email: t.email,
    status: t.status,
    isAdmin: t.isAdmin,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/therapists", requireAdmin, async (req, res) => {
  try {
    const therapists = await db
      .select()
      .from(therapistsTable)
      .orderBy(therapistsTable.createdAt);

    res.json(therapists.map(therapistView));
  } catch (err) {
    req.log.error({ err }, "Admin list therapists error");
    res.status(500).json({ error: "Failed to list therapists" });
  }
});

router.get("/therapists/search", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q as string || "").trim();

    if (!q) {
      const all = await db.select().from(therapistsTable).orderBy(therapistsTable.createdAt);
      res.json(all.map(therapistView));
      return;
    }

    const results = await db
      .select()
      .from(therapistsTable)
      .where(
        or(
          ilike(therapistsTable.name, `%${q}%`),
          ilike(therapistsTable.email, `%${q}%`),
        )
      )
      .orderBy(therapistsTable.createdAt);

    res.json(results.map(therapistView));
  } catch (err) {
    req.log.error({ err }, "Admin search therapists error");
    res.status(500).json({ error: "Search failed" });
  }
});

router.patch("/therapists/:id/activate", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid therapist ID" });
      return;
    }

    const [therapist] = await db.select().from(therapistsTable).where(eq(therapistsTable.id, id));
    if (!therapist) {
      res.status(404).json({ error: "Therapist not found" });
      return;
    }

    const [updated] = await db
      .update(therapistsTable)
      .set({ status: "active", activationToken: null, activationTokenExpiry: null, updatedAt: new Date() })
      .where(eq(therapistsTable.id, id))
      .returning();

    res.json(therapistView(updated));
  } catch (err) {
    req.log.error({ err }, "Admin activate therapist error");
    res.status(500).json({ error: "Failed to activate therapist" });
  }
});

router.patch("/therapists/:id/admin", requireAdmin, async (req, res) => {
  try {
    const admin = (req as any).therapist;
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid therapist ID" });
      return;
    }

    if (id === admin.id) {
      res.status(400).json({ error: "You cannot change your own admin status" });
      return;
    }

    const [therapist] = await db.select().from(therapistsTable).where(eq(therapistsTable.id, id));
    if (!therapist) {
      res.status(404).json({ error: "Therapist not found" });
      return;
    }

    const [updated] = await db
      .update(therapistsTable)
      .set({ isAdmin: !therapist.isAdmin, updatedAt: new Date() })
      .where(eq(therapistsTable.id, id))
      .returning();

    res.json(therapistView(updated));
  } catch (err) {
    req.log.error({ err }, "Admin toggle admin error");
    res.status(500).json({ error: "Failed to update admin status" });
  }
});

export default router;
