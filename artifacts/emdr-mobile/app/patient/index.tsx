import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useJoinSession } from "@workspace/api-client-react";
import { COLORS } from "@/constants/colors";

export default function PatientCodeScreen() {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const joinMutation = useJoinSession();

  const handleJoin = () => {
    const trimmed = code.replace(/\s/g, "").trim();
    if (trimmed.length < 6) {
      setError("Please enter the complete 6-digit code.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    joinMutation.mutate(
      { data: { sessionCode: trimmed } },
      {
        onSuccess: (data) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push(`/patient/session/${data.sessionCode}`);
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Invalid or expired session code.";
          setError(msg);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      }
    );
  };

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(cleaned);
    if (error) setError("");
    if (cleaned.length === 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const codeDigits = code.split("");

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.iconRing}>
            <Ionicons name="infinite-outline" size={40} color="#7CB9E8" />
          </View>
          <Text style={styles.title}>Join Session</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code{"\n"}from your therapist
          </Text>
        </View>

        <View style={styles.codeSection}>
          <Pressable
            style={styles.codeBoxRow}
            onPress={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  i < code.length && styles.codeBoxFilled,
                  i === code.length && styles.codeBoxCursor,
                  i === 2 && styles.codeBoxGap,
                ]}
              >
                <Text style={styles.codeDigit}>{codeDigits[i] ?? ""}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={6}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            autoFocus
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={15} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              {code.length > 0 ? `${6 - code.length} digit${6 - code.length !== 1 ? "s" : ""} remaining` : "Tap the boxes to type"}
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleJoin}
          disabled={code.length < 6 || joinMutation.isPending}
          style={({ pressed }) => [
            styles.joinBtn,
            code.length < 6 && styles.joinBtnDisabled,
            pressed && code.length === 6 && styles.btnPressed,
          ]}
        >
          {joinMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.joinBtnText}>Join Session</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  header: {},
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center",
  },
  heroSection: { alignItems: "center", gap: 14 },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(124,185,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(124,185,232,0.25)',
    justifyContent: "center", alignItems: "center",
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: {
    fontFamily: "Inter_400Regular", fontSize: 15,
    color: COLORS.textMuted, textAlign: "center", lineHeight: 24,
  },
  codeSection: { alignItems: "center", gap: 16 },
  codeBoxRow: { flexDirection: "row", gap: 8 },
  codeBox: {
    width: 48, height: 60, borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
  },
  codeBoxFilled: { borderColor: COLORS.primaryStrong, backgroundColor: COLORS.primaryDim },
  codeBoxCursor: { borderColor: COLORS.primary },
  codeBoxGap: { marginRight: 8 },
  codeDigit: { fontFamily: "Inter_700Bold", fontSize: 24, color: COLORS.text },
  hiddenInput: {
    position: "absolute", opacity: 0, width: 1, height: 1,
  },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.errorDim, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.error },
  hint: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textDim },
  joinBtn: {
    backgroundColor: '#7CB9E8',
    borderRadius: 16, height: 58,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10,
  },
  joinBtnDisabled: { opacity: 0.4 },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  joinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#fff" },
});
