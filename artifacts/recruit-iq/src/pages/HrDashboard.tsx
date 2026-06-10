import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  LayoutDashboard,
  Users,
  FileSearch,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  ChevronRight,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  LogOut,
  Menu,
  X,
  Trophy,
  Zap,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Overview", icon: <LayoutDashboard className="w-4 h-4" />, href: "/hr-dashboard" },
  { label: "Candidates", icon: <Users className="w-4 h-4" />, href: "#", badge: "248" },
  { label: "Resume Review", icon: <FileSearch className="w-4 h-4" />, href: "#", badge: "12" },
  { label: "Interviews", icon: <MessageSquare className="w-4 h-4" />, href: "#" },
  { label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "#" },
  { label: "Settings", icon: <Settings className="w-4 h-4" />, href: "#" },
];

const statCards = [
  {
    label: "Total Applicants",
    value: "1,284",
    delta: "+64 this week",
    trend: "up",
    icon: <Users className="w-5 h-5 text-primary" />,
    color: "from-primary/20 to-primary/5",
  },
  {
    label: "Top Candidates",
    value: "38",
    delta: "Score above 85/100",
    trend: "up",
    icon: <Trophy className="w-5 h-5 text-amber-400" />,
    color: "from-amber-500/20 to-amber-500/5",
  },
  {
    label: "Interviews Completed",
    value: "127",
    delta: "+18 this week",
    trend: "up",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    label: "Recommended Hires",
    value: "14",
    delta: "Awaiting your decision",
    trend: "neutral",
    icon: <UserCheck className="w-5 h-5 text-cyan-400" />,
    color: "from-cyan-500/20 to-cyan-500/5",
  },
];

const topCandidates = [
  { name: "Alex Morgan", role: "Senior Frontend Engineer", score: 94, status: "Ready to hire", avatar: "AM" },
  { name: "Jordan Lee", role: "Full Stack Developer", score: 91, status: "Final interview", avatar: "JL" },
  { name: "Sam Rivera", role: "DevOps Engineer", score: 89, status: "Technical review", avatar: "SR" },
  { name: "Casey Park", role: "Product Manager", score: 87, status: "Offer sent", avatar: "CP" },
  { name: "Taylor Brooks", role: "Data Scientist", score: 85, status: "Final interview", avatar: "TB" },
];

const recentActivity = [
  { action: "New applicant submitted resume", role: "ML Engineer", time: "2 min ago", type: "new" },
  { action: "AI interview completed", role: "Backend Engineer", time: "18 min ago", type: "done" },
  { action: "Hire recommendation generated", role: "UX Designer", time: "1 hr ago", type: "recommend" },
  { action: "Skill gap report available", role: "iOS Developer", time: "2 hr ago", type: "report" },
  { action: "Candidate declined offer", role: "Engineering Manager", time: "4 hr ago", type: "decline" },
];

const funnelData = [
  { stage: "Applications", count: 1284, pct: 100 },
  { stage: "Resume Screened", count: 872, pct: 68 },
  { stage: "Skill Assessed", count: 430, pct: 33 },
  { stage: "AI Interview", count: 214, pct: 17 },
  { stage: "Shortlisted", count: 78, pct: 6 },
  { stage: "Recommended", count: 14, pct: 1 },
];

export default function HrDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
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
          <div className="text-sm font-semibold text-white">Rachel Kim</div>
          <div className="text-xs text-primary mt-0.5">HR Manager</div>
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
              {item.badge && (
                <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-xs px-1.5">{item.badge}</Badge>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20">
          <button className="lg:hidden text-muted-foreground hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-[Space_Grotesk]">HR Dashboard</h1>
            <p className="text-xs text-muted-foreground">Tuesday, June 10, 2026</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex-shrink-0" />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-auto">

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {statCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl bg-card/50 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
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
                  <div className="text-3xl font-bold text-white font-[Space_Grotesk] mb-1">{card.value}</div>
                  <div className="text-sm font-medium text-white mb-1">{card.label}</div>
                  <div className="text-xs text-muted-foreground">{card.delta}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Hiring Funnel + Activity */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Hiring funnel chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 rounded-2xl bg-card/50 border border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white font-[Space_Grotesk]">Hiring Funnel</h2>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Live</Badge>
              </div>
              <div className="space-y-4">
                {funnelData.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white font-medium">{item.stage}</span>
                      <span className="text-muted-foreground">{item.count.toLocaleString()} <span className="text-white/30 ml-1">({item.pct}%)</span></span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ delay: 0.4 + i * 0.07, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl bg-card/50 border border-white/5 p-6"
            >
              <h2 className="text-lg font-bold text-white font-[Space_Grotesk] mb-5">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.type === "new" ? "bg-primary" : item.type === "done" ? "bg-emerald-400" : item.type === "recommend" ? "bg-amber-400" : item.type === "decline" ? "bg-rose-400" : "bg-cyan-400"}`} />
                    <div>
                      <div className="text-sm text-white font-medium leading-tight">{item.action}</div>
                      <div className="text-xs text-primary mt-0.5">{item.role}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top candidates */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-card/50 border border-white/5 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white font-[Space_Grotesk]">Top Candidates</h2>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-3">
              {topCandidates.map((c, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.role}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-white">{c.score}</span>
                    </div>
                    <span className="hidden sm:block text-xs px-2.5 py-1 rounded-full border border-white/10 text-muted-foreground bg-white/[0.02]">{c.status}</span>
                    <Button size="sm" className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid sm:grid-cols-3 gap-4"
          >
            {[
              { icon: <Zap className="w-5 h-5 text-primary" />, label: "Run AI Screening", desc: "Screen 47 pending applications" },
              { icon: <MessageSquare className="w-5 h-5 text-emerald-400" />, label: "Schedule Interviews", desc: "14 candidates ready" },
              { icon: <BarChart3 className="w-5 h-5 text-cyan-400" />, label: "Export Report", desc: "Weekly hiring analytics" },
            ].map((action, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card/50 border border-white/5 hover:border-white/10 transition-all cursor-pointer group flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  {action.icon}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 group-hover:text-white transition-colors" />
              </div>
            ))}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
