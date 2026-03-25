import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useSessionEvents } from "@/hooks/use-session-events";
import { useUpdateSessionState } from "@workspace/api-client-react";
import { EmdrDisplay } from "@/components/EmdrDisplay";
import { Play, Pause, ArrowLeft, Settings2, Rabbit, Snail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TherapistSessionView() {
  const [match, params] = useRoute("/therapist/session/:sessionCode");
  const sessionCode = match ? params.sessionCode : "";
  const { toast } = useToast();

  const { state: serverState } = useSessionEvents(sessionCode);
  const updateMutation = useUpdateSessionState();

  // Local state for optimistic updates
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2.0);
  const [bgColor, setBgColor] = useState("#808080");
  const [dotColor, setDotColor] = useState("#FFFFFF");

  // Sync local state when server state changes (if no pending mutation)
  useEffect(() => {
    if (serverState && !updateMutation.isPending) {
      setIsPlaying(serverState.isPlaying);
      setSpeed(serverState.speedSeconds);
      setBgColor(serverState.backgroundColor);
      setDotColor(serverState.dotColor);
    }
  }, [serverState]);

  const updateState = (updates: any) => {
    if (!sessionCode) return;
    
    // Apply locally
    if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);
    if (updates.speedSeconds !== undefined) setSpeed(updates.speedSeconds);
    if (updates.backgroundColor !== undefined) setBgColor(updates.backgroundColor);
    if (updates.dotColor !== undefined) setDotColor(updates.dotColor);

    // Send to server
    updateMutation.mutate({ 
      sessionId: sessionCode, 
      data: updates 
    }, {
      onError: () => {
        toast({ title: "Failed to sync control change", variant: "destructive" });
      }
    });
  };

  if (!sessionCode) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-muted/20 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-border px-4 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex items-center">
          <Link href="/therapist/dashboard" className="p-2 rounded-lg hover:bg-muted text-muted-foreground mr-4 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold leading-tight">Operator Console</h1>
            <p className="text-xs text-muted-foreground font-mono">CODE: {sessionCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${serverState ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
          <span className="text-xs font-medium text-muted-foreground">{serverState ? 'Live Sync Active' : 'Connecting...'}</span>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Preview Container */}
        <div className="flex-1 p-4 lg:p-8 bg-black/5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/50 relative">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/40 text-white/80 rounded-full text-xs font-medium backdrop-blur-md">
              Patient View Preview
            </div>
            <EmdrDisplay 
              isPlaying={isPlaying}
              speedSeconds={speed}
              backgroundColor={bgColor}
              dotColor={dotColor}
            />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full lg:w-96 bg-white border-l border-border flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
          <div className="p-6 border-b border-border flex items-center gap-3 bg-slate-50/50">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Session Controls</h2>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto">
            
            {/* Play/Pause */}
            <div>
              <button
                onClick={() => updateState({ isPlaying: !isPlaying })}
                className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                  isPlaying 
                    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-500 hover:bg-rose-100' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-10 h-10" />
                    <span className="font-bold tracking-wide">PAUSE SESSION</span>
                  </>
                ) : (
                  <>
                    <Play className="w-10 h-10 ml-1" />
                    <span className="font-bold tracking-wide">START SESSION</span>
                  </>
                )}
              </button>
            </div>

            {/* Speed Control */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium text-sm text-foreground/80">Sweep Speed</label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary font-semibold">
                  {speed.toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Rabbit className="w-5 h-5 text-muted-foreground" />
                <input 
                  type="range" 
                  min="0.5" 
                  max="5.0" 
                  step="0.1" 
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  onMouseUp={() => updateState({ speedSeconds: speed })}
                  onTouchEnd={() => updateState({ speedSeconds: speed })}
                  className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <Snail className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Time for dot to cross the screen</p>
            </div>

            <div className="h-px bg-border/60"></div>

            {/* Colors */}
            <div className="space-y-5">
              <h3 className="font-medium text-sm text-foreground/80">Appearance</h3>
              
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                <label className="text-sm font-medium">Background Color</label>
                <input 
                  type="color" 
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  onBlur={() => updateState({ backgroundColor: bgColor })}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/50">
                <label className="text-sm font-medium">Dot Color</label>
                <input 
                  type="color" 
                  value={dotColor}
                  onChange={(e) => setDotColor(e.target.value)}
                  onBlur={() => updateState({ dotColor: dotColor })}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
              
              <button 
                onClick={() => updateState({ backgroundColor: "#808080", dotColor: "#FFFFFF" })}
                className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset to default colors
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
