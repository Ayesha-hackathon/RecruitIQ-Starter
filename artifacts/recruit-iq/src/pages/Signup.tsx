import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-background/80 to-black" />
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <BrainCircuit className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
            </div>
          </Link>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 font-[Space_Grotesk] leading-tight">
              The AI recruiter that never sleeps.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Join hundreds of enterprise teams automating their entire hiring pipeline with RecruitIQ AI.
            </p>
            <div className="mt-10 space-y-4">
              {[
                "Automated resume screening in seconds",
                "Adaptive AI interviews tailored to each role",
                "Smart candidate ranking across all dimensions",
                "Real-time hiring analytics dashboard",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Trusted by 500+ enterprise talent teams worldwide.
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

          <h1 className="text-3xl font-bold text-white mb-2 font-[Space_Grotesk]">Create your account</h1>
          <p className="text-muted-foreground mb-8">Start hiring smarter in minutes. No credit card required.</p>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Jane Smith"
                  className="pl-10 h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  data-testid="input-fullname"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Work Email</Label>
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
              <Label className="text-white/80 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
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

            <div className="space-y-2">
              <Label className="text-white/80 text-sm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className="pl-10 pr-10 h-12 bg-white/[0.04] border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
                  data-testid="input-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Link href="/candidate-dashboard">
              <Button
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base mt-2"
                data-testid="button-signup"
              >
                Create Account
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            By creating an account you agree to our{" "}
            <a href="#" className="text-primary/80 hover:text-primary transition-colors">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-primary/80 hover:text-primary transition-colors">Privacy Policy</a>.
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">Sign In</span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
