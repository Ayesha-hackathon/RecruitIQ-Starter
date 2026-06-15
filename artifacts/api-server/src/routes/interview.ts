import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// ─── Retry helpers ────────────────────────────────────────────────────────────
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"] as const;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1500;

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("503") || msg.includes("service unavailable") ||
    msg.includes("overloaded") || msg.includes("resource_exhausted") ||
    msg.includes("429") || msg.includes("too many requests") ||
    msg.includes("quota exceeded") || msg.includes("rate limit");
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function callGemini(
  apiKey: string,
  prompt: string,
  log: { info: (obj: object, msg: string) => void; warn: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
): Promise<{ rawText: string; modelUsed: string; totalAttempts: number }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let totalAttempts = 0;
  for (const modelName of MODEL_CHAIN) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      totalAttempts++;
      try {
        const result = await model.generateContent(prompt);
        return { rawText: result.response.text(), modelUsed: modelName, totalAttempts };
      } catch (err: unknown) {
        if (isRetryable(err)) {
          const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          log.warn({ model: modelName, attempt, backoffMs }, "[interview] Retryable error — backing off");
          if (attempt < MAX_RETRIES) await sleep(backoffMs);
        } else {
          log.error({ model: modelName, err: err instanceof Error ? err.message : err }, "[interview] Non-retryable — next model");
          break;
        }
      }
    }
  }
  throw new Error("AI service is experiencing high demand. Please try again in a moment.");
}

function extractJson(raw: string): unknown | null {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
  try { return JSON.parse(text); } catch { /* continue */ }
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConversationTurn {
  questionNumber: number;
  difficulty: string;
  topic: string;
  question: string;
  answer?: string;
  evaluationScore?: number;
}

// ─── POST /api/interview/next ─────────────────────────────────────────────────
// Evaluates last answer (if any) and returns the next question.
router.post("/interview/next", async (req, res) => {
  const { role, skills, conversationHistory, questionNumber } = req.body as {
    role?: string;
    skills?: string[];
    conversationHistory?: ConversationTurn[];
    questionNumber?: number;
  };

  if (!role || !Array.isArray(skills) || skills.length === 0 || typeof questionNumber !== "number") {
    res.status(400).json({ error: "role, skills[], and questionNumber are required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "AI service is not configured on the server." });
    return;
  }

  const history = conversationHistory ?? [];
  const lastTurn = history.length > 0 ? history[history.length - 1] : null;
  const isFirstQuestion = questionNumber === 1;

  // Derive current difficulty based on score history
  const scores = history.filter((t) => t.evaluationScore !== undefined).map((t) => t.evaluationScore as number);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
  const lastScore = scores.length > 0 ? scores[scores.length - 1] : 50;

  let targetDifficulty: string;
  if (isFirstQuestion) {
    targetDifficulty = "beginner";
  } else if (lastScore >= 75) {
    targetDifficulty = avgScore >= 70 ? "advanced" : "intermediate";
  } else if (lastScore < 45) {
    targetDifficulty = "beginner";
  } else {
    targetDifficulty = "intermediate";
  }

  const coveredTopics = history.map((t) => t.topic).filter(Boolean);
  const historyText = history.map((t) =>
    `Q${t.questionNumber} [${t.difficulty}] (${t.topic}): ${t.question}\nAnswer: ${t.answer ?? "(no answer)"}\n`
  ).join("\n");

  const prompt = isFirstQuestion
    ? `You are an expert technical interviewer conducting a ${role} interview.

Candidate skills: ${skills.join(", ")}
Interview question: 1 of 10
Target difficulty: beginner

Generate the FIRST interview question. Start easy — pick the candidate's strongest skill and ask a clear, foundational question to gauge baseline understanding.

Return ONLY a JSON object:
{
  "question": "Your interview question here",
  "difficulty": "beginner",
  "topic": "topic area (e.g. React, Python, Docker)",
  "rationale": "1 sentence explaining why you chose this question"
}

Rules:
- question: clear, specific technical question
- difficulty: exactly "beginner"
- topic: single concise topic name
- Return ONLY the JSON object`

    : `You are an expert technical interviewer conducting a ${role} interview.

Candidate skills: ${skills.join(", ")}
Current question: ${questionNumber} of 10
Target difficulty for next question: ${targetDifficulty}
Topics already covered: ${coveredTopics.join(", ") || "none"}
Average score so far: ${Math.round(avgScore)}/100

Interview history:
${historyText}
Last answer to evaluate: "${lastTurn?.answer ?? ""}"

Evaluate the last answer AND generate the next question.

Return ONLY a JSON object:
{
  "evaluation": {
    "score": 72,
    "feedback": "2-3 sentences of specific, constructive feedback on the answer",
    "strengths": ["specific strength 1", "specific strength 2"]
  },
  "question": "Your next interview question here",
  "difficulty": "${targetDifficulty}",
  "topic": "topic area for next question — pick a DIFFERENT topic from: ${coveredTopics.join(", ")}",
  "rationale": "1 sentence why this next question"
}

Rules:
- evaluation.score: integer 0-100 reflecting technical accuracy and clarity
- evaluation.feedback: honest, specific, professional
- question: appropriate for ${targetDifficulty} difficulty ${role} role
- topic: must be DIFFERENT from already-covered topics
- Return ONLY the JSON object`;

  try {
    const { rawText, modelUsed, totalAttempts } = await callGemini(apiKey, prompt, req.log);
    req.log.info({ questionNumber, targetDifficulty, modelUsed, totalAttempts }, "[interview/next] Gemini response");

    const parsed = extractJson(rawText) as Record<string, unknown> | null;
    if (!parsed) {
      res.status(500).json({ error: "AI returned unexpected format. Please try again.", _debug: { rawText } });
      return;
    }

    // Normalize evaluation (if present)
    let evaluation: { score: number; feedback: string; strengths: string[] } | undefined;
    if (!isFirstQuestion && parsed.evaluation && typeof parsed.evaluation === "object") {
      const ev = parsed.evaluation as Record<string, unknown>;
      evaluation = {
        score: typeof ev.score === "number" ? Math.min(100, Math.max(0, Math.round(ev.score))) : 50,
        feedback: typeof ev.feedback === "string" ? ev.feedback.trim() : "",
        strengths: Array.isArray(ev.strengths) ? ev.strengths.map(String) : [],
      };
    }

    res.json({
      question: typeof parsed.question === "string" ? parsed.question.trim() : "",
      difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : targetDifficulty,
      topic: typeof parsed.topic === "string" ? parsed.topic.trim() : "Technical",
      questionNumber,
      evaluation,
      _debug: { modelUsed, totalAttempts },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Interview failed";
    const isHighDemand = message.toLowerCase().includes("high demand");
    res.status(isHighDemand ? 503 : 500).json({ error: message, isHighDemand });
  }
});

// ─── POST /api/interview/evaluate ─────────────────────────────────────────────
// Generates the final holistic evaluation after all questions are answered.
router.post("/interview/evaluate", async (req, res) => {
  const { role, skills, conversationHistory } = req.body as {
    role?: string;
    skills?: string[];
    conversationHistory?: ConversationTurn[];
  };

  if (!role || !Array.isArray(skills) || !Array.isArray(conversationHistory)) {
    res.status(400).json({ error: "role, skills[], and conversationHistory[] are required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "AI service is not configured." });
    return;
  }

  const historyText = conversationHistory.map((t) =>
    `Q${t.questionNumber} [${t.difficulty}] (${t.topic}):\nQuestion: ${t.question}\nAnswer: ${t.answer ?? "(no answer)"}\nScore: ${t.evaluationScore ?? "?"}/100\n`
  ).join("\n---\n");

  const prompt = `You are a senior technical recruiter providing a final comprehensive evaluation for a ${role} interview.

Candidate skills: ${skills.join(", ")}

Complete interview transcript:
${historyText}

Provide a detailed final evaluation. Return ONLY a JSON object:
{
  "technicalScore": 78,
  "communicationScore": 82,
  "confidenceScore": 75,
  "problemSolvingScore": 80,
  "strengths": ["Clear explanation of concepts", "Good practical examples", "Strong foundation in React"],
  "weaknesses": ["Limited system design knowledge", "Could elaborate more on tradeoffs"],
  "recommendation": "2-3 sentence overall hiring recommendation including readiness level and next steps"
}

Rules:
- All scores: integers 0-100 reflecting the full interview performance
- technicalScore: accuracy and depth of technical knowledge
- communicationScore: clarity, structure, and articulation of answers
- confidenceScore: decisiveness, specificity, and conviction in responses
- problemSolvingScore: approach to problems, reasoning quality
- strengths: 3-5 specific, evidence-based strengths from the interview
- weaknesses: 2-4 specific areas for improvement with context
- recommendation: professional, actionable, balanced
- Return ONLY the JSON object`;

  try {
    const { rawText, modelUsed, totalAttempts } = await callGemini(apiKey, prompt, req.log);
    req.log.info({ modelUsed, totalAttempts }, "[interview/evaluate] Final evaluation generated");

    const parsed = extractJson(rawText) as Record<string, unknown> | null;
    if (!parsed) {
      res.status(500).json({ error: "AI returned unexpected format.", _debug: { rawText } });
      return;
    }

    const strArr = (v: unknown) => Array.isArray(v) ? v.map(String) : [];
    const numField = (v: unknown, fallback: number) =>
      typeof v === "number" ? Math.min(100, Math.max(0, Math.round(v))) : fallback;

    res.json({
      technicalScore:      numField(parsed.technicalScore,      65),
      communicationScore:  numField(parsed.communicationScore,  65),
      confidenceScore:     numField(parsed.confidenceScore,      60),
      problemSolvingScore: numField(parsed.problemSolvingScore, 65),
      strengths:           strArr(parsed.strengths),
      weaknesses:          strArr(parsed.weaknesses),
      recommendation:      typeof parsed.recommendation === "string" ? parsed.recommendation.trim() : "",
      completedAt:         new Date().toISOString(),
      _debug:              { modelUsed, totalAttempts },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Evaluation failed";
    const isHighDemand = message.toLowerCase().includes("high demand");
    res.status(isHighDemand ? 503 : 500).json({ error: message, isHighDemand });
  }
});

export default router;
