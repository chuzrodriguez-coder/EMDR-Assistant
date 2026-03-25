import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useJoinSession } from "@workspace/api-client-react";
import { ArrowRight, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function PatientLanding() {
  const [code, setCode] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const joinMutation = useJoinSession();

  useEffect(() => {
    // Check for code in URL
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam && codeParam.length === 6) {
      setCode(codeParam);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit session code.",
        variant: "destructive"
      });
      return;
    }

    joinMutation.mutate({ data: { sessionCode: code } }, {
      onSuccess: () => {
        setLocation(`/patient/session/${code}`);
      },
      onError: (err) => {
        toast({
          title: "Failed to join",
          description: (err.data as any)?.error || "Invalid or expired session code.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel p-8 md:p-10 rounded-3xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Join Session</h1>
        <p className="text-center text-muted-foreground mb-8 text-balance">
          Enter the 6-digit code provided by your therapist to sync your screen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/80 text-center">Session Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-4xl tracking-[0.5em] font-display font-semibold px-4 py-6 rounded-2xl border-2 border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase placeholder:text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || joinMutation.isPending}
            className="w-full flex items-center justify-center px-6 py-4 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
          >
            {joinMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Join Session <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
