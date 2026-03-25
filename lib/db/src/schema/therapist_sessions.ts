import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const authSessionsTable = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  therapistId: text("therapist_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type AuthSession = typeof authSessionsTable.$inferSelect;
