import { Link } from "wouter";
import { ArrowRight, Activity, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image/Gradients */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/landing-bg.png`} 
          alt="" 
          className="w-full h-full object-cover opacity-50 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl w-full px-6 text-center"
      >
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-8">
          <Activity className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
          Bilateral Stimulation, <br className="hidden md:block"/>Simplified.
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
          A seamless, synchronized platform for EMDR therapists and patients. Connect instantly and control sessions in real-time.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link href="/patient" className="group">
            <div className="glass-panel p-8 rounded-3xl text-left hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <UserCircle className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">I'm a Patient</h2>
              <p className="text-muted-foreground mb-6">Join a session using the 6-digit code provided by your therapist.</p>
              <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                Join Session <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>

          <Link href="/sign-in" className="group">
            <div className="bg-primary text-primary-foreground p-8 rounded-3xl text-left hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full border border-primary-foreground/10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">I'm a Therapist</h2>
              <p className="text-primary-foreground/80 mb-6">Log in to create sessions, invite patients, and control the EMDR interface.</p>
              <div className="flex items-center text-white font-medium group-hover:translate-x-1 transition-transform">
                Therapist Portal <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
