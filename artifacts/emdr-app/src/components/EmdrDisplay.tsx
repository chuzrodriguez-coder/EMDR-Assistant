import { memo } from "react";

interface EmdrDisplayProps {
  isPlaying: boolean;
  speedSeconds: number;
  dotColor: string;
  backgroundColor: string;
}

export const EmdrDisplay = memo(function EmdrDisplay({
  isPlaying,
  speedSeconds,
  dotColor,
  backgroundColor,
}: EmdrDisplayProps) {
  // Ensure we have fallback colors
  const bg = backgroundColor || "#808080";
  const dot = dotColor || "#ffffff";

  return (
    <div
      className="relative w-full h-full overflow-hidden transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: bg }}
    >
      {!isPlaying ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p 
            className="text-2xl md:text-4xl font-display font-medium text-center max-w-2xl text-balance"
            style={{ 
              color: dot, 
              opacity: 0.8,
              textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            Please wait for the operator to initiate the session.
          </p>
        </div>
      ) : (
        <div className="absolute inset-y-0 w-full flex items-center px-[30px]">
          <div className="relative w-full h-[60px]">
            <div
              className="absolute top-0 h-[60px] w-[60px] rounded-full shadow-lg will-change-[left] animate-emdr"
              style={{
                backgroundColor: dot,
                animationDuration: `${speedSeconds}s`,
                boxShadow: `0 0 20px 2px ${dot}40`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});
