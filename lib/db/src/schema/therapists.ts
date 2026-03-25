import { pgTable, serial, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const therapistStatusEnum = pgEnum("therapist_status", ["pending", "active"]);

export const therapistsTable = pgTable("therapists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: therapistStatusEnum("status").notNull().default("pending"),
  isAdmin: boolean("is_admin").notNull().default(false),
  activationToken: text("activation_token"),
  activationTokenExpiry: timestamp("activation_token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTherapistSchema = createInsertSchema(therapistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTherapist = z.infer<typeof insertTherapistSchema>;
export type Therapist = typeof therapistsTable.$inferSelect;
