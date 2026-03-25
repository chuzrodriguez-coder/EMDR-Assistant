import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterTherapist } from "@workspace/api-client-react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const registerMutation = useRegisterTherapist();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
        });
        setLocation("/therapist/login");
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.error?.error || "An error occurred.",
          variant: "destructive"
        });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-12">
      <Link href="/therapist/login" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-panel p-8 rounded-3xl"
      >
        <h1 className="text-3xl font-display font-bold mb-2">Create Account</h1>
        <p className="text-muted-foreground mb-8">Join as a therapist to start offering sessions.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="Dr. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-3.5 mt-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex justify-center items-center"
          >
            {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
