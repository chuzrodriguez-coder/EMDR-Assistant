import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { authSessionsTable, therapistsTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function getTherapistFromSession(req: Request): Promise<typeof therapistsTable.$inferSelect | null> {
  const token = req.cookies?.["auth_token"] as string | undefined;
  if (!token) return null;

  const now = new Date();
  const [session] = await db
    .select()
    .from(authSessionsTable)
    .where(and(eq(authSessionsTable.token, token), gt(authSessionsTable.expiresAt, now)));

  if (!session) return null;

  const [therapist] = await db
    .select()
    .from(therapistsTable)
    .where(eq(therapistsTable.id, parseInt(session.therapistId)));

  return therapist || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const therapist = await getTherapistFromSession(req);
  if (!therapist) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  (req as any).therapist = therapist;
  next();
}

export async function requireActiveAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const therapist = await getTherapistFromSession(req);
  if (!therapist) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (therapist.status !== "active") {
    res.status(403).json({ error: "Your account is pending activation by an administrator." });
    return;
  }
  (req as any).therapist = therapist;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const therapist = await getTherapistFromSession(req);
  if (!therapist) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!therapist.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as any).therapist = therapist;
  next();
}

export async function requireConfirmedAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  return requireActiveAuth(req, res, next);
}
