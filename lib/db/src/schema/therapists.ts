import { pgTable, serial, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const therapistStatusEnum = pgEnum("therapist_status", ["pending", "active"]);

export const therapistsTable = pgTable("therapists", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: therapistStatusEnum("status").notNull().default("pending"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Therapist = typeof therapistsTable.$inferSelect;
export type InsertTherapist = typeof therapistsTable.$inferInsert;
