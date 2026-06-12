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

// ─── Safe JSON extractor ────────────────────────────────────────────────────
// Handles all three Gemini output patterns:
//   Case 1 – pure JSON            { "skills": [] }
//   Case 2 – markdown-fenced      ```json\n{ ... }\n```
//   Case 3 – text before/after    "Here is the analysis:\n{ ... }\nDone."
function extractJson(raw: string): { json: unknown; method: string; cleaned: string } | null {
  // Step 1: strip Gemini 2.5 Flash <think>…</think> reasoning blocks
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Step 2: strip ALL markdown code-fence variants (multiline-safe)
  text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();

  // Step 3: try direct parse on the cleaned text
  try {
    const json = JSON.parse(text);
    return { json, method: "direct", cleaned: text };
  } catch { /* continue */ }

  // Step 4: brace-extraction fallback — find outermost { … }
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
// Guarantees the caller always receives a fully-typed object even if Gemini
// omits a field or returns it with the wrong type.
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
    resumeScore: typeof obj.resumeScore === "number" ? Math.round(obj.resumeScore) : 0,
    summary:     typeof obj.summary === "string" ? obj.summary.trim() : "",
    skills:      ensureStringArray(obj.skills),
    certifications: ensureStringArray(obj.certifications),
    education: Array.isArray(obj.education)
      ? obj.education.map((e) => {
          const ed = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
          return {
            degree:      String(ed.degree      ?? ""),
            institution: String(ed.institution ?? ""),
            year:        String(ed.year        ?? ""),
          };
        })
      : [],
    projects: Array.isArray(obj.projects)
      ? obj.projects.map((p) => {
          const pr = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
          return {
            name:        String(pr.name        ?? ""),
            description: String(pr.description ?? ""),
          };
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

    // 2. Extract text
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

    // 4. Call Gemini
    req.log.info("[analyze] Calling Gemini API");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // ── DEBUG: log FULL raw response ──────────────────────────────────────
    req.log.info(
      {
        rawLength: rawText.length,
        rawPreview: rawText.slice(0, 800),
        rawFull: rawText,          // full text for server logs
      },
      "[analyze][DEBUG] Gemini raw response",
    );
    // ─────────────────────────────────────────────────────────────────────

    // 5. Parse JSON with robust extractor
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
        _debug: { rawText, extractionMethod: "FAILED" },
      });
      return;
    }

    // 6. Normalise — guarantees shape even if Gemini omitted a field
    const analysis = normalizeAnalysis(extracted.json);

    req.log.info(
      {
        score: analysis.resumeScore,
        skillsCount: analysis.skills.length,
        educationCount: analysis.education.length,
        projectsCount: analysis.projects.length,
        certificationsCount: analysis.certifications.length,
        summaryLength: analysis.summary.length,
      },
      "[analyze] Resume analysis complete",
    );

    // Return analysis + debug payload so the frontend can inspect it
    res.json({
      analysis,
      _debug: {
        rawText,
        rawLength: rawText.length,
        extractionMethod: extracted.method,
        cleanedText: extracted.cleaned,
        parsedKeys: Object.keys(extracted.json && typeof extracted.json === "object" ? extracted.json as object : {}),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    req.log.error({ err }, "[analyze] Unhandled error in resume analysis");
    res.status(500).json({ error: message });
  }
});

export default router;
