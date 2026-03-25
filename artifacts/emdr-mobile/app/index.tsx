import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/auth";
import { COLORS } from "@/constants/colors";

export default function LandingScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/therapist/dashboard");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const handleTherapist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/therapist/login");
  };

  const handlePatient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/patient");
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0A142A", "#060C18"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.heroSection}>
          <View style={styles.iconRing}>
            <View style={styles.iconOuter}>
              <Ionicons name="eye-outline" size={44} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.title}>EMDR Therapy</Text>
          <Text style={styles.subtitle}>
            Bilateral stimulation{"\n"}for trauma-informed care
          </Text>
        </View>

        <View style={styles.buttonsSection}>
          <Text style={styles.prompt}>How are you joining today?</Text>

          <Pressable
            onPress={handleTherapist}
            style={({ pressed }) => [
              styles.roleCard,
              styles.therapistCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>I'm a Therapist</Text>
              <Text style={styles.roleDesc}>Create & control sessions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
          </Pressable>

          <Pressable
            onPress={handlePatient}
            style={({ pressed }) => [
              styles.roleCard,
              styles.patientCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.roleIcon, styles.patientIcon]}>
              <Ionicons name="infinite-outline" size={28} color="#7CB9E8" />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>I'm a Patient</Text>
              <Text style={styles.roleDesc}>Join with a session code</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textDim} />
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Secure, therapist-controlled sessions
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  heroSection: {
    alignItems: "center",
    gap: 16,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.primaryStrong,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.primaryDim,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonsSection: {
    gap: 14,
  },
  prompt: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 4,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  therapistCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
  },
  patientCard: {
    backgroundColor: COLORS.surface,
    borderColor: 'rgba(124,185,232,0.2)',
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primaryDim,
    justifyContent: "center",
    alignItems: "center",
  },
  patientIcon: {
    backgroundColor: 'rgba(124,185,232,0.12)',
  },
  roleText: {
    flex: 1,
    gap: 3,
  },
  roleTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: COLORS.text,
  },
  roleDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.textDim,
    textAlign: "center",
  },
});
