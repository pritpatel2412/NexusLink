import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { contactsTable } from "./contacts";
import { tasksTable } from "./tasks";

export const remindersTable = pgTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  contactId: text("contact_id").references(() => contactsTable.id, { onDelete: "set null" }),
  taskId: text("task_id").references(() => tasksTable.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReminderSchema = createInsertSchema(remindersTable).omit({ createdAt: true, sent: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;
