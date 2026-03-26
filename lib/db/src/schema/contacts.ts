import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const contactsTable = pgTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  company: text("company"),
  role: text("role"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  website: text("website"),
  avatarUrl: text("avatar_url"),
  whereMet: text("where_met"),
  introducedBy: text("introduced_by"),
  topicsDiscussed: text("topics_discussed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactTagsTable = pgTable("contact_tags", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull().references(() => contactsTable.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  color: text("color").notNull().default("#6C63FF"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({ createdAt: true, updatedAt: true });
export const insertContactTagSchema = createInsertSchema(contactTagsTable).omit({ createdAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
export type InsertContactTag = z.infer<typeof insertContactTagSchema>;
export type ContactTag = typeof contactTagsTable.$inferSelect;
