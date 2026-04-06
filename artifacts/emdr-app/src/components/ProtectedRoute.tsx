import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSyncTherapist, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [, setLocation] = useLocation();
  const [synced, setSynced] = useState(false);
  const syncMutation = useSyncTherapist();

  const { data: therapist, isLoading: therapistLoading, isError: therapistError, refetch } = useGetMe({
    query: { enabled: isSignedIn === true && synced, queryKey: getGetMeQueryKey() },
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    if (synced) return;

    const name =
      user?.fullName ||
      user?.firstName ||
      user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Therapist";
    const email = user?.primaryEmailAddress?.emailAddress || "";

    if (!email) return;

    syncMutation.mutate(
      { data: { name, email } },
      {
        onSuccess: () => {
          setSynced(true);
          refetch();
        },
        onError: () => {
          setSynced(true);
        },
      }
    );
  }, [isLoaded, isSignedIn, synced]);

  if (!isLoaded || (isSignedIn && !synced) || (synced && therapistLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  if (therapistError || !therapist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Failed to load your account. Please try signing out and back in.
          </p>
          <button
            onClick={() => setLocation("/sign-in")}
            className="px-6 py-2 bg-primary text-white rounded-xl font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (therapist.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-border shadow-sm p-10 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Account Pending Activation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your account has been created and your email is verified. An administrator will activate your account shortly.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Signed in as <strong>{therapist.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
