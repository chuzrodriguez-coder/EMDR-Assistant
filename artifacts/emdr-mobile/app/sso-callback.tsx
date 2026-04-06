import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { COLORS } from "@/constants/colors";

export default function SSOCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
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
