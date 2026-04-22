import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { COLORS } from "@/constants/colors";

export default function SSOCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  const debugLog = (
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>
  ) => {
    // #region agent log
    fetch("http://127.0.0.1:7332/ingest/ea51380c-eb98-4248-bba9-d77f94224c3b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "6ac953",
      },
      body: JSON.stringify({
        sessionId: "6ac953",
        runId: "google-auth-investigation",
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  useEffect(() => {
    debugLog("H5", "app/sso-callback.tsx:useEffect", "SSO callback state", {
      isLoaded,
      isSignedIn,
    });
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace("/therapist/dashboard");
    } else {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
