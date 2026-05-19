import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tasksTable } from "./tasks";

export const assignmentJournalTable = pgTable("assignment_journal", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  thoughtFootprint: text("thought_footprint"), // Developer thoughts and notes logged during build
  notes: text("notes"),
  feedback: text("feedback"), // Recruiter / interviewer feedback
  status: text("status").notNull().default("pending"), // pending, submitted, passed, failed
  redFlags: text("red_flags"), // JSON or plain text listing observed red flags (unreasonable specs, ghosting, etc)
  redFlagScore: integer("red_flag_score").notNull().default(0), // 0 to 100
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssignmentJournalSchema = createInsertSchema(assignmentJournalTable).omit({ createdAt: true, updatedAt: true });
export type InsertAssignmentJournal = z.infer<typeof insertAssignmentJournalSchema>;
export type AssignmentJournal = typeof assignmentJournalTable.$inferSelect;
