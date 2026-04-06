import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { useCreateSession } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { COLORS } from "@/constants/colors";

interface AppExtra {
  privacyPolicyUrl?: string;
  supportEmail?: string;
}

const _extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const PRIVACY_URL = _extra.privacyPolicyUrl ?? "";
const SUPPORT_EMAIL = _extra.supportEmail ?? "support@emdrtherapy.app";

export default function TherapistDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createSessionMutation = useCreateSession();

  const handleCreateSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createSessionMutation.mutate(undefined, {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setActiveSession(data.sessionCode);
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Failed to create session.";
        Alert.alert("Error", msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  };

  const handleCopyCode = async () => {
    if (!activeSession) return;
    await Clipboard.setStringAsync(activeSession);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSession = () => {
    if (!activeSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/therapist/session/${activeSession}`);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const codeDigits = activeSession ? activeSession.split("") : [];

  if (user && user.status === "pending") {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <StatusBar style="light" />
        <Ionicons name="time-outline" size={48} color={COLORS.warning ?? "#F59E0B"} />
        <Text style={[styles.userName, { fontSize: 22, textAlign: "center", marginTop: 16 }]}>Account Pending Activation</Text>
        <Text style={[styles.greeting, { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 }]}>
          Your account has been created and your email is verified. An administrator will activate your account shortly.
        </Text>
        <Text style={[styles.greeting, { marginTop: 12 }]}>Signed in as {user.email}</Text>
        <Pressable
          onPress={() => { logout(); router.replace("/"); }}
          style={({ pressed }) => [{ marginTop: 32, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.surface }, pressed && { opacity: 0.7 }]}
        >
          <Text style={{ fontFamily: "Inter_500Medium", color: COLORS.textMuted, fontSize: 15 }}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name[0].toUpperCase() : "T"}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ?? "Therapist"}
            </Text>
          </View>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeSession ? (
          <View style={styles.sessionCard}>
            <View style={styles.sessionCardHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Session Active</Text>
              </View>
            </View>

            <Text style={styles.codeLabel}>Share this code with your patient</Text>

            <View style={styles.codeDisplay}>
              {codeDigits.map((digit, i) => (
                <View key={i} style={[styles.digitBox, i === 2 && styles.digitSpacer]}>
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sessionActions}>
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => [styles.actionBtn, styles.copyBtn, pressed && styles.btnPressed]}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={18}
                  color={copied ? COLORS.success : COLORS.primary}
                />
                <Text style={[styles.actionBtnText, copied && styles.copiedText]}>
                  {copied ? "Copied!" : "Copy Code"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleOpenSession}
                style={({ pressed }) => [styles.actionBtn, styles.controlBtn, pressed && styles.btnPressed]}
              >
                <Ionicons name="radio-button-on" size={18} color="#fff" />
                <Text style={[styles.actionBtnText, styles.controlBtnText]}>Control Session</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="radio-outline" size={48} color={COLORS.textDim} />
            <Text style={styles.emptyTitle}>No Active Session</Text>
            <Text style={styles.emptySubtitle}>
              Create a new session to get started. Your patient will join using the generated code.
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepsCard}>
            {[
              { icon: "add-circle-outline", text: "Create a session to receive a unique 6-digit code" },
              { icon: "share-outline", text: "Share the code with your patient to connect them" },
              { icon: "radio-button-on-outline", text: "Control the bilateral stimulation dot in real time" },
            ].map((step, i) => (
              <View key={i} style={[styles.stepRow, i > 0 && styles.stepDivider]}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon as any} size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handleCreateSession}
          disabled={createSessionMutation.isPending}
          style={({ pressed }) => [
            styles.createBtn,
            pressed && styles.btnPressed,
            createSessionMutation.isPending && styles.btnDisabled,
          ]}
        >
          {createSessionMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.createBtnText}>
                {activeSession ? "Start New Session" : "Create Session"}
              </Text>
            </>
          )}
        </Pressable>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <View style={styles.aboutRow}>
              <View style={styles.aboutIconWrap}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>{APP_VERSION}</Text>
            </View>
            <View style={styles.aboutDivider} />
            <Pressable
              style={({ pressed }) => [styles.aboutRow, pressed && styles.btnPressed]}
              onPress={() => PRIVACY_URL && Linking.openURL(PRIVACY_URL)}
            >
              <View style={styles.aboutIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Ionicons name="open-outline" size={15} color={COLORS.textDim} />
            </Pressable>
            <View style={styles.aboutDivider} />
            <Pressable
              style={({ pressed }) => [styles.aboutRow, pressed && styles.btnPressed]}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <View style={styles.aboutIconWrap}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.aboutLabel}>Contact Support</Text>
              <Text style={styles.aboutValue} numberOfLines={1}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primaryStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 18, color: COLORS.primary },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.textMuted },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.text, maxWidth: 200 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center",
  },
  content: { padding: 20, gap: 24 },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryStrong,
    gap: 16,
  },
  sessionCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success, shadowRadius: 4, shadowOpacity: 0.8, elevation: 4,
  },
  liveText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.success },
  codeLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.textMuted },
  codeDisplay: { flexDirection: "row", gap: 8, alignItems: "center" },
  digitBox: {
    flex: 1,
    height: 60,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  digitSpacer: { marginRight: 8 },
  digitText: { fontFamily: "Inter_700Bold", fontSize: 26, color: COLORS.text, letterSpacing: 0 },
  sessionActions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  copyBtn: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primaryStrong },
  controlBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.5 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.primary },
  copiedText: { color: COLORS.success },
  controlBtnText: { color: "#fff" },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: COLORS.textMuted },
  emptySubtitle: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.textDim,
    textAlign: "center", lineHeight: 22,
  },
  infoSection: { gap: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: COLORS.textMuted },
  stepsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  stepRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 16, paddingHorizontal: 18,
  },
  stepDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  stepIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryDim,
    justifyContent: "center", alignItems: "center",
  },
  stepText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.textMuted, flex: 1, lineHeight: 20 },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#fff" },
  aboutSection: { gap: 12 },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  aboutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryDim,
    justifyContent: "center",
    alignItems: "center",
  },
  aboutLabel: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: COLORS.text,
  },
  aboutValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.textMuted,
  },
  aboutDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 62 },
});
