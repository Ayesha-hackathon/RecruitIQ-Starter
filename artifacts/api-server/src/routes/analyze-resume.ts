import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
type PdfParseResult = { text: string; numpages: number; info: unknown; metadata: unknown };
const pdfParse = _require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>,
) => Promise<PdfParseResult>;

const router = Router();

// ─── Model chain & retry config ─────────────────────────────────────────────
// Primary model first, then progressively more available fallbacks.
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"] as const;
const MAX_RETRIES_PER_MODEL = 3;
const BASE_BACKOFF_MS = 1500; // 1.5 s → 3 s → 6 s

/** True for 503 / 429 / overloaded errors that are worth retrying. */
function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("service unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("429") ||
    msg.includes("too many requests") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit")
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface GeminiResult {
  rawText: string;
  modelUsed: string;
  attemptNumber: number;
  totalAttempts: number;
}

/**
 * Calls Gemini with automatic retry + exponential backoff.
 * Cycles through MODEL_CHAIN if one model is unavailable.
 * Throws only when all models and all retries are exhausted.
 */
async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  log: { info: (obj: object, msg: string) => void; warn: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void },
): Promise<GeminiResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  let totalAttempts = 0;

  for (const modelName of MODEL_CHAIN) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      totalAttempts++;
      try {
        log.info({ model: modelName, attempt, totalAttempts }, "[analyze] Calling Gemini");
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        log.info(
          { model: modelName, attempt, totalAttempts, responseLength: rawText.length },
          "[analyze] Gemini call succeeded",
        );
        return { rawText, modelUsed: modelName, attemptNumber: attempt, totalAttempts };
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isRetryable(err)) {
          const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          log.warn(
            { model: modelName, attempt, totalAttempts, backoffMs, errMsg },
            "[analyze] 503/overload — backing off before retry",
          );
          if (attempt < MAX_RETRIES_PER_MODEL) {
            await sleep(backoffMs);
            // continue to next attempt
          } else {
            log.warn(
              { model: modelName },
              "[analyze] Max retries reached for model — trying next model",
            );
          }
        } else {
          // Non-retryable error (auth, invalid prompt, etc.) — skip to next model
          log.error(
            { model: modelName, attempt, totalAttempts, errMsg },
            "[analyze] Non-retryable error — moving to next model",
          );
          break; // exit inner retry loop, try next model
        }
      }
    }
  }

  throw new Error(
    "AI service is experiencing high demand across all models. Please wait a moment and try again.",
  );
}

// ─── Safe JSON extractor ────────────────────────────────────────────────────
function extractJson(raw: string): { json: unknown; method: string; cleaned: string } | null {
  // Step 1: strip Gemini 2.5 Flash <think>…</think> reasoning blocks
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Step 2: strip ALL markdown code-fence variants
  text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();

  // Step 3: try direct parse
  try {
    const json = JSON.parse(text);
    return { json, method: "direct", cleaned: text };
  } catch { /* continue */ }

  // Step 4: brace-extraction fallback
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      const json = JSON.parse(slice);
      return { json, method: "brace-extract", cleaned: slice };
    } catch { /* continue */ }
  }

  return null;
}

// ─── Shape normaliser ────────────────────────────────────────────────────────
interface ResumeAnalysis {
  skills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  projects: Array<{ name: string; description: string }>;
  certifications: string[];
  resumeScore: number;
  summary: string;
}

function normalizeAnalysis(raw: unknown): ResumeAnalysis {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ensureStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)) : [];

  return {
    resumeScore:    typeof obj.resumeScore === "number" ? Math.round(obj.resumeScore) : 0,
    summary:        typeof obj.summary === "string" ? obj.summary.trim() : "",
    skills:         ensureStringArray(obj.skills),
    certifications: ensureStringArray(obj.certifications),
    education: Array.isArray(obj.education)
      ? obj.education.map((e) => {
          const ed = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
          return { degree: String(ed.degree ?? ""), institution: String(ed.institution ?? ""), year: String(ed.year ?? "") };
        })
      : [],
    projects: Array.isArray(obj.projects)
      ? obj.projects.map((p) => {
          const pr = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
          return { name: String(pr.name ?? ""), description: String(pr.description ?? "") };
        })
      : [],
  };
}

// ─── Route ──────────────────────────────────────────────────────────────────
router.post("/analyze-resume", async (req, res) => {
  const { resumeUrl } = req.body as { resumeUrl?: string };

  if (!resumeUrl || typeof resumeUrl !== "string") {
    res.status(400).json({ error: "resumeUrl is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not set");
    res.status(500).json({ error: "AI service is not configured on the server." });
    return;
  }

  try {
    // 1. Download PDF
    req.log.info({ resumeUrl }, "[analyze] Downloading resume PDF");
    const pdfResponse = await fetch(resumeUrl);
    if (!pdfResponse.ok) {
      res.status(400).json({
        error: `Could not download resume (${pdfResponse.status} ${pdfResponse.statusText}). Make sure the Supabase bucket is public.`,
      });
      return;
    }

    const contentType = pdfResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      req.log.warn({ contentType }, "[analyze] Unexpected content-type for PDF");
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text from PDF
    req.log.info("[analyze] Extracting text from PDF");
    let resumeText = "";
    try {
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text ?? "";
    } catch (parseErr) {
      req.log.error({ parseErr }, "[analyze] pdf-parse failed");
      res.status(422).json({ error: "Could not parse the PDF. It may be corrupted or password-protected." });
      return;
    }

    const trimmed = resumeText.trim();
    req.log.info({ charCount: trimmed.length }, "[analyze] PDF text extracted");

    if (trimmed.length < 40) {
      res.status(422).json({
        error: "The PDF appears to be empty or image-based (scanned). Please upload a text-based PDF.",
      });
      return;
    }

    // 3. Build prompt
    const prompt = `You are an expert resume analyzer. Analyze the resume text below and respond with ONLY a valid JSON object — no markdown, no code fences, no extra text.

Required JSON structure:
{
  "skills": ["skill1", "skill2"],
  "education": [{"degree": "...", "institution": "...", "year": "..."}],
  "projects": [{"name": "...", "description": "..."}],
  "certifications": ["cert1", "cert2"],
  "resumeScore": 85,
  "summary": "2-3 sentence professional summary highlighting key strengths."
}

Rules:
- resumeScore: integer 0-100
- skills: flat string array
- education: all degrees/diplomas found
- projects: personal, academic, professional projects
- certifications: all certifications and professional credentials
- summary: specific, professional, 2-3 sentences
- If a section has no data, return an empty array []
- Return ONLY the JSON object, no other text

Resume text:
---
${trimmed.slice(0, 14000)}
---`;

    // 4. Call Gemini with retry + model fallback chain
    const geminiResult = await callGeminiWithRetry(apiKey, prompt, req.log);
    const { rawText, modelUsed, attemptNumber, totalAttempts } = geminiResult;

    // ── DEBUG: log full raw response ─────────────────────────────────────
    req.log.info(
      { modelUsed, attemptNumber, totalAttempts, rawLength: rawText.length, rawFull: rawText },
      "[analyze][DEBUG] Gemini raw response",
    );

    // 5. Parse JSON
    const extracted = extractJson(rawText);

    req.log.info(
      {
        extractionMethod: extracted?.method ?? "FAILED",
        cleanedPreview: extracted?.cleaned?.slice(0, 300),
        extractedKeys: extracted?.json && typeof extracted.json === "object"
          ? Object.keys(extracted.json as object)
          : null,
      },
      "[analyze][DEBUG] Extraction result",
    );

    if (!extracted) {
      req.log.error({ rawText }, "[analyze] All JSON extraction attempts failed");
      res.status(500).json({
        error: "AI returned an unexpected format. Please try again.",
        _debug: { rawText, extractionMethod: "FAILED", modelUsed, totalAttempts },
      });
      return;
    }

    // 6. Normalise shape
    const analysis = normalizeAnalysis(extracted.json);

    req.log.info(
      {
        modelUsed, totalAttempts,
        score: analysis.resumeScore,
        skillsCount: analysis.skills.length,
        educationCount: analysis.education.length,
        projectsCount: analysis.projects.length,
        certificationsCount: analysis.certifications.length,
        summaryLength: analysis.summary.length,
      },
      "[analyze] Resume analysis complete",
    );

    res.json({
      analysis,
      _debug: {
        rawText,
        rawLength: rawText.length,
        modelUsed,
        attemptNumber,
        totalAttempts,
        extractionMethod: extracted.method,
        cleanedText: extracted.cleaned,
        parsedKeys: Object.keys(extracted.json && typeof extracted.json === "object" ? extracted.json as object : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    const isHighDemand =
      message.toLowerCase().includes("high demand") ||
      message.toLowerCase().includes("unavailable");

    req.log.error({ err }, "[analyze] Unhandled error in resume analysis");
    res.status(isHighDemand ? 503 : 500).json({ error: message, isHighDemand });
  }
});

export default router;
