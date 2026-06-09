import { motion } from "framer-motion";
import { 
  ArrowRight, 
  BrainCircuit, 
  Search, 
  Zap, 
  ShieldCheck, 
  BarChart, 
  Users,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-hidden">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-white font-[Space_Grotesk]">RecruitIQ AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#platform" className="hover:text-white transition-colors">Platform</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10 hidden md:inline-flex">Sign In</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6">
              Request Access
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Intelligence Engine v2.0 Live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1] font-[Space_Grotesk]">
              The unfair advantage for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">elite hiring.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              RecruitIQ AI acts as your brilliant senior recruiter who never sleeps. We analyze millions of data points to deliver the perfect candidates before your competitors even open a resume.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8 text-base bg-white text-black hover:bg-gray-200">
                Deploy Your AI Recruiter
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/10 hover:bg-white/5">
                View Terminal Demo
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent blur-[100px] -z-10 rounded-full" />
            <div className="rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
              <img 
                src="/hero.png" 
                alt="RecruitIQ Terminal Interface" 
                className="w-full h-auto rounded-xl border border-white/5 object-cover aspect-video"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="border-y border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x divide-white/5">
            {[
              { label: "Time to Hire", value: "-43%" },
              { label: "Candidate Quality", value: "+89%" },
              { label: "Data Points Analyzed", value: "2.4B" },
              { label: "Top Tech Teams", value: "500+" }
            ].map((stat, i) => (
              <div key={i} className="px-4 text-center md:text-left">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 font-[Space_Grotesk]">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-[Space_Grotesk]">Precision targeting. <br />At unimaginable scale.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Traditional ATS platforms are dead archives. RecruitIQ is a living intelligence network that actively hunts, evaluates, and engages.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-8 h-8 text-primary" />,
                title: "Deep Graph Search",
                desc: "Go beyond keywords. Our AI understands context, career trajectories, and implicit skill overlaps to find hidden gems."
              },
              {
                icon: <Zap className="w-8 h-8 text-primary" />,
                title: "Millisecond Matching",
                desc: "Score and rank thousands of inbound applications against your precise requirements instantly."
              },
              {
                icon: <Users className="w-8 h-8 text-primary" />,
                title: "Predictive Retention",
                desc: "Identify candidates statistically proven to stay longer and perform better based on historical market data."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-card/50 border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Section 1 */}
      <section className="py-24 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full -z-10 transition-opacity group-hover:opacity-70" />
            <img 
              src="/funnel.png" 
              alt="Analytics Dashboard" 
              className="rounded-2xl border border-white/10 shadow-2xl w-full"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white text-sm font-medium mb-6 border border-white/10">
              <BarChart className="w-4 h-4 text-primary" /> Market Intelligence
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-[Space_Grotesk]">See the matrix of talent.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Stop guessing. Access a terminal-grade view of the talent market. Visualize competitive movement, salary benchmarks, and talent density in real-time.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Real-time compensation analytics",
                "Competitor talent migration tracking",
                "Automated diversity pipeline sourcing"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="h-12 px-6 border-white/10 hover:bg-white/5">
              Explore Analytics <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Security & Infrastructure Section */}
      <section id="security" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-[Space_Grotesk]">Enterprise-grade infrastructure.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for the most demanding compliance requirements. Your data is encrypted, isolated, and solely yours.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6 text-primary" />,
                title: "SOC 2 Type II Certified",
                desc: "Rigorous third-party audited security controls."
              },
              {
                icon: <Database className="w-6 h-6 text-primary" />,
                title: "Data Sovereignty",
                desc: "Isolated tenant architecture with regional hosting options."
              },
              {
                icon: <Globe className="w-6 h-6 text-primary" />,
                title: "GDPR & CCPA Compliant",
                desc: "Fully compliant with global privacy regulations."
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col items-center text-center hover:bg-white/[0.04] transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-black border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16 font-[Space_Grotesk]">Trusted by elite talent teams</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative">
              <div className="absolute top-8 right-8 text-primary opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z"/>
                </svg>
              </div>
              <p className="text-xl text-muted-foreground mb-8 relative z-10 leading-relaxed">
                "RecruitIQ completely changed our trajectory. We closed 5 senior engineering roles in 3 weeks that had been open for months. It's like having an entire sourcing team working 24/7."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-cyan-500"></div>
                <div>
                  <div className="font-bold text-white">Sarah Jenkins</div>
                  <div className="text-sm text-muted-foreground">VP of Talent, FinTech Unicorn</div>
                </div>
              </div>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative">
              <div className="absolute top-8 right-8 text-primary opacity-20">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z"/>
                </svg>
              </div>
              <p className="text-xl text-muted-foreground mb-8 relative z-10 leading-relaxed">
                "The signal-to-noise ratio is insane. The AI doesn't just find people with the right keywords, it finds people who actually fit our engineering culture and scale."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500"></div>
                <div>
                  <div className="font-bold text-white">David Chen</div>
                  <div className="text-sm text-muted-foreground">Head of Engineering, Series C SaaS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mask-image:linear-gradient(to_bottom,transparent,black,transparent)"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight font-[Space_Grotesk]">
            Ready to upgrade your command center?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join the most competitive engineering teams building the future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_0_30px_-5px_rgba(var(--primary),0.4)]">
              Request Early Access
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 text-white bg-black/50 backdrop-blur-sm">
              Contact Enterprise Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 px-6 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-white font-[Space_Grotesk]">RecruitIQ</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              The intelligence engine for modern talent acquisition. Find, evaluate, and hire elite talent before the competition.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-white transition-colors">Sourcing Engine</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Market Intelligence</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Predictive Analytics</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>© 2024 RecruitIQ AI. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
