import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import {
  getSessionState,
  getGetSessionStateQueryKey,
} from "@workspace/api-client-react";
import { EmdrDot } from "@/components/EmdrDot";
import { COLORS } from "@/constants/colors";

export default function PatientSessionScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();

  const { data: sessionState, isLoading, error } = useQuery({
    queryKey: getGetSessionStateQueryKey(code ?? ""),
    queryFn: () => getSessionState(code ?? ""),
    enabled: !!code,
    refetchInterval: 750,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const handleLeave = () => {
    Alert.alert(
      "Leave Session",
      "Are you sure you want to leave this session?",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace("/patient");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" hidden />
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Connecting to session…</Text>
      </View>
    );
  }

  if (error || !sessionState) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="light" />
        <Ionicons name="warning-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Session Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This session may have expired or is no longer active.
        </Text>
        <Pressable
          onPress={() => router.replace("/patient")}
          style={({ pressed }) => [styles.errorBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const bg = sessionState.backgroundColor ?? COLORS.emdrNavy;
  const dot = sessionState.dotColor ?? COLORS.emdrOrchid;
  const isPlaying = sessionState.isPlaying ?? false;
  const speed = sessionState.speedSeconds ?? 2;

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />

      <EmdrDot
        isPlaying={isPlaying}
        speedSeconds={speed}
        dotColor={dot}
        backgroundColor={bg}
        style={styles.dotView}
      />

      <View style={[styles.overlay, { top: insets.top + 12 }]} pointerEvents="box-none">
        <Pressable onPress={handleLeave} style={styles.leaveBtn} hitSlop={12}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {!isPlaying && (
          <View style={styles.sessionCodeBadge}>
            <Text style={styles.sessionCodeText}>{code}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  dotView: { flex: 1 },
  overlay: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  leaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionCodeBadge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sessionCodeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: COLORS.textMuted,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: COLORS.text,
  },
  errorSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  errorBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  errorBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: COLORS.text,
  },
});
