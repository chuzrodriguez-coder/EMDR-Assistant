import { useRoute } from "wouter";
import { useSessionEvents } from "@/hooks/use-session-events";
import { EmdrDisplay } from "@/components/EmdrDisplay";
import { Loader2 } from "lucide-react";

export default function PatientSessionView() {
  const [match, params] = useRoute("/patient/session/:sessionCode");
  const sessionCode = match ? params.sessionCode : undefined;

  const { state, isConnected } = useSessionEvents(sessionCode);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Connecting to session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <EmdrDisplay
        isPlaying={state.isPlaying}
        speedSeconds={state.speedSeconds}
        dotColor={state.dotColor}
        backgroundColor={state.backgroundColor}
      />
      
      {/* Subtle connection status indicator */}
      {!isConnected && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
          Reconnecting...
        </div>
      )}
    </div>
  );
}
