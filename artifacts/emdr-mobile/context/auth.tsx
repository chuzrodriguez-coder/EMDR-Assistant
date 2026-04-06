import React, { createContext, useContext, useMemo, ReactNode, useState, useEffect } from "react";
import { useAuth as useClerkAuth, useUser, useClerk } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useSyncTherapist, useGetMe, type TherapistProfile } from "@workspace/api-client-react";

interface AuthContextValue {
  user: TherapistProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [synced, setSynced] = useState(false);

  const syncMutation = useSyncTherapist();

  const { data: profile, isLoading: profileLoading, refetch } = useGetMe({
    query: { enabled: isSignedIn === true && synced },
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || synced) return;
    const name =
      clerkUser?.fullName ||
      clerkUser?.firstName ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      "Therapist";
    const email = clerkUser?.primaryEmailAddress?.emailAddress || "";
    if (!email) return;
    syncMutation.mutate(
      { data: { name, email } },
      {
        onSuccess: () => { setSynced(true); refetch(); },
        onError: () => { setSynced(true); },
      }
    );
  }, [isLoaded, isSignedIn, synced]);

  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      setSynced(false);
      queryClient.clear();
    }
  }, [isSignedIn, isLoaded]);

  const logout = async () => {
    await signOut();
    queryClient.clear();
    setSynced(false);
  };

  const isLoading = !isLoaded || (isSignedIn === true && !synced) || (synced && profileLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: profile ?? null,
      isLoading,
      logout,
      refetchUser: () => refetch(),
    }),
    [profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
