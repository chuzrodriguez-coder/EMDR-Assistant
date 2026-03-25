import { pgTable, serial, text, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { therapistsTable } from "./therapists";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  therapistId: integer("therapist_id").notNull().references(() => therapistsTable.id),
  isPlaying: boolean("is_playing").notNull().default(false),
  speedSeconds: real("speed_seconds").notNull().default(2.0),
  dotColor: text("dot_color").notNull().default("#DA70D6"),
  backgroundColor: text("background_color").notNull().default("#000080"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const usedSessionCodesTable = pgTable("used_session_codes", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull(),
  therapistId: integer("therapist_id").notNull().references(() => therapistsTable.id),
  usedAt: timestamp("used_at").notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
export type UsedSessionCode = typeof usedSessionCodesTable.$inferSelect;
