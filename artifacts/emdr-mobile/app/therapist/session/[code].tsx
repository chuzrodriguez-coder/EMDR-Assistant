import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useQuery } from "@tanstack/react-query";
import {
  getSessionState,
  getGetSessionStateQueryKey,
  useUpdateSessionState,
  type UpdateSessionStateRequest,
} from "@workspace/api-client-react";
import { EmdrDot } from "@/components/EmdrDot";
import { COLORS } from "@/constants/colors";

const SPEEDS = [
  { label: "Slow", value: 4 },
  { label: "Medium", value: 2 },
  { label: "Fast", value: 1 },
  { label: "Swift", value: 0.5 },
];

export default function TherapistSessionScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [bgColor, setBgColor] = useState<string>(COLORS.emdrNavy);
  const [dotColor, setDotColor] = useState<string>(COLORS.emdrOrchid);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"speed" | "presets" | "colors">("speed");

  const { data: serverState, isLoading } = useQuery({
    queryKey: getGetSessionStateQueryKey(code ?? ""),
    queryFn: () => getSessionState(code ?? ""),
    enabled: !!code,
    refetchInterval: 5000,
  });

  const updateMutation = useUpdateSessionState();

  useEffect(() => {
    if (serverState && !updateMutation.isPending) {
      setIsPlaying(serverState.isPlaying);
      setSpeed(serverState.speedSeconds);
      setBgColor(serverState.backgroundColor);
      setDotColor(serverState.dotColor);
    }
  }, [serverState]);

  const updateState = useCallback(
    (updates: UpdateSessionStateRequest) => {
      if (!code) return;
      if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);
      if (updates.speedSeconds !== undefined) setSpeed(updates.speedSeconds);
      if (updates.backgroundColor !== undefined) setBgColor(updates.backgroundColor);
      if (updates.dotColor !== undefined) setDotColor(updates.dotColor);
      updateMutation.mutate({ sessionId: code, data: updates });
    },
    [code]
  );

  const handlePlayPause = () => {
    Haptics.impactAsync(
      isPlaying ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy
    );
    updateState({ isPlaying: !isPlaying });
  };

  const handleSpeed = (v: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateState({ speedSeconds: v });
  };

  const handlePreset = (bg: string, dot: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateState({ backgroundColor: bg, dotColor: dot });
  };

  const handleBgColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateState({ backgroundColor: color });
  };

  const handleDotColor = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateState({ dotColor: color });
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>
        <Pressable onPress={handleCopyCode} style={styles.codeChip} hitSlop={4}>
          <Text style={styles.codeChipText}>{code}</Text>
          <Ionicons
            name={copied ? "checkmark" : "copy-outline"}
            size={13}
            color={copied ? COLORS.success : COLORS.textMuted}
          />
        </Pressable>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
          <Text style={styles.statusText}>{isPlaying ? "Live" : "Paused"}</Text>
        </View>
      </View>

      <View style={styles.preview}>
        <EmdrDot
          isPlaying={isPlaying}
          speedSeconds={speed}
          dotColor={dotColor}
          backgroundColor={bgColor}
        />
      </View>

      <View style={styles.playPauseRow}>
        <Pressable
          onPress={handlePlayPause}
          style={({ pressed }) => [
            styles.playBtn,
            isPlaying ? styles.pauseBtn : styles.startBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={28}
            color={isPlaying ? COLORS.text : "#fff"}
          />
          <Text style={[styles.playBtnText, isPlaying && styles.pauseBtnText]}>
            {isPlaying ? "Pause Session" : "Start Session"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sectionTabs}>
        {(["speed", "presets", "colors"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveSection(tab)}
            style={[styles.sectionTab, activeSection === tab && styles.sectionTabActive]}
          >
            <Text style={[styles.sectionTabText, activeSection === tab && styles.sectionTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.controlsContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === "speed" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sweep Speed</Text>
            <View style={styles.speedGrid}>
              {SPEEDS.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => handleSpeed(s.value)}
                  style={({ pressed }) => [
                    styles.speedBtn,
                    speed === s.value && styles.speedBtnActive,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={[styles.speedLabel, speed === s.value && styles.speedLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.speedSub, speed === s.value && styles.speedSubActive]}>
                    {s.value}s
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeSection === "presets" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color Presets</Text>
            <View style={styles.presetsGrid}>
              {COLORS.PRESET_THEMES.map((preset) => (
                <Pressable
                  key={preset.name}
                  onPress={() => handlePreset(preset.bg, preset.dot)}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    bgColor === preset.bg && dotColor === preset.dot && styles.presetBtnActive,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <View style={styles.presetSwatch}>
                    <View style={[styles.swatchBg, { backgroundColor: preset.bg }]}>
                      <View style={[styles.swatchDot, { backgroundColor: preset.dot }]} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.presetName,
                      bgColor === preset.bg && dotColor === preset.dot && styles.presetNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {preset.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeSection === "colors" && (
          <View style={styles.section}>
            <View style={styles.colorSection}>
              <Text style={styles.sectionLabel}>Background Color</Text>
              <View style={styles.swatchRow}>
                {COLORS.BG_SWATCHES.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => handleBgColor(color)}
                    style={({ pressed }) => [
                      styles.colorSwatch,
                      { backgroundColor: color },
                      bgColor === color && styles.swatchSelected,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    {bgColor === color && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.colorSection, { marginTop: 24 }]}>
              <Text style={styles.sectionLabel}>Dot Color</Text>
              <View style={styles.swatchRow}>
                {COLORS.DOT_SWATCHES.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => handleDotColor(color)}
                    style={({ pressed }) => [
                      styles.colorSwatch,
                      { backgroundColor: color },
                      dotColor === color && styles.swatchSelected,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    {dotColor === color && (
                      <Ionicons name="checkmark" size={14} color={color === "#FFFFFF" ? "#000" : "#000"} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center",
  },
  codeChip: {
    flex: 1,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  codeChipText: { fontFamily: "Inter_700Bold", fontSize: 16, color: COLORS.text, letterSpacing: 3 },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.textDim,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success, shadowRadius: 4, shadowOpacity: 0.9, elevation: 4,
  },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12, color: COLORS.textMuted },
  preview: {
    height: 160,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    overflow: "hidden",
  },
  playPauseRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
  },
  startBtn: { backgroundColor: COLORS.primary },
  pauseBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  playBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#fff" },
  pauseBtnText: { color: COLORS.text },
  sectionTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  sectionTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTabActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primaryStrong,
  },
  sectionTabText: {
    fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.textMuted,
  },
  sectionTabTextActive: { color: COLORS.primary },
  controlsContent: { paddingHorizontal: 20, paddingTop: 16, gap: 0 },
  section: { gap: 14 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold", fontSize: 13,
    color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase",
  },
  speedGrid: { flexDirection: "row", gap: 10 },
  speedBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 14, alignItems: "center", gap: 4,
  },
  speedBtnActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primaryStrong,
  },
  speedLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: COLORS.textMuted },
  speedLabelActive: { color: COLORS.primary },
  speedSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: COLORS.textDim },
  speedSubActive: { color: COLORS.primaryStrong },
  presetsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  presetBtn: {
    width: "30%", alignItems: "center", gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 8,
  },
  presetBtnActive: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim,
  },
  presetSwatch: { alignItems: "center", justifyContent: "center" },
  swatchBg: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  swatchDot: {
    width: 14, height: 14, borderRadius: 7,
    shadowColor: "#fff", shadowRadius: 4, shadowOpacity: 0.5, elevation: 3,
  },
  presetName: {
    fontFamily: "Inter_500Medium", fontSize: 11, color: COLORS.textMuted, textAlign: "center",
  },
  presetNameActive: { color: COLORS.primary },
  colorSection: { gap: 12 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: COLORS.text,
    borderWidth: 2.5,
  },
});
