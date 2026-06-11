import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "node:module";

// Use createRequire to load the lib subpath, bypassing pdf-parse/index.js
// which unconditionally reads a test PDF at module load time and crashes the server.
const _require = createRequire(import.meta.url);
type PdfParseResult = { text: string; numpages: number; info: unknown; metadata: unknown };
const pdfParse = _require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer,
  options?: Record<string, unknown>,
) => Promise<PdfParseResult>;

const router = Router();

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
    // 1. Download the PDF from Supabase Storage
    req.log.info({ resumeUrl }, "Downloading resume PDF");
    const pdfResponse = await fetch(resumeUrl);
    if (!pdfResponse.ok) {
      res.status(400).json({
        error: `Could not download resume (${pdfResponse.status} ${pdfResponse.statusText}). Make sure the Supabase bucket is public.`,
      });
      return;
    }

    const contentType = pdfResponse.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      req.log.warn({ contentType }, "Unexpected content type for PDF");
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text from PDF
    req.log.info("Extracting text from PDF");
    let resumeText = "";
    try {
      const parsed = await pdfParse(buffer);
      resumeText = parsed.text ?? "";
    } catch (parseErr) {
      req.log.error({ parseErr }, "pdf-parse failed");
      res.status(422).json({
        error: "Could not parse the PDF. It may be corrupted or password-protected.",
      });
      return;
    }

    const trimmed = resumeText.trim();
    if (trimmed.length < 40) {
      res.status(422).json({
        error:
          "The PDF appears to be empty or image-based (scanned). Please upload a text-based PDF.",
      });
      return;
    }

    // 3. Build Gemini prompt
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
- resumeScore: integer 0-100 (score based on completeness, clarity, ATS-friendliness, and formatting)
- skills: flat array of strings (technical tools, languages, frameworks, soft skills)
- education: all degrees/diplomas/courses found
- projects: personal, academic, and professional projects
- certifications: all certifications, licenses, and professional credentials
- summary: specific, professional, highlights the candidate's most impressive attributes
- If a section has no data, return an empty array []
- Return ONLY the JSON object

Resume text:
---
${trimmed.slice(0, 14000)}
---`;

    // 4. Call Gemini
    req.log.info("Calling Gemini API");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps output anyway
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let analysis: unknown;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      req.log.error({ raw }, "Gemini returned non-JSON response");
      res.status(500).json({
        error: "AI returned an unexpected format. Please try again.",
      });
      return;
    }

    const a = analysis as Record<string, unknown>;
    if (typeof a.resumeScore !== "number" || !Array.isArray(a.skills)) {
      req.log.error({ analysis }, "Gemini response missing required fields");
      res.status(500).json({
        error: "AI analysis is incomplete. Please try again.",
      });
      return;
    }

    req.log.info({ score: a.resumeScore }, "Resume analysis complete");
    res.json({ analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    req.log.error({ err }, "Resume analysis error");
    res.status(500).json({ error: message });
  }
});

export default router;
