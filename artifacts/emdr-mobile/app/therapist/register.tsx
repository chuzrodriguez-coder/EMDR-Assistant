import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useRegisterTherapist } from "@workspace/api-client-react";
import { COLORS } from "@/constants/colors";

export default function TherapistRegisterScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = useRegisterTherapist();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    registerMutation.mutate(
      { data: { name: name.trim(), email: email.trim().toLowerCase(), password, confirmPassword: password } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSuccess(true);
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? err?.message ?? "Registration failed.";
          setError(msg);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        },
      }
    );
  };

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Account Created</Text>
          <Text style={styles.successSubtitle}>
            Your account is pending activation by an administrator. You'll be able to sign in once approved.
          </Text>
          <Pressable
            onPress={() => router.replace("/therapist/login")}
            style={({ pressed }) => [styles.successBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.successBtnText}>Back to Sign In</Text>
          </Pressable>
        </View>
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
            disabled={registerMutation.isPending}
            style={({ pressed }) => [
              styles.registerBtn,
              pressed && styles.btnPressed,
              registerMutation.isPending && styles.btnDisabled,
            ]}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </Pressable>

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
});
