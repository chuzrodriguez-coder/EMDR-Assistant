import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { therapistsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function getTherapistFromRequest(req: Request): Promise<typeof therapistsTable.$inferSelect | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;

  const [therapist] = await db
    .select()
    .from(therapistsTable)
    .where(eq(therapistsTable.clerkUserId, clerkUserId));

  return therapist || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const therapist = await getTherapistFromRequest(req);
  if (!therapist) {
    res.status(401).json({ error: "No therapist account found. Please complete registration." });
    return;
  }
  (req as any).therapist = therapist;
  next();
}

export async function requireActiveAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const therapist = await getTherapistFromRequest(req);
  if (!therapist) {
    res.status(401).json({ error: "No therapist account found. Please complete registration." });
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
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const therapist = await getTherapistFromRequest(req);
  if (!therapist) {
    res.status(401).json({ error: "No therapist account found." });
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
