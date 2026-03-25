import { useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { useConfirmEmail } from "@workspace/api-client-react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConfirmEmail() {
  const [match, params] = useRoute("/confirm/:token");
  const token = match ? params.token : "";
  
  // We use the query hook to automatically fire the confirmation on mount
  const { data, isLoading, isError, error } = useConfirmEmail(token, {
    query: {
      enabled: !!token,
      retry: false
    }
  });

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full glass-panel p-10 rounded-3xl text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold">Confirming Email...</h1>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-destructive mb-6" />
            <h1 className="text-2xl font-bold mb-2">Confirmation Failed</h1>
            <p className="text-muted-foreground mb-8">{error?.error?.error || "The link may be invalid or expired."}</p>
            <Link href="/therapist/login" className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors">
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h1 className="text-2xl font-bold mb-2">Email Confirmed!</h1>
            <p className="text-muted-foreground mb-8">Your account is now active. You can log in and start creating sessions.</p>
            <Link href="/therapist/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Continue to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
