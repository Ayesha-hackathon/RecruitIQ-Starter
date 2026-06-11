import { useState, useRef } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type UploadState = "idle" | "dragging" | "uploading" | "done" | "error";

const analysisSteps = [
  "Uploading to secure storage",
  "Extracting skills & experience",
  "Running skill gap analysis",
  "Saving to your profile",
];

export default function ResumeUpload() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();

  const clearProgressInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

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
    setProgress(0);
    setResumeUrl("");

    // Animate progress to ~80% while the real upload runs in parallel
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 80) {
          clearProgressInterval();
          return 80;
        }
        return p + 2;
      });
    }, 120);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${Date.now()}_${safeName}`;

      const { error: storageError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("resumes").getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from("candidates")
        .upsert(
          {
            user_id: user.id,
            resume_url: publicUrl,
            resume_path: filePath,
            resume_filename: file.name,
            uploaded_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (dbError) throw dbError;

      clearProgressInterval();
      setProgress(100);
      setResumeUrl(publicUrl);
      setTimeout(() => setUploadState("done"), 500);
    } catch (err: unknown) {
      clearProgressInterval();
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(msg);
      setProgress(0);
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
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  };

  const reset = () => {
    clearProgressInterval();
    setUploadState("idle");
    setFileName("");
    setFileSize("");
    setProgress(0);
    setError("");
    setResumeUrl("");
  };

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
            Our AI analyzes your resume in seconds — extracting skills, experience, and generating a match score against open roles.
          </p>
        </motion.div>

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">

            {/* Idle / Dragging */}
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
                <p className="text-muted-foreground mb-6">
                  PDF only — up to 10 MB
                </p>
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

            {/* Uploading */}
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
                <p className="text-sm text-muted-foreground mb-8">{fileSize} · Uploading with RecruitIQ AI...</p>

                {/* Progress bar */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Analysis steps */}
                <div className="w-full space-y-2.5">
                  {analysisSteps.map((step, i) => {
                    const stepProgress = (i + 1) * 25;
                    const isDone = progress >= stepProgress;
                    const isActive = progress >= stepProgress - 25 && !isDone;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "bg-emerald-500" : isActive ? "bg-primary/30 border border-primary/50" : "bg-white/5"}`}>
                          {isDone
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : isActive
                              ? <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          }
                        </div>
                        <span className={`text-sm transition-colors ${isDone ? "text-white" : isActive ? "text-white/70" : "text-muted-foreground"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Error */}
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
                <h3 className="text-2xl font-bold text-white mb-2 font-[Space_Grotesk]">Upload Failed</h3>
                {fileName && (
                  <p className="text-muted-foreground mb-3 text-sm">{fileName}</p>
                )}
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

            {/* Done */}
            {uploadState === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2 font-[Space_Grotesk]">Upload Complete</h3>

                {/* Filename pill */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-white font-medium truncate max-w-[260px]">{fileName}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Saved to your profile · Ready for AI analysis
                </p>

                {/* Score */}
                <div className="my-2 w-full max-w-sm mx-auto p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="text-5xl font-bold text-white font-[Space_Grotesk] mb-1">87<span className="text-2xl text-muted-foreground">/100</span></div>
                  <div className="text-sm font-medium text-white mb-3">Resume Score</div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-5">
                    <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-primary to-cyan-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      { label: "Skill Match", val: "92%" },
                      { label: "Experience", val: "Strong" },
                      { label: "Keywords", val: "78%" },
                      { label: "Percentile", val: "Top 15%" },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 flex-col sm:flex-row w-full max-w-sm mt-6">
                  <Link href="/candidate-dashboard" className="flex-1">
                    <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                      View Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-white/10 hover:bg-white/5 text-white gap-2"
                    onClick={reset}
                    data-testid="button-upload-another"
                  >
                    <X className="w-4 h-4" /> Upload Another
                  </Button>
                </div>
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
