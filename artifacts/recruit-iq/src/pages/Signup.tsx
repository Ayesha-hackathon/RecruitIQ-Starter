import { useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginUrl } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";

export default function Signup() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/candidate-dashboard");
    }
  }, [loading, user, setLocation]);

  const handleSignup = () => {
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/30 via-background/80 to-black" />
        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-primary" />
            <span className="text-lg font-bold text-white font-[Space_Grotesk]">RecruitIQ AI</span>
          </div>
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

          <Button
            onClick={handleSignup}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base"
            data-testid="button-signup"
          >
            Create Account
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={handleSignup}
              className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors"
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
