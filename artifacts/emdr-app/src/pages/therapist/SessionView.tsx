import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionEvents } from "@/hooks/use-session-events";
import {
  useUpdateSessionState,
  useSaveTheme,
  useDeleteTheme,
  getSavedThemes,
} from "@workspace/api-client-react";
import { EmdrDisplay } from "@/components/EmdrDisplay";
import {
  Play,
  Pause,
  ArrowLeft,
  Settings2,
  Rabbit,
  Snail,
  Info,
  X,
  Bookmark,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRESET_THEMES = [
  { name: "High Contrast", description: "Best Practice", bg: "#222222", dot: "#FFFFFF" },
  { name: "Calming", description: "Navy + Light Yellow", bg: "#000080", dot: "#FFF176" },
  { name: "Classic Default", description: "Navy + Orchid", bg: "#000080", dot: "#DA70D6" },
  { name: "Nature", description: "Dark Green + White", bg: "#1B4332", dot: "#F0FFF0" },
  { name: "Sage", description: "Dark Green + Soft Gold", bg: "#2D4A22", dot: "#FFD580" },
  { name: "Meditative", description: "Dark Purple + White", bg: "#2D1B69", dot: "#FFFFFF" },
  { name: "Grounding", description: "Black + Light Yellow", bg: "#0A0A0A", dot: "#FFE599" },
  { name: "Serene", description: "Deep Blue + Light Blue", bg: "#0A2463", dot: "#ADD8E6" },
  { name: "Energizing", description: "Dark Green + Gold", bg: "#1A3322", dot: "#FFD700" },
];

const COLOR_GUIDE = `Color Theme Guidelines for EMDR Sessions

Background Colors
The background should be grounding, dark, or neutral to reduce eye strain and help the client focus on the movement.

• Dark Grey / Black — Minimizes screen glare; the most recommended background. Allows the dot to stand out without visual fatigue.
• Deep Blue — Associated with calmness, trust, and safety. Helps anxious clients feel more at ease.
• Muted Green / Sage — Promotes balance, natural flow, and reduces mental fatigue.
• Dark Purple — Fosters inner strength and a meditative state.

Dot Colors
The dot should be easy to track — vibrant enough to see, but not so bright it causes contrast strain.

• White / Light Yellow — High contrast against dark backgrounds; easy to track without being harsh.
• Soft Green / Sage — Creates a gentle, soothing visual experience.
• Orchid / Light Blue — Soft, calming options that contrast well with dark backgrounds.
• Soft Gold / Yellow — Can feel uplifting and motivating.

Considerations
• Avoid neon or high-saturation colors — they raise physiological arousal and make it harder to relax.
• Avoid stark black-and-white — while high contrast is good, it can create unnecessary eye strain.
• Customize to the client — use energizing yellows for low-energy clients; calming blues and greens for anxious clients.
• Always confirm the dot contrasts clearly with the background and does not blend in.`;

const MAX_SAVED = 6;

export default function TherapistSessionView() {
  const [match, params] = useRoute("/therapist/session/:sessionCode");
  const sessionCode = match ? params.sessionCode : "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { state: serverState } = useSessionEvents(sessionCode);
  const updateMutation = useUpdateSessionState();
  const saveThemeMutation = useSaveTheme();
  const deleteThemeMutation = useDeleteTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2.0);
  const [bgColor, setBgColor] = useState("#000080");
  const [dotColor, setDotColor] = useState("#DA70D6");
  const [showGuide, setShowGuide] = useState(false);

  const { data: savedThemes = [], refetch: refetchThemes } = useQuery({
    queryKey: ["savedThemes"],
    queryFn: () => getSavedThemes(),
    retry: false,
  });

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
    if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);
    if (updates.speedSeconds !== undefined) setSpeed(updates.speedSeconds);
    if (updates.backgroundColor !== undefined) setBgColor(updates.backgroundColor);
    if (updates.dotColor !== undefined) setDotColor(updates.dotColor);

    updateMutation.mutate(
      { sessionId: sessionCode, data: updates },
      {
        onError: () => {
          toast({ title: "Failed to sync control change", variant: "destructive" });
        },
      }
    );
  };

  const applyTheme = (bg: string, dot: string) => {
    setBgColor(bg);
    setDotColor(dot);
    updateState({ backgroundColor: bg, dotColor: dot });
  };

  const handleSaveTheme = () => {
    if (savedThemes.length >= MAX_SAVED) {
      toast({
        title: "Maximum themes reached",
        description: "Delete a saved theme before saving a new one.",
        variant: "destructive",
      });
      return;
    }

    saveThemeMutation.mutate(
      { data: { backgroundColor: bgColor, dotColor } },
      {
        onSuccess: () => {
          toast({ title: "Theme saved to your profile" });
          refetchThemes();
        },
        onError: (err: any) => {
          toast({
            title: "Failed to save theme",
            description: err?.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleDeleteTheme = (themeId: number) => {
    deleteThemeMutation.mutate(
      { themeId },
      {
        onSuccess: () => {
          toast({ title: "Theme deleted" });
          refetchThemes();
        },
        onError: () => {
          toast({ title: "Failed to delete theme", variant: "destructive" });
        },
      }
    );
  };

  if (!sessionCode) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-muted/20 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-border px-4 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex items-center">
          <Link
            href="/therapist/dashboard"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground mr-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold leading-tight">Operator Console</h1>
            <p className="text-xs text-muted-foreground font-mono">CODE: {sessionCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${serverState ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {serverState ? "Live Sync Active" : "Connecting..."}
          </span>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview */}
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

          <div className="p-6 space-y-8 overflow-y-auto flex-1">

            {/* Play/Pause */}
            <div>
              <button
                onClick={() => updateState({ isPlaying: !isPlaying })}
                className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                  isPlaying
                    ? "bg-rose-50 text-rose-600 ring-2 ring-rose-500 hover:bg-rose-100"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
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

            {/* Speed */}
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

            <div className="h-px bg-border/60" />

            {/* Custom Colors */}
            <div className="space-y-5">
              <h3 className="font-medium text-sm text-foreground/80">Custom Colors</h3>

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
                onClick={() => updateState({ backgroundColor: "#000080", dotColor: "#DA70D6" })}
                className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset to default colors
              </button>
            </div>

            <div className="h-px bg-border/60" />

            {/* Save Current Theme */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-foreground/80">My Saved Themes</h3>
                <span className="text-xs text-muted-foreground">{savedThemes.length}/{MAX_SAVED}</span>
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveTheme}
                disabled={saveThemeMutation.isPending || savedThemes.length >= MAX_SAVED}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary/30 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Bookmark className="w-4 h-4" />
                {saveThemeMutation.isPending ? "Saving…" : "Save Current Colors"}
              </button>

              {/* Saved themes grid */}
              {savedThemes.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {savedThemes.map((theme) => {
                    const isActive =
                      bgColor === theme.backgroundColor && dotColor === theme.dotColor;
                    return (
                      <div
                        key={theme.id}
                        className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                          isActive
                            ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {/* Apply on click */}
                        <button
                          onClick={() => applyTheme(theme.backgroundColor, theme.dotColor)}
                          className="w-full h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: theme.backgroundColor }}
                          title="Apply this theme"
                        >
                          <div
                            className="w-4 h-4 rounded-full shadow"
                            style={{ backgroundColor: theme.dotColor }}
                          />
                        </button>
                        <span className="text-[10px] text-muted-foreground">Saved</span>

                        {/* Delete button on hover */}
                        <button
                          onClick={() => handleDeleteTheme(theme.id)}
                          disabled={deleteThemeMutation.isPending}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Delete this saved theme"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {savedThemes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No saved themes yet. Save up to {MAX_SAVED} of your favorite color combinations.
                </p>
              )}
            </div>

            <div className="h-px bg-border/60" />

            {/* Preset Themes */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-foreground/80">Recommended Themes</h3>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_THEMES.map((theme) => {
                  const isActive = bgColor === theme.bg && dotColor === theme.dot;
                  return (
                    <button
                      key={theme.name}
                      onClick={() => applyTheme(theme.bg, theme.dot)}
                      title={`${theme.name} — ${theme.description}`}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                        isActive
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div
                          className="w-4 h-4 rounded-full shadow"
                          style={{ backgroundColor: theme.dot }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight text-foreground/70 w-full truncate">
                        {theme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info Icon */}
            <div className="flex justify-center pt-2 pb-1">
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
              >
                <Info className="w-4 h-4 group-hover:text-primary" />
                <span>Color selection guidance</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Color Selection Guidance</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground/80 font-sans leading-relaxed">
                {COLOR_GUIDE}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
