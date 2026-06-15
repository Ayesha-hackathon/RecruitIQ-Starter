import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  resumeUrl: text("resume_url"),
  resumeFilename: text("resume_filename"),
  analysis: jsonb("analysis"),
  skillGapAnalysis: jsonb("skill_gap_analysis"),
  interviewResult: jsonb("interview_result"),
  uploadedAt: timestamp("uploaded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Candidate = typeof candidatesTable.$inferSelect;
export type InsertCandidate = typeof candidatesTable.$inferInsert;
