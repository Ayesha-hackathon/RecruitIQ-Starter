import { useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginUrl } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/candidate-dashboard");
    }
  }, [loading, user, setLocation]);

  const handleLogin = () => {
    window.location.href = loginUrl();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/30 via-background/80 to-black" />
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
          </div>
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

          <Button
            onClick={handleLogin}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
            data-testid="button-login"
          >
            Log in
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={handleLogin}
              className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors"
            >
              Create Account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
