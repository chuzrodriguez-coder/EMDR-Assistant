import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLoginTherapist } from "@workspace/api-client-react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLoginTherapist();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        if (data.status === 'pending') {
          toast({
            title: "Email not confirmed",
            description: "Please check your email to confirm your account before logging in.",
          });
        } else {
          setLocation("/therapist/dashboard");
        }
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.error?.error || "Invalid credentials",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-8 rounded-3xl"
      >
        <h1 className="text-3xl font-display font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground mb-8">Sign in to your therapist account.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex justify-center items-center mt-4"
          >
            {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Don't have an account? <Link href="/therapist/register" className="text-primary font-medium hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
