import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usedSessionCodesTable } from "@workspace/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { requireConfirmedAuth, getTherapistFromRequest } from "../lib/auth";

const router: IRouter = Router();

const sseClients: Map<string, Set<Response>> = new Map();

const SESSION_CODE_REGEX = /^\d{1,6}$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const MAX_SPEED = 10;
const MIN_SPEED = 0.1;

function broadcastSessionState(sessionCode: string, state: object) {
  const clients = sseClients.get(sessionCode);
  if (!clients || clients.size === 0) return;
  const data = JSON.stringify(state);
  clients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
    }
  });
}

function generateCode(): string {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
}

router.post("/create", requireConfirmedAuth, async (req, res) => {
  try {
    const therapist = (req as any).therapist;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let sessionCode: string | null = null;
    let attempts = 0;

    while (!sessionCode && attempts < 20) {
      attempts++;
      const candidate = generateCode();

      const [recentUse] = await db
        .select()
        .from(usedSessionCodesTable)
        .where(
          and(
            eq(usedSessionCodesTable.sessionCode, candidate),
            gt(usedSessionCodesTable.blockedUntil, now)
          )
        );

      if (!recentUse) {
        const [existingSession] = await db
          .select()
          .from(sessionsTable)
          .where(
            and(
              eq(sessionsTable.sessionCode, candidate),
              gt(sessionsTable.expiresAt, now)
            )
          );

        if (!existingSession) {
          sessionCode = candidate;
        }
      }
    }

    if (!sessionCode) {
      res.status(500).json({ error: "Could not generate a unique session code. Please try again." });
      return;
    }

    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      sessionCode,
      therapistId: therapist.id,
      isPlaying: false,
      speedSeconds: 2.0,
      dotColor: "#DA70D6",
      backgroundColor: "#000080",
      expiresAt,
    });

    await db.insert(usedSessionCodesTable).values({
      sessionCode,
      therapistId: therapist.id,
      blockedUntil: thirtyDaysFromNow,
    });

    res.status(201).json({
      sessionCode,
      therapistId: therapist.id,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create session error");
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { sessionCode } = req.body;

    if (!sessionCode || typeof sessionCode !== "string") {
      res.status(400).json({ error: "Session code is required" });
      return;
    }

    const trimmed = sessionCode.trim();
    if (!SESSION_CODE_REGEX.test(trimmed)) {
      res.status(400).json({ error: "Invalid session code format" });
      return;
    }

    const normalizedCode = trimmed.padStart(6, "0");
    const now = new Date();

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.sessionCode, normalizedCode), gt(sessionsTable.expiresAt, now)));

    if (!session) {
      res.status(400).json({ error: "Invalid or expired session code" });
      return;
    }

    res.json({
      sessionCode: session.sessionCode,
      therapistId: session.therapistId,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Join session error");
    res.status(500).json({ error: "Failed to join session" });
  }
});

router.get("/:sessionId/state", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!SESSION_CODE_REGEX.test(sessionId)) {
      res.status(400).json({ error: "Invalid session code format" });
      return;
    }

    const now = new Date();

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.sessionCode, sessionId), gt(sessionsTable.expiresAt, now)));

    if (!session) {
      res.status(404).json({ error: "Session not found or expired" });
      return;
    }

    res.json({
      sessionCode: session.sessionCode,
      isPlaying: session.isPlaying,
      speedSeconds: session.speedSeconds,
      dotColor: session.dotColor,
      backgroundColor: session.backgroundColor,
    });
  } catch (err) {
    req.log.error({ err }, "Get session state error");
    res.status(500).json({ error: "Failed to get session state" });
  }
});

router.put("/:sessionId/state", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!SESSION_CODE_REGEX.test(sessionId)) {
      res.status(400).json({ error: "Invalid session code format" });
      return;
    }

    const { isPlaying, speedSeconds, dotColor, backgroundColor } = req.body;
    const updates: Partial<typeof sessionsTable.$inferInsert> = {};

    if (isPlaying !== undefined) {
      if (typeof isPlaying !== "boolean") {
        res.status(400).json({ error: "isPlaying must be a boolean" });
        return;
      }
      updates.isPlaying = isPlaying;
    }

    if (speedSeconds !== undefined) {
      const speed = Number(speedSeconds);
      if (isNaN(speed) || speed < MIN_SPEED || speed > MAX_SPEED) {
        res.status(400).json({ error: `speedSeconds must be between ${MIN_SPEED} and ${MAX_SPEED}` });
        return;
      }
      updates.speedSeconds = speed;
    }

    if (dotColor !== undefined) {
      if (typeof dotColor !== "string" || !HEX_COLOR_REGEX.test(dotColor)) {
        res.status(400).json({ error: "dotColor must be a valid hex color (e.g. #DA70D6)" });
        return;
      }
      updates.dotColor = dotColor;
    }

    if (backgroundColor !== undefined) {
      if (typeof backgroundColor !== "string" || !HEX_COLOR_REGEX.test(backgroundColor)) {
        res.status(400).json({ error: "backgroundColor must be a valid hex color (e.g. #000080)" });
        return;
      }
      updates.backgroundColor = backgroundColor;
    }

    const therapist = await getTherapistFromRequest(req);

    if (!therapist) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const now = new Date();
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.sessionCode, sessionId), gt(sessionsTable.expiresAt, now)));

    if (!session) {
      res.status(404).json({ error: "Session not found or expired" });
      return;
    }

    if (session.therapistId !== therapist.id) {
      res.status(403).json({ error: "Not authorized to control this session" });
      return;
    }

    const [updated] = await db
      .update(sessionsTable)
      .set(updates)
      .where(eq(sessionsTable.sessionCode, sessionId))
      .returning();

    const state = {
      sessionCode: updated.sessionCode,
      isPlaying: updated.isPlaying,
      speedSeconds: updated.speedSeconds,
      dotColor: updated.dotColor,
      backgroundColor: updated.backgroundColor,
    };

    broadcastSessionState(sessionId, state);

    res.json(state);
  } catch (err) {
    req.log.error({ err }, "Update session state error");
    res.status(500).json({ error: "Failed to update session state" });
  }
});

router.get("/:sessionId/events", async (req, res) => {
  const { sessionId } = req.params;

  if (!SESSION_CODE_REGEX.test(sessionId)) {
    res.status(400).json({ error: "Invalid session code format" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, new Set());
  }
  sseClients.get(sessionId)!.add(res);

  try {
    const now = new Date();
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.sessionCode, sessionId), gt(sessionsTable.expiresAt, now)));

    if (session) {
      const state = {
        sessionCode: session.sessionCode,
        isPlaying: session.isPlaying,
        speedSeconds: session.speedSeconds,
        dotColor: session.dotColor,
        backgroundColor: session.backgroundColor,
      };
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    }
  } catch {
  }

  const keepAlive = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    const clients = sseClients.get(sessionId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(sessionId);
      }
    }
  });
});

export default router;
