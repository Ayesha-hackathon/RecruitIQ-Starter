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
} from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "dragging" | "uploaded" | "analyzing" | "done";

export default function ResumeUpload() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(0) + " KB");
    setUploadState("analyzing");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadState("done");
          return 100;
        }
        return p + 4;
      });
    }, 80);
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
  };

  const reset = () => {
    setUploadState("idle");
    setFileName("");
    setFileSize("");
    setProgress(0);
  };

  const analysisSteps = [
    "Parsing resume structure",
    "Extracting skills & experience",
    "Running skill gap analysis",
    "Generating match score",
  ];

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
                  accept=".pdf,.doc,.docx"
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
                  Supports PDF, DOC, DOCX — up to 10 MB
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

            {/* Analyzing */}
            {uploadState === "analyzing" && (
              <motion.div
                key="analyzing"
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
                <p className="text-sm text-muted-foreground mb-8">{fileSize} · Analyzing with RecruitIQ AI...</p>

                {/* Progress bar */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      style={{ width: `${progress}%` }}
                      transition={{ ease: "linear" }}
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
                <h3 className="text-2xl font-bold text-white mb-2 font-[Space_Grotesk]">Analysis Complete</h3>
                <p className="text-muted-foreground mb-2">{fileName}</p>

                {/* Score */}
                <div className="my-6 w-full max-w-sm mx-auto p-6 rounded-2xl bg-white/[0.03] border border-white/5">
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

                <div className="flex gap-3 flex-col sm:flex-row w-full max-w-sm">
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
