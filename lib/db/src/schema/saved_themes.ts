import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { therapistsTable } from "./therapists";

export const savedThemesTable = pgTable("saved_themes", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull().references(() => therapistsTable.id),
  dotColor: text("dot_color").notNull(),
  backgroundColor: text("background_color").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSavedThemeSchema = createInsertSchema(savedThemesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSavedTheme = z.infer<typeof insertSavedThemeSchema>;
export type SavedTheme = typeof savedThemesTable.$inferSelect;
