import { db } from "@workspace/db";
import { sessionsTable, usedSessionCodesTable } from "@workspace/db/schema";
import { lt } from "drizzle-orm";
import { logger } from "./logger";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function runCleanup(): Promise<void> {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  try {
    const deletedSessions = await db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, cutoff))
      .returning({ id: sessionsTable.id });

    const deletedCodes = await db
      .delete(usedSessionCodesTable)
      .where(lt(usedSessionCodesTable.blockedUntil, cutoff))
      .returning({ id: usedSessionCodesTable.id });

    logger.info(
      { deletedSessions: deletedSessions.length, deletedCodes: deletedCodes.length },
      "Cleanup: removed expired sessions and used session codes",
    );
  } catch (err) {
    logger.error({ err }, "Cleanup task failed");
  }
}

export function startCleanupScheduler(): void {
  runCleanup();
  setInterval(runCleanup, TWENTY_FOUR_HOURS_MS).unref();
}
