import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// ─── Role → expected skill set ───────────────────────────────────────────────
const ROLE_SKILLS: Record<string, string[]> = {
  "AI Engineer": [
    "Python", "TensorFlow", "PyTorch", "LangChain", "OpenAI API", "Transformers",
    "LLMs", "Vector Databases", "Prompt Engineering", "MLOps", "Docker", "FastAPI",
    "RAG", "Embeddings", "Fine-tuning",
  ],
  "Machine Learning Engineer": [
    "Python", "Scikit-learn", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Feature Engineering", "Model Deployment", "MLflow", "Kubernetes", "SQL",
    "Statistics", "A/B Testing", "Data Pipelines", "Spark",
  ],
  "Data Scientist": [
    "Python", "R", "SQL", "Pandas", "NumPy", "Scikit-learn", "Statistics",
    "Data Visualization", "Tableau", "Power BI", "Machine Learning", "Jupyter",
    "A/B Testing", "Hypothesis Testing", "Spark",
  ],
  "Frontend Developer": [
    "React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS",
    "Next.js", "Vite", "GraphQL", "REST APIs", "Testing (Jest/Vitest)",
    "Responsive Design", "Accessibility", "Performance Optimization", "Git",
  ],
  "Backend Developer": [
    "Node.js", "TypeScript", "Python", "SQL", "PostgreSQL", "REST APIs",
    "GraphQL", "Docker", "Redis", "Message Queues", "Authentication/JWT",
    "CI/CD", "Microservices", "Testing", "Cloud (AWS/GCP/Azure)",
  ],
  "Full Stack Developer": [
    "React", "Node.js", "TypeScript", "SQL", "PostgreSQL", "REST APIs",
    "Docker", "Git", "CI/CD", "Authentication", "Testing", "Next.js",
    "Cloud Deployment", "CSS/Tailwind", "GraphQL",
  ],
  "DevOps Engineer": [
    "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "CI/CD",
    "Jenkins", "GitHub Actions", "Linux", "Shell Scripting", "Monitoring",
    "Prometheus", "Grafana", "Ansible",
  ],
};

// ─── Retry helpers (same pattern as analyze-resume) ──────────────────────────
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"] as const;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1500;

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("503") || msg.includes("service unavailable") ||
    msg.includes("overloaded") || msg.includes("resource_exhausted") ||
    msg.includes("429") || msg.includes("too many requests") ||
    msg.includes("quota exceeded") || msg.includes("rate limit")
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface GeminiResult { rawText: string; modelUsed: string; totalAttempts: number; }

async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  log: { info: (obj: object, msg: string) => void; warn: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
): Promise<GeminiResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let totalAttempts = 0;
  for (const modelName of MODEL_CHAIN) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      totalAttempts++;
      try {
        log.info({ model: modelName, attempt, totalAttempts }, "[skill-gap] Calling Gemini");
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        log.info({ model: modelName, totalAttempts }, "[skill-gap] Gemini succeeded");
        return { rawText, modelUsed: modelName, totalAttempts };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isRetryable(err)) {
          const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          log.warn({ model: modelName, attempt, backoffMs, errMsg }, "[skill-gap] Retryable error — backing off");
          if (attempt < MAX_RETRIES) await sleep(backoffMs);
        } else {
          log.error({ model: modelName, errMsg }, "[skill-gap] Non-retryable — next model");
          break;
        }
      }
    }
  }
  throw new Error("AI service is experiencing high demand. Please try again in a moment.");
}

// ─── JSON extractor ───────────────────────────────────────────────────────────
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

// ─── Skill gap normaliser ─────────────────────────────────────────────────────
export interface SkillGapResult {
  role: string;
  matchedSkills: string[];
  missingSkills: string[];
  readinessScore: number;
  recommendations: string[];
  analyzedAt: string;
}

function normalizeSkillGap(raw: unknown, role: string): SkillGapResult {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const strArr = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : [];
  return {
    role,
    matchedSkills:   strArr(obj.matchedSkills),
    missingSkills:   strArr(obj.missingSkills),
    readinessScore:  typeof obj.readinessScore === "number" ? Math.min(100, Math.max(0, Math.round(obj.readinessScore))) : 0,
    recommendations: strArr(obj.recommendations),
    analyzedAt:      new Date().toISOString(),
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.post("/skill-gap", async (req, res) => {
  const { skills, role } = req.body as { skills?: unknown; role?: unknown };

  if (!Array.isArray(skills) || skills.length === 0) {
    res.status(400).json({ error: "skills array is required and must not be empty" });
    return;
  }
  if (!role || typeof role !== "string" || !ROLE_SKILLS[role]) {
    res.status(400).json({ error: `role must be one of: ${Object.keys(ROLE_SKILLS).join(", ")}` });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "AI service is not configured on the server." });
    return;
  }

  const expectedSkills = ROLE_SKILLS[role];
  const candidateSkills = (skills as unknown[]).map(String).join(", ");

  const prompt = `You are an expert technical recruiter performing a skill gap analysis.

Role: ${role}
Expected skills for this role: ${expectedSkills.join(", ")}
Candidate's current skills: ${candidateSkills}

Analyze the candidate's skills against the role requirements and respond with ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "readinessScore": 72,
  "recommendations": ["specific actionable recommendation 1", "recommendation 2", "recommendation 3"]
}

Rules:
- matchedSkills: candidate skills that are relevant and useful for the ${role} role
- missingSkills: important skills for ${role} that the candidate is missing or hasn't listed
- readinessScore: integer 0-100 reflecting overall role readiness (consider depth, not just breadth)
- recommendations: 3-5 specific, actionable learning recommendations (e.g. "Complete the LangChain crash course to build production RAG pipelines")
- Return ONLY the JSON object, no other text`;

  try {
    const { rawText, modelUsed, totalAttempts } = await callGeminiWithRetry(apiKey, prompt, req.log);

    req.log.info({ modelUsed, totalAttempts, rawLength: rawText.length }, "[skill-gap] Raw response");

    const parsed = extractJson(rawText);
    if (!parsed) {
      res.status(500).json({ error: "AI returned an unexpected format. Please try again.", _debug: { rawText } });
      return;
    }

    const result = normalizeSkillGap(parsed, role);

    req.log.info(
      { role, readinessScore: result.readinessScore, matched: result.matchedSkills.length, missing: result.missingSkills.length, modelUsed, totalAttempts },
      "[skill-gap] Analysis complete",
    );

    res.json({ result, _debug: { modelUsed, totalAttempts } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Skill gap analysis failed";
    const isHighDemand = message.toLowerCase().includes("high demand") || message.toLowerCase().includes("unavailable");
    req.log.error({ err }, "[skill-gap] Unhandled error");
    res.status(isHighDemand ? 503 : 500).json({ error: message, isHighDemand });
  }
});

export default router;
