import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

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
                { label: "Resume reviewed by AI", done: true },
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
        </main>
      </div>
    </div>
  );
}
