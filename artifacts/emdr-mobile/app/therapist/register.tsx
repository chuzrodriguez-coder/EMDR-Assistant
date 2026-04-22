import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useSSO } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";
import * as Linking from "expo-linking";
import { COLORS } from "@/constants/colors";

export default function TherapistRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!isLoaded) return;
    setError("");
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signUp.create({
        firstName: name.trim().split(" ")[0],
        lastName: name.trim().split(" ").slice(1).join(" ") || undefined,
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Registration failed.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    try {
      setError("");
      const redirectUrl = Linking.createURL("/sso-callback");
      debugLog("H1", "app/therapist/register.tsx:handleOAuth:start", "OAuth initiated", {
        strategy,
        platform: Platform.OS,
        isLoaded,
        redirectUrl,
      });
      const { createdSessionId, setActive: setActiveSSO } = await startSSOFlow({
        strategy,
        redirectUrl,
      });
      debugLog("H3", "app/therapist/register.tsx:handleOAuth:result", "startSSOFlow returned", {
        strategy,
        hasCreatedSessionId: Boolean(createdSessionId),
        hasSetActive: Boolean(setActiveSSO),
      });
      if (createdSessionId && setActiveSSO) {
        await setActiveSSO({ session: createdSessionId });
        router.replace("/therapist/dashboard");
      }
    } catch (err: any) {
      debugLog("H4", "app/therapist/register.tsx:handleOAuth:error", "OAuth failed", {
        strategy,
        platform: Platform.OS,
        errorMessage: err?.message ?? null,
        clerkMessage: err?.errors?.[0]?.longMessage ?? null,
        clerkCode: err?.errors?.[0]?.code ?? null,
      });
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "OAuth sign-up failed.";
      setError(msg);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    if (!isLoaded) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/therapist/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Verification failed.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Pressable onPress={() => setStep("details")} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleSection}>
            <Ionicons name="mail-open-outline" size={36} color={COLORS.primary} />
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{"\n"}<Text style={{ color: COLORS.text }}>{email}</Text>
            </Text>
          </View>
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="keypad-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={COLORS.textDim}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
              </View>
            </View>
            <Pressable
              onPress={handleVerify}
              disabled={isLoading}
              style={({ pressed }) => [styles.registerBtn, pressed && styles.btnPressed, isLoading && styles.btnDisabled]}
            >
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.registerBtnText}>Verify & Sign In</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register as an EMDR therapist</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dr. Jane Smith"
                placeholderTextColor={COLORS.textDim}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textDim}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Minimum 8 characters"
                placeholderTextColor={COLORS.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.registerBtn,
              pressed && styles.btnPressed,
              isLoading && styles.btnDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.oauthRow}>
            <Pressable
              onPress={() => handleOAuth("oauth_google")}
              style={({ pressed }) => [styles.oauthBtn, pressed && styles.btnPressed]}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.text} />
              <Text style={styles.oauthBtnText}>Google</Text>
            </Pressable>
            {Platform.OS === "ios" && (
              <Pressable
                onPress={() => handleOAuth("oauth_apple")}
                style={({ pressed }) => [styles.oauthBtn, pressed && styles.btnPressed]}
              >
                <Ionicons name="logo-apple" size={20} color={COLORS.text} />
                <Text style={styles.oauthBtnText}>Apple</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Pressable onPress={() => router.replace("/therapist/login")}>
              <Text style={styles.loginLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center",
  },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 32 },
  titleSection: { gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 30, color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.textMuted },
  form: { gap: 20 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.errorDim, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)',
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.error, flex: 1 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textMuted, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { width: 20 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: COLORS.text },
  passwordInput: { letterSpacing: 0.5 },
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    height: 54, justifyContent: "center", alignItems: "center", marginTop: 4,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#fff" },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  loginText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.textMuted },
  loginLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.primary },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 20 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.text, textAlign: "center" },
  successSubtitle: {
    fontFamily: "Inter_400Regular", fontSize: 16, color: COLORS.textMuted,
    textAlign: "center", lineHeight: 24,
  },
  successBtn: {
    backgroundColor: COLORS.success, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 32, marginTop: 12,
  },
  successBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.textMuted },
  oauthRow: { flexDirection: "row", gap: 12 },
  oauthBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    height: 50,
  },
  oauthBtnText: { fontFamily: "Inter_500Medium", fontSize: 15, color: COLORS.text },
});
