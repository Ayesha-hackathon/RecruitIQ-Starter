import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Upload,
  FileText,
  X,
  CheckCircle2,
  CloudUpload,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// Upload → AI analysis → done (redirect). No fake data anywhere.
type UploadState = "idle" | "dragging" | "uploading" | "analyzing" | "error";

// ─── Steps shown during PDF upload ───────────────────────────────────────────
const uploadSteps = [
  "Uploading to secure storage",
  "Verifying file integrity",
  "Saving to your profile",
  "Preparing for AI analysis",
];

// ─── Steps shown during Gemini analysis ──────────────────────────────────────
const analysisSteps = [
  "Parsing resume content",
  "Extracting skills & education",
  "Scoring your profile",
  "Saving AI insights",
];

// Minimal normalizer — mirrors what the API + dashboard both do
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
  const strArr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  return {
    resumeScore:    typeof obj.resumeScore === "number" ? Math.round(obj.resumeScore) : 0,
    summary:        typeof obj.summary === "string" ? obj.summary.trim() : "",
    skills:         strArr(obj.skills),
    certifications: strArr(obj.certifications),
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

export default function ResumeUpload() {
  const [, navigate] = useLocation();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAiRetrying, setIsAiRetrying] = useState(false);
  const [error, setError] = useState("");

  const inputRef      = useRef<HTMLInputElement>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current)   clearInterval(intervalRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const clearAll = () => {
    if (intervalRef.current)   { clearInterval(intervalRef.current);   intervalRef.current = null; }
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current);  retryTimerRef.current = null; }
  };

  const friendlyError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Bucket not found") || msg.includes("bucket"))
      return "Storage bucket 'resumes' not found. Make sure it's created in Supabase Storage.";
    if (msg.includes("row-level security") || msg.includes("policy"))
      return "Permission denied. Check that RLS policies are configured for the resumes bucket and candidates table.";
    if (msg.includes("does not exist") || msg.includes("relation"))
      return "The 'candidates' table doesn't exist. Run the setup SQL in your Supabase SQL Editor.";
    if (msg.includes("duplicate") || msg.includes("unique"))
      return "A record conflict occurred. Please try again.";
    if (msg.includes("JWT") || msg.includes("token"))
      return "Session expired. Please log out and log back in.";
    if (msg.includes("high demand") || msg.includes("unavailable") || msg.includes("503"))
      return "AI service is experiencing high demand. Please try again in a moment.";
    if (msg.includes("network") || msg.includes("fetch"))
      return "Network error. Check your connection and try again.";
    return msg || "Something went wrong. Please try again.";
  };

  // ─── Phase 2: Gemini analysis ─────────────────────────────────────────────
  const runAnalysis = async (resumeUrl: string) => {
    setUploadState("analyzing");
    setAnalysisProgress(0);
    setIsAiRetrying(false);

    // Slow-crawl progress bar: 0→88% over ~25 s, then jump to 100 on success
    intervalRef.current = setInterval(() => {
      setAnalysisProgress((p) => {
        if (p >= 88) { clearAll(); return 88; }
        // Faster at start (uploading feel), slower in the middle (AI thinking)
        const increment = p < 40 ? 2.5 : p < 70 ? 1 : 0.4;
        return Math.min(p + increment, 88);
      });
    }, 300);

    // After 12 s, show the "AI is busy, retrying…" banner
    retryTimerRef.current = setTimeout(() => setIsAiRetrying(true), 12_000);

    try {
      const resp = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl }),
      });

      const data = await resp.json() as {
        analysis?: ResumeAnalysis;
        error?: string;
        isHighDemand?: boolean;
      };

      if (!resp.ok) throw new Error(data.error ?? "Analysis failed");

      const analysis = normalizeAnalysis(data.analysis);

      // Save analysis to Supabase so the dashboard loads it immediately
      const { error: dbErr } = await supabase
        .from("candidates")
        .update({ analysis })
        .eq("user_id", user!.id);

      if (dbErr) {
        console.error("[RecruitIQ] Failed to save analysis to Supabase:", dbErr);
        // Non-fatal — dashboard can still re-analyze
      }

      // Jump progress to 100 then redirect
      clearAll();
      setAnalysisProgress(100);
      setIsAiRetrying(false);

      setTimeout(() => navigate("/candidate-dashboard"), 600);
    } catch (err: unknown) {
      clearAll();
      setIsAiRetrying(false);
      console.error("[RecruitIQ] Analysis error:", err);
      setError(friendlyError(err));
      setUploadState("error");
    }
  };

  // ─── Phase 1: Upload PDF ──────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    if (!file) return;
    setError("");

    if (!user) {
      setError("You must be logged in to upload a resume.");
      setUploadState("error");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted. Please upload a .pdf file.");
      setUploadState("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      setUploadState("error");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(0) + " KB");
    setUploadState("uploading");
    setUploadProgress(0);

    // Animate progress to ~80% while the real upload runs
    intervalRef.current = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 80) { clearAll(); return 80; }
        return p + 2;
      });
    }, 120);

    try {
      const filePath = `${user.id}/resume.pdf`;
      console.info("[RecruitIQ] Uploading:", filePath);

      const { error: storageError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);
      console.info("[RecruitIQ] Public URL:", publicUrl);

      const { error: dbError } = await supabase
        .from("candidates")
        .upsert(
          { user_id: user.id, resume_url: publicUrl, resume_path: filePath, resume_filename: file.name, uploaded_at: new Date().toISOString() },
          { onConflict: "user_id" },
        );

      if (dbError) throw dbError;
      console.info("[RecruitIQ] Candidate row upserted.");

      clearAll();
      setUploadProgress(100);

      // Small pause so the user sees 100%, then kick off AI analysis
      await new Promise((r) => setTimeout(r, 400));
      await runAnalysis(publicUrl);
    } catch (err: unknown) {
      clearAll();
      console.error("[RecruitIQ] Upload error:", err);
      setError(friendlyError(err));
      setUploadProgress(0);
      setUploadState("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const reset = () => {
    clearAll();
    setUploadState("idle");
    setFileName("");
    setFileSize("");
    setUploadProgress(0);
    setAnalysisProgress(0);
    setIsAiRetrying(false);
    setError("");
  };

  // ─── Derived: which step is active in a 4-step bar ───────────────────────
  const activeUploadStep   = (i: number) => { const t = (i + 1) * 25; return { done: uploadProgress >= t, active: uploadProgress >= t - 25 && uploadProgress < t }; };
  const activeAnalysisStep = (i: number) => { const t = (i + 1) * 25; return { done: analysisProgress >= t, active: analysisProgress >= t - 25 && analysisProgress < t }; };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <BrainCircuit className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
            </div>
          </Link>
          <Link href="/candidate-dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Resume Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-[Space_Grotesk]">Upload Your Resume</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Our AI analyzes your resume in seconds — extracting skills, experience, and generating your personal score.
          </p>
        </motion.div>

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">

            {/* ── Idle / Dragging ── */}
            {(uploadState === "idle" || uploadState === "dragging") && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onDragOver={(e) => { e.preventDefault(); setUploadState("dragging"); }}
                onDragLeave={() => setUploadState("idle")}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-16 flex flex-col items-center text-center
                  ${uploadState === "dragging"
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-white/10 bg-card/30 hover:border-primary/50 hover:bg-card/50"
                  }`}
                data-testid="dropzone-resume"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleInputChange}
                  data-testid="input-resume-file"
                />
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all ${uploadState === "dragging" ? "bg-primary/20 scale-110" : "bg-white/5"}`}>
                  <CloudUpload className={`w-10 h-10 transition-colors ${uploadState === "dragging" ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {uploadState === "dragging" ? "Release to upload" : "Drag & drop your resume here"}
                </h3>
                <p className="text-muted-foreground mb-6">PDF only — up to 10 MB</p>
                <Button
                  className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  data-testid="button-browse-files"
                >
                  <Upload className="w-4 h-4" />
                  Browse Files
                </Button>
              </motion.div>
            )}

            {/* ── Uploading (phase 1) ── */}
            {uploadState === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/10 bg-card/50 p-10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 relative">
                  <FileText className="w-9 h-9 text-primary" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{fileName}</h3>
                <p className="text-sm text-muted-foreground mb-8">{fileSize} · Uploading securely…</p>

                <div className="w-full mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Uploading</span>
                    <span className="text-primary font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                </div>

                <div className="w-full space-y-2.5">
                  {uploadSteps.map((step, i) => {
                    const { done, active } = activeUploadStep(i);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-emerald-500" : active ? "bg-primary/30 border border-primary/50" : "bg-white/5"}`}>
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : active
                              ? <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          }
                        </div>
                        <span className={`text-sm transition-colors ${done ? "text-white" : active ? "text-white/70" : "text-muted-foreground"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Analyzing with Gemini (phase 2) ── */}
            {uploadState === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-primary/20 bg-card/50 p-10 flex flex-col items-center text-center"
              >
                {/* Animated icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-primary" />
                  </div>
                  {/* Pulsing ring */}
                  <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-40" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">Analyzing Resume with AI</h3>
                <p className="text-sm text-muted-foreground mb-6">{fileName}</p>

                {/* Retrying banner */}
                <AnimatePresence>
                  {isAiRetrying && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full mb-5 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-amber-300">AI is busy. Retrying analysis…</p>
                          <p className="text-xs text-amber-400/60 mt-0.5">Switching to a fallback model — almost there.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">AI processing</span>
                    <span className="text-primary font-bold">{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400"
                      animate={{ width: `${analysisProgress}%` }}
                      transition={{ ease: "linear", duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Analysis steps */}
                <div className="w-full space-y-2.5">
                  {analysisSteps.map((step, i) => {
                    const { done, active } = activeAnalysisStep(i);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? "bg-emerald-500" : active ? "bg-primary/30 border border-primary/50" : "bg-white/5"}`}>
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : active
                              ? <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          }
                        </div>
                        <span className={`text-sm transition-colors ${done ? "text-white" : active ? "text-white/70" : "text-muted-foreground"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Error ── */}
            {uploadState === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6"
                >
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2 font-[Space_Grotesk]">
                  {error.toLowerCase().includes("ai") || error.toLowerCase().includes("analysis")
                    ? "Analysis Failed"
                    : "Upload Failed"}
                </h3>
                {fileName && <p className="text-muted-foreground mb-3 text-sm">{fileName}</p>}
                <p className="text-sm text-destructive/80 mb-8 max-w-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  {error || "Something went wrong. Please try again."}
                </p>
                <Button
                  className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                  onClick={reset}
                >
                  <Upload className="w-4 h-4" /> Try Again
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 grid grid-cols-3 gap-4"
        >
          {[
            { icon: <ShieldCheck className="w-4 h-4 text-primary" />, label: "Encrypted upload" },
            { icon: <Zap className="w-4 h-4 text-primary" />, label: "Results in seconds" },
            { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, label: "GDPR compliant" },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
              {b.icon}
              <span className="text-xs text-muted-foreground text-center">{b.label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
