import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUserId(req: import("express").Request): string | null {
  return (req.headers["x-replit-user-id"] as string) || null;
}

router.get("/candidates/me", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  try {
    const [row] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.userId, userId));

    res.json({ candidate: row ?? null });
  } catch (err) {
    req.log.error({ err }, "[candidates] Failed to fetch candidate");
    res.status(500).json({ error: "Failed to fetch candidate data" });
  }
});

router.patch("/candidates/me/analysis", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { analysis } = req.body as { analysis?: unknown };
  if (!analysis) { res.status(400).json({ error: "analysis is required" }); return; }

  try {
    await db
      .insert(candidatesTable)
      .values({ userId, analysis, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: candidatesTable.userId,
        set: { analysis, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[candidates] Failed to update analysis");
    res.status(500).json({ error: "Failed to save analysis" });
  }
});

router.patch("/candidates/me/skill-gap", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { skillGapAnalysis } = req.body as { skillGapAnalysis?: unknown };
  if (!skillGapAnalysis) { res.status(400).json({ error: "skillGapAnalysis is required" }); return; }

  try {
    await db
      .insert(candidatesTable)
      .values({ userId, skillGapAnalysis, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: candidatesTable.userId,
        set: { skillGapAnalysis, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[candidates] Failed to update skill gap");
    res.status(500).json({ error: "Failed to save skill gap analysis" });
  }
});

router.patch("/candidates/me/interview-result", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const { interviewResult } = req.body as { interviewResult?: unknown };
  if (!interviewResult) { res.status(400).json({ error: "interviewResult is required" }); return; }

  try {
    await db
      .insert(candidatesTable)
      .values({ userId, interviewResult, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: candidatesTable.userId,
        set: { interviewResult, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[candidates] Failed to update interview result");
    res.status(500).json({ error: "Failed to save interview result" });
  }
});

export default router;
