import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savedThemesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const router: IRouter = Router();

const MAX_THEMES = 6;

router.get("/", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const themes = await db
      .select()
      .from(savedThemesTable)
      .where(eq(savedThemesTable.therapistId, therapist.id))
      .orderBy(savedThemesTable.createdAt);

    res.json(
      themes.map((t) => ({
        id: t.id,
        dotColor: t.dotColor,
        backgroundColor: t.backgroundColor,
        createdAt: t.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get saved themes error");
    res.status(500).json({ error: "Failed to get saved themes" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const { dotColor, backgroundColor } = req.body;

    if (!dotColor || !backgroundColor) {
      res.status(400).json({ error: "Both dotColor and backgroundColor are required" });
      return;
    }

    if (typeof dotColor !== "string" || !HEX_COLOR_REGEX.test(dotColor)) {
      res.status(400).json({ error: "dotColor must be a valid hex color (e.g. #DA70D6)" });
      return;
    }

    if (typeof backgroundColor !== "string" || !HEX_COLOR_REGEX.test(backgroundColor)) {
      res.status(400).json({ error: "backgroundColor must be a valid hex color (e.g. #000080)" });
      return;
    }

    const existing = await db
      .select()
      .from(savedThemesTable)
      .where(eq(savedThemesTable.therapistId, therapist.id));

    if (existing.length >= MAX_THEMES) {
      res.status(400).json({
        error: `You can save a maximum of ${MAX_THEMES} color themes. Please delete one before saving a new one.`,
      });
      return;
    }

    const [saved] = await db
      .insert(savedThemesTable)
      .values({
        therapistId: therapist.id,
        dotColor,
        backgroundColor,
      })
      .returning();

    res.status(201).json({
      id: saved.id,
      dotColor: saved.dotColor,
      backgroundColor: saved.backgroundColor,
      createdAt: saved.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Save theme error");
    res.status(500).json({ error: "Failed to save theme" });
  }
});

router.delete("/:themeId", requireAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const themeId = parseInt(req.params.themeId as string);

    if (isNaN(themeId)) {
      res.status(400).json({ error: "Invalid theme ID" });
      return;
    }

    const [deleted] = await db
      .delete(savedThemesTable)
      .where(
        and(
          eq(savedThemesTable.id, themeId),
          eq(savedThemesTable.therapistId, therapist.id)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Theme not found" });
      return;
    }

    res.json({ message: "Theme deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete theme error");
    res.status(500).json({ error: "Failed to delete theme" });
  }
});

export default router;
