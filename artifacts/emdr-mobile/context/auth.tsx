import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logoutTherapist, type TherapistProfile } from "@workspace/api-client-react";

interface AuthContextValue {
  user: TherapistProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const logout = async () => {
    try {
      await logoutTherapist();
    } catch {}
    queryClient.clear();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading,
      logout,
      refetchUser: () => refetch(),
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
