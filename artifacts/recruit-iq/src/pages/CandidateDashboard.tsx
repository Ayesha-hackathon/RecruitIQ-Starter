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

export default function CandidateDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("candidates")
      .select("resume_url, resume_filename, analysis")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setCandidate(data as CandidateRecord);
      });
  }, [user]);

  const analyzeResume = async () => {
    if (!candidate?.resume_url) return;
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const resp = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl: candidate.resume_url }),
      });
      const data = await resp.json() as { analysis?: ResumeAnalysis; error?: string };
      if (!resp.ok) throw new Error(data.error ?? "Analysis failed");
      const analysis = data.analysis!;
      await supabase
        .from("candidates")
        .update({ analysis })
        .eq("user_id", user!.id);
      setCandidate((prev) => prev ? { ...prev, analysis } : prev);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Account";
  const displayEmail = user?.email ?? "";

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
            {statCards.map((card, i) => (
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
                    <span className="text-3xl font-bold text-white font-[Space_Grotesk]">{card.value}</span>
                    {card.unit && <span className="text-sm text-muted-foreground">{card.unit}</span>}
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{card.label}</div>
                  <div className="text-xs text-muted-foreground">{card.delta}</div>
                </div>
              </motion.div>
            ))}
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
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
                      strokeDasharray={`${87 * 2.51} ${100 * 2.51}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white font-[Space_Grotesk]">87</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="mt-3 text-sm font-semibold text-white">Strong Resume</div>
                <div className="text-xs text-muted-foreground">Top 15% of applicants</div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Experience", score: 90 },
                  { label: "Skills", score: 85 },
                  { label: "Education", score: 88 },
                  { label: "Keywords", score: 78 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-white font-medium">{item.score}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/resume-upload">
                <Button className="w-full mt-6 h-10 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-sm">
                  Update Resume
                </Button>
              </Link>
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
                { label: "Resume reviewed by AI", done: !!candidate?.analysis },
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
                  ) : candidate?.analysis ? (
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
                  <div className="flex items-center gap-3 mb-6">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Reading your resume and generating AI insights…</span>
                  </div>
                  {[80, 60, 90, 50].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}

              {/* Has resume but not yet analyzed */}
              {candidate?.resume_url && !candidate.analysis && !analyzing && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-white font-medium mb-1">Ready to analyze</p>
                  <p className="text-sm text-muted-foreground">Click "Analyze Resume" above to get your AI-powered breakdown</p>
                </div>
              )}

              {/* Analysis results */}
              {candidate?.analysis && !analyzing && (() => {
                const a = candidate.analysis;
                const score = a.resumeScore ?? 0;
                const scoreColor = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
                const scoreBarColor = score >= 80 ? "from-emerald-500 to-teal-400" : score >= 60 ? "from-yellow-500 to-amber-400" : "from-red-500 to-rose-400";
                return (
                  <div className="space-y-6">
                    {/* Score + Summary row */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Score card */}
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 flex flex-col items-center justify-center text-center">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Resume Score</p>
                        <p className={`text-5xl font-black font-[Space_Grotesk] ${scoreColor}`}>{score}</p>
                        <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                        <div className="w-full mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor}`}
                          />
                        </div>
                      </div>
                      {/* Summary */}
                      <div className="md:col-span-2 rounded-xl bg-white/[0.03] border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <p className="text-sm font-semibold text-white">AI Summary</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{a.summary}</p>
                      </div>
                    </div>

                    {/* Skills */}
                    {a.skills.length > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Code2 className="w-4 h-4 text-violet-400" />
                          <p className="text-sm font-semibold text-white">Skills</p>
                          <span className="ml-auto text-xs text-muted-foreground">{a.skills.length} detected</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {a.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Education */}
                      {a.education.length > 0 && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            <p className="text-sm font-semibold text-white">Education</p>
                          </div>
                          <div className="space-y-3">
                            {a.education.map((edu, i) => (
                              <div key={i} className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium text-white">{edu.degree}</p>
                                <p className="text-xs text-muted-foreground">{edu.institution}{edu.year ? ` · ${edu.year}` : ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {a.certifications.length > 0 && (
                        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Award className="w-4 h-4 text-amber-400" />
                            <p className="text-sm font-semibold text-white">Certifications</p>
                          </div>
                          <div className="space-y-2">
                            {a.certifications.map((cert, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">{cert}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Projects */}
                    {a.projects.length > 0 && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <p className="text-sm font-semibold text-white">Projects</p>
                          <span className="ml-auto text-xs text-muted-foreground">{a.projects.length} found</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {a.projects.map((proj, i) => (
                            <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/5">
                              <p className="text-sm font-medium text-white mb-1">{proj.name}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
