import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contactsTable } from "./contacts";
import { opportunitiesTable } from "./opportunities";

export const sequencesTable = pgTable("sequences", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contactId: text("contact_id").references(() => contactsTable.id, { onDelete: "cascade" }),
  opportunityId: text("opportunity_id").references(() => opportunitiesTable.id, { onDelete: "set null" }),
  name: text("name").notNull().default("Outreach Sequence"),
  steps: text("steps").notNull().default("[]"),
  status: text("status").notNull().default("active"), // active, paused, completed
  currentStep: integer("current_step").notNull().default(1), // 1, 2, 3 (for Day 5, Day 14, Day 30)
  lastOutreachAt: timestamp("last_outreach_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSequenceSchema = createInsertSchema(sequencesTable).omit({ createdAt: true, updatedAt: true });
export type InsertSequence 