import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const workArtifactsTable = pgTable("work_artifacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("github"), // github, live, figma, case-study, video
  artifactUrl: text("artifact_url").notNull(),
  metrics: text("metrics"), // e.g. "50% faster API", "10k signups"
  skills: text("skills"), // stringified JSON array or plain text of skills mapped
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkArtifactSchema = createInsertSchema(workArtifactsTable).omit({ createdAt: true });
export type InsertWorkArtifact = z.infer<typeof insertWorkArtifactSchema>;
export type WorkArtifact = typeof workArtifactsTable.$inferSelect;
