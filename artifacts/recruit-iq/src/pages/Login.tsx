import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-background/80 to-black" />
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <BrainCircuit className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
            </div>
          </Link>
          <div>
            <blockquote className="text-2xl font-medium text-white leading-relaxed mb-6 font-[Space_Grotesk]">
              "We closed 5 senior engineering roles in 3 weeks that had been open for months."
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-cyan-500" />
              <div>
                <div className="text-white font-semibold">Sarah Jenkins</div>
                <div className="text-sm text-muted-foreground">VP of Talent, FinTech Unicorn</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "-43%", label: "Time to Hire" },
              { value: "+89%", label: "Candidate Quality" },
              { value: "500+", label: "Enterprises" },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
                <div className="text-2xl font-bold text-white font-[Space_Grotesk]">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <BrainCircuit className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2 font-[Space_Grotesk]">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to your RecruitIQ AI account.</p>

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full h-12 border-white/10 hover:bg-white/5 text-white mb-6 gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-background px-3">or continue with email</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10 h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white/80 text-sm">Password</Label>
                <Link href="#">
                  <span className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer">Forgot Password?</span>
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Link href="/candidate-dashboard">
              <Button
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base mt-2"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup">
              <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">Create Account</span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
