import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  ArrowLeft,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trophy,
  TrendingUp,
  MessageSquare,
  Target,
  Zap,
  ChevronRight,
  Star,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type InterviewPhase =
  | "loading"
  | "setup"
  | "starting"
  | "active"
  | "submitting"
  | "completing"
  | "complete"
  | "error";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface ConversationTurn {
  questionNumber: number;
  difficulty: string;
  topic: string;
  question: string;
  answer?: string;
  evaluationScore?: number;
  evaluationFeedback?: string;
  evaluationStrengths?: string[];
}

interface ChatMessage {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  questionNumber?: number;
  difficulty?: Difficulty;
  topic?: string;
  evaluation?: { score: number; feedback: string; strengths: string[] };
  timestamp: Date;
}

interface FinalEvaluation {
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  completedAt: string;
}

const TOTAL_QUESTIONS = 10;

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  advanced:     "bg-red-500/15 text-red-300 border-red-500/20",
};

const DIFFICULTY_BAR: Record<string, string> = {
  beginner:     "from-emerald-500 to-teal-400",
  intermediate: "from-amber-500 to-yellow-400",
  advanced:     "from-red-500 to-rose-400",
};

function ScoreCircle({ label, score, color }: { label: string; score: number; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
          <motion.circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white font-[Space_Grotesk]">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight max-w-[72px]">{label}</span>
    </div>
  );
}

function ScoreColor(score: number): string {
  if (score >= 80) return "hsl(160 84% 39%)";
  if (score >= 65) return "hsl(198 93% 60%)";
  if (score >= 50) return "hsl(48 96% 53%)";
  return "hsl(0 72% 51%)";
}

export default function AIInterview() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Candidate context
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("Frontend Developer");
  const [candidateLoaded, setCandidateLoaded] = useState(false);

  // Interview state
  const [phase, setPhase] = useState<InterviewPhase>("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("beginner");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isAiRetrying, setIsAiRetrying] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<FinalEvaluation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load candidate from Supabase
  useEffect(() => {
    if (!user) return;
    supabase
      .from("candidates")
      .select("analysis, skill_gap_analysis")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as Record<string, unknown>;
          // Extract skills
          let rawAnalysis = d.analysis;
          if (typeof rawAnalysis === "string") {
            try { rawAnalysis = JSON.parse(rawAnalysis); } catch { rawAnalysis = null; }
          }
          const analysisObj = (rawAnalysis && typeof rawAnalysis === "object") ? rawAnalysis as Record<string, unknown> : {};
          const candidateSkills = Array.isArray(analysisObj.skills) ? analysisObj.skills.map(String) : [];
          setSkills(candidateSkills);

          // Extract role from skill gap analysis
          const rawGap = d.skill_gap_analysis;
          if (rawGap && typeof rawGap === "object") {
            const g = rawGap as Record<string, unknown>;
            if (typeof g.role === "string" && g.role) setSelectedRole(g.role);
          }
        }
        setCandidateLoaded(true);
        setPhase("setup");
      }, () => {
        setCandidateLoaded(true);
        setPhase("setup");
      });
  }, [user]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]);
  }, []);

  // ── Start interview ──────────────────────────────────────────────────────────
  const startInterview = useCallback(async () => {
    setPhase("starting");
    setMessages([]);
    setHistory([]);
    setCurrentQuestionNumber(1);
    setError("");
    setIsAiRetrying(false);

    retryTimerRef.current = setTimeout(() => setIsAiRetrying(true), 12_000);

    try {
      const resp = await fetch("/api/interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, skills, conversationHistory: [], questionNumber: 1 }),
      });
      const data = await resp.json() as {
        question?: string; difficulty?: string; topic?: string; error?: string;
      };
      if (!resp.ok) throw new Error(data.error ?? "Failed to start interview");

      clearRetryTimer();
      setIsAiRetrying(false);

      const q = data.question ?? "";
      const diff = (data.difficulty ?? "beginner") as Difficulty;
      const topic = data.topic ?? "Technical";

      addMessage({ role: "interviewer", content: q, questionNumber: 1, difficulty: diff, topic });
      setCurrentDifficulty(diff);
      setHistory([{ questionNumber: 1, difficulty: diff, topic, question: q }]);
      setPhase("active");

      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err: unknown) {
      clearRetryTimer();
      setIsAiRetrying(false);
      setError(err instanceof Error ? err.message : "Failed to start interview");
      setPhase("error");
    }
  }, [selectedRole, skills, addMessage, clearRetryTimer]);

  // ── Submit answer ────────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    const trimmed = answer.trim();
    if (!trimmed || phase !== "active") return;

    setAnswer("");
    addMessage({ role: "candidate", content: trimmed });
    setPhase("submitting");
    setIsAiRetrying(false);

    // Update history with answer
    const updatedHistory = history.map((t) =>
      t.questionNumber === currentQuestionNumber ? { ...t, answer: trimmed } : t
    );

    const nextQuestionNumber = currentQuestionNumber + 1;
    const isLastQuestion = nextQuestionNumber > TOTAL_QUESTIONS;

    retryTimerRef.current = setTimeout(() => setIsAiRetrying(true), 12_000);

    try {
      // Get evaluation + next question (or just evaluation if last)
      const resp = await fetch("/api/interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          skills,
          conversationHistory: updatedHistory,
          questionNumber: nextQuestionNumber,
        }),
      });
      const data = await resp.json() as {
        question?: string;
        difficulty?: string;
        topic?: string;
        questionNumber?: number;
        evaluation?: { score: number; feedback: string; strengths: string[] };
        error?: string;
      };
      if (!resp.ok) throw new Error(data.error ?? "Failed to get next question");

      clearRetryTimer();
      setIsAiRetrying(false);

      // Update history with evaluation score
      const evalScore = data.evaluation?.score;
      const historyWithEval = updatedHistory.map((t) =>
        t.questionNumber === currentQuestionNumber
          ? { ...t, evaluationScore: evalScore, evaluationFeedback: data.evaluation?.feedback, evaluationStrengths: data.evaluation?.strengths }
          : t
      );

      if (isLastQuestion) {
        // All questions done — show evaluation marker and move to complete
        if (data.evaluation) {
          const prev = messages.findLast((m) => m.role === "candidate");
          if (prev) {
            setMessages((msgs) => msgs.map((m) =>
              m.id === prev.id ? { ...m, evaluation: data.evaluation } : m
            ));
          }
        }
        setHistory(historyWithEval);
        setPhase("completing");
        await generateFinalEvaluation(historyWithEval);
      } else {
        // Add evaluation to last candidate message
        if (data.evaluation) {
          setMessages((msgs) => {
            const last = [...msgs].reverse().find((m) => m.role === "candidate");
            if (!last) return msgs;
            return msgs.map((m) => m.id === last.id ? { ...m, evaluation: data.evaluation } : m);
          });
        }

        // Add next question
        const q = data.question ?? "";
        const diff = (data.difficulty ?? "intermediate") as Difficulty;
        const topic = data.topic ?? "Technical";

        addMessage({ role: "interviewer", content: q, questionNumber: nextQuestionNumber, difficulty: diff, topic });
        setCurrentDifficulty(diff);
        setCurrentQuestionNumber(nextQuestionNumber);
        const newTurn: ConversationTurn = { questionNumber: nextQuestionNumber, difficulty: diff, topic, question: q };
        setHistory([...historyWithEval, newTurn]);
        setPhase("active");
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (err: unknown) {
      clearRetryTimer();
      setIsAiRetrying(false);
      setError(err instanceof Error ? err.message : "Failed to process answer");
      setPhase("error");
    }
  }, [answer, phase, history, currentQuestionNumber, selectedRole, skills, addMessage, clearRetryTimer, messages]);

  // ── Final evaluation ─────────────────────────────────────────────────────────
  const generateFinalEvaluation = useCallback(async (finalHistory: ConversationTurn[]) => {
    retryTimerRef.current = setTimeout(() => setIsAiRetrying(true), 15_000);
    try {
      const resp = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, skills, conversationHistory: finalHistory }),
      });
      const data = await resp.json() as FinalEvaluation & { error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Evaluation failed");

      clearRetryTimer();
      setIsAiRetrying(false);
      setFinalEvaluation(data);

      // Save to Supabase (gracefully — column may not exist yet)
      try {
        await supabase
          .from("candidates")
          .update({ interview_result: { ...data, role: selectedRole, questionsAnswered: finalHistory.length } })
          .eq("user_id", user!.id);
      } catch { /* column may not exist yet — non-fatal */ }

      setPhase("complete");
    } catch (err: unknown) {
      clearRetryTimer();
      setIsAiRetrying(false);
      setError(err instanceof Error ? err.message : "Failed to generate evaluation");
      setPhase("error");
    }
  }, [selectedRole, skills, user, clearRetryTimer]);

  // Keyboard: Ctrl+Enter or Cmd+Enter submits answer
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  };

  // Cleanup
  useEffect(() => () => clearRetryTimer(), [clearRetryTimer]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/candidate-dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <span className="font-bold text-white font-[Space_Grotesk] text-sm">AI Interview Agent</span>
            </div>
          </div>

          {/* Progress indicator */}
          {(phase === "active" || phase === "submitting") && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Q{currentQuestionNumber}/{TOTAL_QUESTIONS}</span>
              <div className="w-24 sm:w-40 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${DIFFICULTY_BAR[currentDifficulty] ?? "from-primary to-cyan-400"}`}
                  animate={{ width: `${(currentQuestionNumber / TOTAL_QUESTIONS) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${DIFFICULTY_COLORS[currentDifficulty] ?? ""}`}>
                {currentDifficulty}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-20 pb-4">

        {/* Loading */}
        {phase === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Setup */}
        {phase === "setup" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-16 gap-8"
          >
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <span className="absolute inset-0 rounded-3xl bg-primary/5 animate-ping opacity-30" />
            </div>

            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-[Space_Grotesk] mb-3">AI Interview Agent</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Answer {TOTAL_QUESTIONS} adaptive technical questions. The AI adjusts difficulty in real time based on your responses.
              </p>
            </div>

            {/* Role + skills summary */}
            <div className="w-full max-w-md space-y-4">
              {skills.length > 0 ? (
                <div className="p-4 rounded-2xl bg-card/50 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Your Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 12).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-white/70 border border-white/10">{s}</span>
                    ))}
                    {skills.length > 12 && <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground">+{skills.length - 12} more</span>}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-300 font-medium">No resume analysis found</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">Upload and analyze your resume first for a personalized interview.</p>
                    <Link href="/resume-upload">
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                        Upload Resume <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Role display */}
              <div className="p-4 rounded-2xl bg-card/50 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">Interview Role</p>
                  <p className="text-sm font-semibold text-white">{selectedRole}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
              </div>

              {/* Interview format info */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <MessageSquare className="w-4 h-4 text-primary" />, label: "10 questions", sub: "adaptive" },
                  { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, label: "Dynamic", sub: "difficulty" },
                  { icon: <Trophy className="w-4 h-4 text-amber-400" />, label: "AI scoring", sub: "per answer" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1.5 text-center">
                    {item.icon}
                    <span className="text-xs font-medium text-white">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={startInterview}
              className="h-14 px-10 bg-primary hover:bg-primary/90 text-black font-bold text-base gap-3 rounded-2xl"
            >
              <Zap className="w-5 h-5" /> Start Interview
            </Button>
          </motion.div>
        )}

        {/* Starting */}
        {phase === "starting" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <span className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-40" />
            </div>
            <p className="text-white font-medium">Preparing your interview…</p>
            <p className="text-sm text-muted-foreground">Generating your first question</p>
            {isAiRetrying && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-sm text-amber-300">AI is busy. Retrying…</span>
              </div>
            )}
          </div>
        )}

        {/* Active chat + submitting */}
        {(phase === "active" || phase === "submitting") && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"} gap-3`}
                  >
                    {/* AI avatar */}
                    {msg.role === "interviewer" && (
                      <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <BrainCircuit className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div className={`max-w-[80%] space-y-1.5 ${msg.role === "candidate" ? "items-end" : "items-start"} flex flex-col`}>
                      {/* Question meta */}
                      {msg.role === "interviewer" && msg.questionNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Q{msg.questionNumber}</span>
                          {msg.difficulty && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${DIFFICULTY_COLORS[msg.difficulty]}`}>
                              {msg.difficulty}
                            </span>
                          )}
                          {msg.topic && <span className="text-[10px] text-muted-foreground">{msg.topic}</span>}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "interviewer"
                          ? "bg-card/70 border border-white/8 text-white rounded-tl-sm"
                          : "bg-primary/15 border border-primary/20 text-white/90 rounded-tr-sm"
                      }`}>
                        {msg.content}
                      </div>

                      {/* Evaluation badge on candidate messages */}
                      {msg.role === "candidate" && msg.evaluation && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            msg.evaluation.score >= 70 ? "bg-emerald-500/20 text-emerald-300" :
                            msg.evaluation.score >= 45 ? "bg-amber-500/20 text-amber-300" :
                            "bg-red-500/20 text-red-300"
                          }`}>
                            {msg.evaluation.score}
                          </div>
                          <span className="text-xs text-muted-foreground leading-snug max-w-[220px]">
                            {msg.evaluation.feedback}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.role === "candidate" && (
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white/70">
                        {user?.email?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* AI typing indicator */}
                {phase === "submitting" && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 items-end"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <BrainCircuit className="w-4 h-4 text-primary" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card/70 border border-white/8">
                      {isAiRetrying ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          <span className="text-xs text-amber-300">AI is busy. Retrying…</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {[0, 0.2, 0.4].map((delay, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-white/40"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Answer input */}
            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={phase === "submitting"}
                    placeholder="Type your answer… (Ctrl+Enter to send)"
                    rows={3}
                    className="w-full resize-none rounded-2xl bg-card/50 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                  />
                </div>
                <Button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || phase === "submitting"}
                  className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 text-black flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                >
                  {phase === "submitting" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-right">Ctrl+Enter to send</p>
            </div>
          </div>
        )}

        {/* Completing */}
        {phase === "completing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-violet-400" />
              </div>
              <span className="absolute inset-0 rounded-3xl bg-violet-500/5 animate-ping opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white font-[Space_Grotesk] mb-2">Interview Complete!</p>
              <p className="text-muted-foreground">Generating your comprehensive evaluation…</p>
            </div>
            {isAiRetrying && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-sm text-amber-300">AI is busy. Retrying evaluation…</span>
              </div>
            )}
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white mb-2">Something went wrong</p>
              <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setPhase("setup")} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                Back to Setup
              </Button>
              <Button onClick={startInterview} className="bg-primary hover:bg-primary/90 text-black font-semibold">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Complete — evaluation results */}
        {phase === "complete" && finalEvaluation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
              >
                <Trophy className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-[Space_Grotesk] mb-2">Interview Complete</h2>
              <p className="text-muted-foreground">{selectedRole} · {history.length} questions answered</p>
            </div>

            {/* 4 score circles */}
            <div className="p-6 rounded-2xl bg-card/50 border border-white/5">
              <p className="text-sm font-semibold text-white mb-6 text-center">Performance Scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
                <ScoreCircle label="Technical" score={finalEvaluation.technicalScore} color={ScoreColor(finalEvaluation.technicalScore)} />
                <ScoreCircle label="Communication" score={finalEvaluation.communicationScore} color={ScoreColor(finalEvaluation.communicationScore)} />
                <ScoreCircle label="Confidence" score={finalEvaluation.confidenceScore} color={ScoreColor(finalEvaluation.confidenceScore)} />
                <ScoreCircle label="Problem Solving" score={finalEvaluation.problemSolvingScore} color={ScoreColor(finalEvaluation.problemSolvingScore)} />
              </div>
              {/* Overall bar */}
              {(() => {
                const overall = Math.round((finalEvaluation.technicalScore + finalEvaluation.communicationScore + finalEvaluation.confidenceScore + finalEvaluation.problemSolvingScore) / 4);
                const barColor = overall >= 80 ? "from-emerald-500 to-teal-400" : overall >= 65 ? "from-cyan-500 to-blue-400" : overall >= 50 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";
                return (
                  <div className="mt-6 border-t border-white/5 pt-5">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall Score</span>
                      <span className="font-bold text-white font-[Space_Grotesk]">{overall}/100</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${overall}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Strengths + weaknesses */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Strengths</span>
                </div>
                <ul className="space-y-2">
                  {finalEvaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Areas to Improve</span>
                </div>
                <ul className="space-y-2">
                  {finalEvaluation.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-white">AI Recommendation</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{finalEvaluation.recommendation}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pb-4">
              <Link href="/candidate-dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5 gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
              </Link>
              <Button
                onClick={() => { setPhase("setup"); setMessages([]); setHistory([]); setFinalEvaluation(null); }}
                className="flex-1 bg-primary hover:bg-primary/90 text-black font-semibold gap-2"
              >
                <RefreshCw className="w-4 h-4" /> New Interview
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
