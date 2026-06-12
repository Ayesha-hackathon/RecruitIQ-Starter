import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  Upload,
  BriefcaseBusiness,
  MessageSquare,
  Settings,
  Bell,
  ChevronRight,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  LogOut,
  Menu,
  X,
  Target,
  Sparkles,
  Brain,
  BookOpen,
  Award,
  Code2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface AnalysisEducation {
  degree: string;
  institution: string;
  year: string;
}

interface AnalysisProject {
  name: string;
  description: string;
}

interface ResumeAnalysis {
  skills: string[];
  education: AnalysisEducation[];
  projects: AnalysisProject[];
  certifications: string[];
  resumeScore: number;
  summary: string;
}

interface CandidateRecord {
  resume_url: string | null;
  resume_filename: string | null;
  analysis: ResumeAnalysis | null;
}

const navItems = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, href: "/candidate-dashboard" },
  { label: "Resume Upload", icon: <Upload className="w-4 h-4" />, href: "/resume-upload" },
  { label: "My Applications", icon: <BriefcaseBusiness className="w-4 h-4" />, href: "#" },
  { label: "Interviews", icon: <MessageSquare className="w-4 h-4" />, href: "#" },
  { label: "Settings", icon: <Settings className="w-4 h-4" />, href: "#" },
];

const statCards = [
  {
    label: "Resume Score",
    value: "87",
    unit: "/100",
    delta: "+12 pts this week",
    trend: "up",
    icon: <FileText className="w-5 h-5 text-primary" />,
    color: "from-primary/20 to-primary/5",
  },
  {
    label: "Skill Match",
    value: "92%",
    unit: "",
    delta: "vs. role requirements",
    trend: "up",
    icon: <Target className="w-5 h-5 text-emerald-400" />,
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    label: "Interview Status",
    value: "Round 2",
    unit: "",
    delta: "Technical interview pending",
    trend: "neutral",
    icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    label: "Applied Jobs",
    value: "14",
    unit: "",
    delta: "3 shortlisted",
    trend: "up",
    icon: <BriefcaseBusiness className="w-5 h-5 text-cyan-400" />,
    color: "from-cyan-500/20 to-cyan-500/5",
  },
];

const applications = [
  { role: "Senior Frontend Engineer", company: "TechVision Inc.", status: "Shortlisted", statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", date: "Jun 8" },
  { role: "Full Stack Developer", company: "Nexus Labs", status: "Interview", statusColor: "text-amber-400 bg-amber-400/10 border-amber-400/20", date: "Jun 5" },
  { role: "React Engineer", company: "CloudBase Systems", status: "Under Review", statusColor: "text-blue-400 bg-blue-400/10 border-blue-400/20", date: "Jun 2" },
  { role: "Lead Engineer", company: "Quantum Dynamics", status: "Applied", statusColor: "text-muted-foreground bg-white/5 border-white/10", date: "May 28" },
];

// ─── Normalise analysis shape ────────────────────────────────────────────────
// Guarantees every field is the correct type regardless of what Supabase/Gemini
// actually returns.  Called both on fresh API responses AND on Supabase fetches.
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

// ─── Debug info type ─────────────────────────────────────────────────────────
interface DebugInfo {
  source: "api" | "supabase";
  supabaseRaw: unknown;
  apiRawText: string | null;
  apiCleanedText: string | null;
  apiExtractionMethod: string | null;
  apiParsedKeys: string[] | null;
  finalAnalysis: unknown;
}

export default function CandidateDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [loadingCandidate, setLoadingCandidate] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  // Shows "AI is busy. Retrying…" after the request has been in-flight for >12 s
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingCandidate(true);
    console.group("[RecruitIQ] Supabase fetch — candidates");
    console.log("user_id:", user.id);
    supabase
      .from("candidates")
      .select("resume_url, resume_filename, analysis")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        console.log("Supabase response →", { data, error });
        if (data) {
          const row = data as { resume_url: string | null; resume_filename: string | null; analysis: unknown };
          console.log("raw.analysis type:", typeof row.analysis);
          console.log("raw.analysis value:", row.analysis);

          // If Supabase returns the JSON column as a string (json type vs jsonb), parse it first
          let rawObj: unknown = row.analysis;
          if (typeof rawObj === "string" && rawObj.trim().length > 0) {
            try { rawObj = JSON.parse(rawObj); } catch { rawObj = null; }
          }
          console.log("After string-parse:", rawObj);

          // Handle double-nesting: { analysis: { skills, ... } } → unwrap
          if (rawObj && typeof rawObj === "object") {
            const maybe = (rawObj as Record<string, unknown>).analysis;
            if (maybe && typeof maybe === "object") {
              console.log("Detected nested analysis key — unwrapping");
              rawObj = maybe;
            }
          }
          console.log("Pre-normalise:", rawObj);

          const analysis = rawObj ? normalizeAnalysis(rawObj) : null;
          console.log("Normalised analysis:", analysis);

          setDebugInfo({
            source: "supabase",
            supabaseRaw: row.analysis,
            apiRawText: null,
            apiCleanedText: null,
            apiExtractionMethod: null,
            apiParsedKeys: null,
            finalAnalysis: analysis,
          });
          setCandidate({ resume_url: row.resume_url, resume_filename: row.resume_filename, analysis });
        } else {
          console.warn("No candidate row found:", error?.message);
        }
        setLoadingCandidate(false);
        console.groupEnd();
      });
  }, [user]);

  const analyzeResume = async () => {
    if (!candidate?.resume_url) return;
    setAnalyzing(true);
    setIsRetrying(false);
    setAnalysisError("");

    // After 12 s with no response, assume Gemini is retrying and update UI
    const retryTimer = setTimeout(() => setIsRetrying(true), 12_000);

    try {
      console.group("[RecruitIQ] analyzeResume API call");
      console.log("resumeUrl:", candidate.resume_url);

      const resp = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl: candidate.resume_url }),
      });

      const data = await resp.json() as {
        analysis?: ResumeAnalysis;
        error?: string;
        isHighDemand?: boolean;
        _debug?: {
          rawText: string;
          rawLength: number;
          modelUsed: string;
          attemptNumber: number;
          totalAttempts: number;
          extractionMethod: string;
          cleanedText: string;
          parsedKeys: string[];
        };
      };

      console.log("HTTP status:", resp.status);
      console.log("Full API response:", data);
      console.log("_debug.modelUsed:", data._debug?.modelUsed);
      console.log("_debug.totalAttempts:", data._debug?.totalAttempts);
      console.log("_debug.rawText (first 800):", data._debug?.rawText?.slice(0, 800));
      console.log("_debug.extractionMethod:", data._debug?.extractionMethod);
      console.log("_debug.parsedKeys:", data._debug?.parsedKeys);
      console.log("analysis object:", data.analysis);

      if (!resp.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      const analysis = normalizeAnalysis(data.analysis);
      console.log("Normalised analysis:", analysis);
      console.groupEnd();

      // Persist to Supabase
      const { error: upsertError } = await supabase
        .from("candidates")
        .update({ analysis })
        .eq("user_id", user!.id);
      if (upsertError) {
        console.error("[RecruitIQ] Supabase update error:", upsertError);
      } else {
        console.log("[RecruitIQ] Supabase update success");
      }

      setDebugInfo({
        source: "api",
        supabaseRaw: null,
        apiRawText: data._debug?.rawText ?? null,
        apiCleanedText: data._debug?.cleanedText ?? null,
        apiExtractionMethod: data._debug?.extractionMethod ?? null,
        apiParsedKeys: data._debug?.parsedKeys ?? null,
        finalAnalysis: analysis,
      });
      setCandidate((prev) => prev ? { ...prev, analysis } : prev);
    } catch (err: unknown) {
      console.error("[RecruitIQ] analyzeResume error:", err);
      console.groupEnd();
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      clearTimeout(retryTimer);
      setAnalyzing(false);
      setIsRetrying(false);
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Account";
  const displayEmail = user?.email ?? "";

  // Real AI score wired to the top stat card
  const realScore = candidate?.analysis?.resumeScore ?? null;

  // Determine if the fetched analysis has valid content worth rendering
  const hasValidAnalysis =
    candidate?.analysis != null &&
    (typeof (candidate.analysis as ResumeAnalysis).resumeScore === "number" ||
      Array.isArray((candidate.analysis as ResumeAnalysis).skills));

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-black border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-20 flex items-center gap-2 px-6 border-b border-white/5">
          <BrainCircuit className="w-7 h-7 text-primary flex-shrink-0" />
          <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
          <button className="ml-auto lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 mx-4 my-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
          <div className="text-sm font-semibold text-white truncate">{displayName}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{displayEmail}</div>
          <div className="text-xs text-primary mt-0.5">Candidate</div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${location === item.href ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
            >
              {item.icon}
              {item.label}
              {item.label === "Interviews" && (
                <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-xs px-1.5">2</Badge>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20">
          <button
            className="lg:hidden text-muted-foreground hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-[Space_Grotesk]">Candidate Dashboard</h1>
            <p className="text-xs text-muted-foreground">Tuesday, June 10, 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-white leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground leading-tight">{displayEmail}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-auto">

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {statCards.map((card, i) => {
              const isScoreCard = card.label === "Resume Score";
              const displayValue = isScoreCard && realScore !== null ? String(realScore) : card.value;
              const displayDelta = isScoreCard && realScore !== null ? "AI-powered score" : card.delta;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl bg-card/50 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-60`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        {card.icon}
                      </div>
                      {card.trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                      {card.trend === "neutral" && <Clock className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      {isScoreCard && loadingCandidate ? (
                        <div className="h-8 w-12 rounded bg-white/10 animate-pulse" />
                      ) : (
                        <span className="text-3xl font-bold text-white font-[Space_Grotesk]">{displayValue}</span>
                      )}
                      {card.unit && <span className="text-sm text-muted-foreground">{card.unit}</span>}
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{card.label}</div>
                    <div className="text-xs text-muted-foreground">{displayDelta}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Applications table + Resume score */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Applications list */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 rounded-2xl bg-card/50 border border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white font-[Space_Grotesk]">Recent Applications</h2>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-3">
                {applications.map((app, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary/20 to-cyan-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                      {app.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{app.role}</div>
                      <div className="text-xs text-muted-foreground">{app.company}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${app.statusColor}`}>{app.status}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{app.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Resume score card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl bg-card/50 border border-white/5 p-6"
            >
              <h2 className="text-lg font-bold text-white font-[Space_Grotesk] mb-6">Resume Strength</h2>

              {loadingCandidate ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-32 h-32 rounded-full bg-white/5 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
                  <div className="w-full space-y-3 mt-2">
                    {[80, 65, 75, 55].map((w, i) => (
                      <div key={i} className="h-2 rounded-full bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              ) : (() => {
                const score = hasValidAnalysis ? (candidate!.analysis!.resumeScore ?? 0) : null;
                const scoreLabel = score === null ? null : score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Good" : "Needs Work";
                const ringColor = score === null ? "hsl(var(--primary))" : score >= 85 ? "hsl(160 84% 39%)" : score >= 70 ? "hsl(198 93% 60%)" : score >= 55 ? "hsl(48 96% 53%)" : "hsl(0 72% 51%)";
                const barGradient = score === null ? "from-primary to-cyan-400" : score >= 85 ? "from-emerald-500 to-teal-400" : score >= 70 ? "from-cyan-500 to-blue-400" : score >= 55 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400";
                const circumference = 2 * Math.PI * 40;
                const skills = hasValidAnalysis ? (candidate!.analysis!.skills ?? []) : [];
                const education = hasValidAnalysis ? (candidate!.analysis!.education ?? []) : [];
                const certs = hasValidAnalysis ? (candidate!.analysis!.certifications ?? []) : [];
                const projects = hasValidAnalysis ? (candidate!.analysis!.projects ?? []) : [];

                const dims = score !== null
                  ? [
                      { label: "Skills detected", value: skills.length, max: Math.max(skills.length, 10) },
                      { label: "Education entries", value: education.length, max: Math.max(education.length, 3) },
                      { label: "Certifications", value: certs.length, max: Math.max(certs.length, 3) },
                      { label: "Projects", value: projects.length, max: Math.max(projects.length, 5) },
                    ]
                  : [
                      { label: "Experience", value: 90, max: 100 },
                      { label: "Skills", value: 85, max: 100 },
                      { label: "Education", value: 88, max: 100 },
                      { label: "Keywords", value: 78, max: 100 },
                    ];

                return (
                  <>
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                          {score !== null ? (
                            <motion.circle
                              cx="50" cy="50" r="40" fill="none"
                              stroke={ringColor}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
                              transition={{ duration: 1.0, ease: "easeOut" }}
                            />
                          ) : (
                            <circle cx="50" cy="50" r="40" fill="none" stroke={ringColor} strokeWidth="10"
                              strokeDasharray={`${87 * 2.51} ${100 * 2.51}`} strokeLinecap="round" opacity="0.3" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-white font-[Space_Grotesk]">
                            {score !== null ? score : "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-semibold text-white">
                        {scoreLabel ?? "Awaiting Analysis"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score !== null ? "AI-powered score" : "Run AI analysis to score your resume"}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {dims.map((item, i) => {
                        const pct = score !== null
                          ? item.max > 0 ? Math.round((item.value / item.max) * 100) : 0
                          : item.value as number;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{item.label}</span>
                              <span className="text-white font-medium">
                                {score !== null ? item.value : `${item.value}%`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.08 }}
                                className={`h-full bg-gradient-to-r ${barGradient} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Link href="/resume-upload">
                      <Button className="w-full mt-6 h-10 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-sm">
                        Update Resume
                      </Button>
                    </Link>
                  </>
                );
              })()}
            </motion.div>
          </div>

          {/* Interview checklist */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-card/50 border border-white/5 p-6"
          >
            <h2 className="text-lg font-bold text-white font-[Space_Grotesk] mb-5">Interview Preparation Checklist</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Resume reviewed by AI", done: hasValidAnalysis },
                { label: "Skills assessment sent", done: true },
                { label: "Technical interview scheduled", done: false },
                { label: "Hiring decision pending", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${step.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${step.done ? "text-emerald-400" : "text-white/20"}`} />
                  <span className={`text-sm font-medium ${step.done ? "text-white" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Resume Analyzer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-[Space_Grotesk]">AI Resume Analyzer</h2>
                  <p className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              {candidate?.resume_url && (
                <Button
                  onClick={analyzeResume}
                  disabled={analyzing}
                  className="h-9 px-4 text-sm bg-primary hover:bg-primary/90 text-black font-semibold gap-2 disabled:opacity-60"
                >
                  {analyzing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                  ) : hasValidAnalysis ? (
                    <><RefreshCw className="w-4 h-4" /> Re-analyze</>
                  ) : (
                    <><Brain className="w-4 h-4" /> Analyze Resume</>
                  )}
                </Button>
              )}
            </div>

            <div className="bg-card/30 p-6">
              {/* Error state */}
              <AnimatePresence>
                {analysisError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-300">{analysisError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No resume uploaded yet */}
              {!candidate?.resume_url && !analyzing && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-white font-medium mb-1">No resume uploaded yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Upload your resume to unlock AI-powered analysis</p>
                  <Link href="/resume-upload">
                    <Button className="h-9 px-5 text-sm bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                      Upload Resume
                    </Button>
                  </Link>
                </div>
              )}

              {/* Analyzing skeleton */}
              {analyzing && (
                <div className="space-y-4 py-2">
                  <AnimatePresence mode="wait">
                    {isRetrying ? (
                      <motion.div
                        key="retrying"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                      >
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-amber-300">AI is busy. Retrying analysis…</p>
                          <p className="text-xs text-amber-400/60 mt-0.5">Switching to a fallback model — this may take a few more seconds.</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="reading"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 mb-6"
                      >
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Reading your resume and generating AI insights…</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {[80, 60, 90, 50].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}

              {/* Has resume but not yet analyzed */}
              {candidate?.resume_url && !hasValidAnalysis && !analyzing && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-white font-medium mb-1">Ready to analyze</p>
                  <p className="text-sm text-muted-foreground">Click "Analyze Resume" above to get your AI-powered breakdown</p>
                </div>
              )}

              {/* Analysis results */}
              {hasValidAnalysis && !analyzing && (() => {
                const a = normalizeAnalysis(candidate!.analysis!);

                const score          = a.resumeScore;
                const summary        = a.summary;
                const skills         = a.skills;
                const education      = a.education;
                const projects       = a.projects;
                const certifications = a.certifications;

                const scoreLabel = score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Good" : "Needs Work";
                const scoreColor = score >= 85 ? "text-emerald-400" : score >= 70 ? "text-cyan-400" : score >= 55 ? "text-yellow-400" : "text-red-400";
                const scoreRingColor = score >= 85 ? "hsl(160 84% 39%)" : score >= 70 ? "hsl(198 93% 60%)" : score >= 55 ? "hsl(48 96% 53%)" : "hsl(0 72% 51%)";
                const scoreBarColor = score >= 85 ? "from-emerald-500 to-teal-400" : score >= 70 ? "from-cyan-500 to-blue-400" : score >= 55 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400";
                const circumference = 2 * Math.PI * 40;

                return (
                  <div className="space-y-6">

                    {/* Score + Summary row */}
                    <div className="grid md:grid-cols-3 gap-4">

                      {/* Score card — circular gauge */}
                      <div className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/8 p-6 flex flex-col items-center justify-center text-center gap-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Resume Score</p>
                        <div className="relative w-28 h-28">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                            <motion.circle
                              cx="50" cy="50" r="40" fill="none"
                              stroke={scoreRingColor}
                              strokeWidth="9"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
                              transition={{ duration: 1.0, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black font-[Space_Grotesk] ${scoreColor}`}>{score}</span>
                            <span className="text-xs text-muted-foreground">/ 100</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{scoreLabel}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">AI-powered score</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor}`}
                          />
                        </div>
                      </div>

                      {/* AI Summary */}
                      <div className="md:col-span-2 rounded-2xl bg-gradient-to-br from-primary/[0.08] via-violet-500/[0.04] to-transparent border border-primary/15 p-6 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-white">AI Summary</p>
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Gemini 2.5 Flash</span>
                        </div>
                        {summary ? (
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{summary}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">No summary generated.</p>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/5 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                          <Code2 className="w-3.5 h-3.5 text-violet-400" />
                        </div>
                        <p className="text-sm font-bold text-white">Skills</p>
                        {skills.length > 0 && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{skills.length} detected</span>
                        )}
                      </div>
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, i) => (
                            <motion.span
                              key={i}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                            >
                              {String(skill)}
                            </motion.span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">No skills detected.</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">

                      {/* Education */}
                      <div className="rounded-2xl bg-white/[0.025] border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <p className="text-sm font-bold text-white">Education</p>
                        </div>
                        {education.length > 0 ? (
                          <div className="space-y-3">
                            {education.map((edu, i) => {
                              const e = typeof edu === "object" && edu !== null ? edu as AnalysisEducation : { degree: String(edu), institution: "", year: "" };
                              return (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-semibold text-white leading-snug">{e.degree || "—"}</p>
                                    {(e.institution || e.year) && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {[e.institution, e.year].filter(Boolean).join(" · ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">No education detected.</p>
                        )}
                      </div>

                      {/* Certifications */}
                      <div className="rounded-2xl bg-white/[0.025] border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <p className="text-sm font-bold text-white">Certifications</p>
                        </div>
                        {certifications.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {certifications.map((cert, i) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-amber-300">{String(cert)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">No certifications detected.</p>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="rounded-2xl bg-white/[0.025] border border-white/5 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold text-white">Projects</p>
                        {projects.length > 0 && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{projects.length} found</span>
                        )}
                      </div>
                      {projects.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {projects.map((proj, i) => {
                            const p = typeof proj === "object" && proj !== null ? proj as AnalysisProject : { name: String(proj), description: "" };
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 hover:border-emerald-500/20 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                  <p className="text-sm font-semibold text-white truncate">{p.name || "Untitled"}</p>
                                </div>
                                {p.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">No projects detected.</p>
                      )}
                    </div>

                  </div>
                );
              })()}

              {/* ── DEBUG PANEL (temporary) ───────────────────────────────── */}
              {debugInfo && (
                <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 overflow-hidden">
                  <button
                    onClick={() => setDebugOpen((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-yellow-500/10 transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-yellow-400">🐛 DEBUG PANEL</span>
                    <span className="text-xs text-yellow-400/60 ml-1">
                      source: {debugInfo.source} · method: {debugInfo.apiExtractionMethod ?? "n/a"}
                    </span>
                    <span className="ml-auto text-xs text-yellow-400/50">{debugOpen ? "▲ hide" : "▼ show"}</span>
                  </button>

                  {debugOpen && (
                    <div className="border-t border-yellow-500/20 p-4 space-y-4 font-mono text-xs">

                      {/* Supabase raw */}
                      <div>
                        <p className="text-yellow-400 font-bold mb-1">SUPABASE RAW (analysis column)</p>
                        <pre className="bg-black/60 rounded-lg p-3 overflow-auto max-h-40 text-green-300 text-[11px] whitespace-pre-wrap break-all">
                          {JSON.stringify(debugInfo.supabaseRaw ?? "(only available on Supabase fetch)", null, 2)}
                        </pre>
                      </div>

                      {/* API raw Gemini text */}
                      {debugInfo.apiRawText && (
                        <div>
                          <p className="text-yellow-400 font-bold mb-1">
                            RAW GEMINI TEXT ({debugInfo.apiRawText.length} chars)
                          </p>
                          <pre className="bg-black/60 rounded-lg p-3 overflow-auto max-h-48 text-cyan-300 text-[11px] whitespace-pre-wrap break-all">
                            {debugInfo.apiRawText}
                          </pre>
                        </div>
                      )}

                      {/* Cleaned text */}
                      {debugInfo.apiCleanedText && (
                        <div>
                          <p className="text-yellow-400 font-bold mb-1">
                            CLEANED / EXTRACTED JSON (method: {debugInfo.apiExtractionMethod})
                          </p>
                          <pre className="bg-black/60 rounded-lg p-3 overflow-auto max-h-40 text-lime-300 text-[11px] whitespace-pre-wrap break-all">
                            {debugInfo.apiCleanedText}
                          </pre>
                        </div>
                      )}

                      {/* Parsed keys */}
                      {debugInfo.apiParsedKeys && (
                        <div>
                          <p className="text-yellow-400 font-bold mb-1">PARSED KEYS</p>
                          <p className="text-white/70">{debugInfo.apiParsedKeys.join(", ")}</p>
                        </div>
                      )}

                      {/* Final analysis object */}
                      <div>
                        <p className="text-yellow-400 font-bold mb-1">FINAL PARSED OBJECT (post-normalise)</p>
                        <pre className="bg-black/60 rounded-lg p-3 overflow-auto max-h-64 text-orange-300 text-[11px] whitespace-pre-wrap break-all">
                          {JSON.stringify(debugInfo.finalAnalysis, null, 2)}
                        </pre>
                      </div>

                    </div>
                  )}
                </div>
              )}
              {/* ── end debug panel ─────────────────────────────────────────── */}

            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
