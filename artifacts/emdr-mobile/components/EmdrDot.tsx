import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

const DOT_SIZE = 60;
const SIDE_PADDING = 30;

interface EmdrDotProps {
  isPlaying: boolean;
  speedSeconds: number;
  dotColor: string;
  backgroundColor: string;
  style?: object;
}

export function EmdrDot({
  isPlaying,
  speedSeconds,
  dotColor,
  backgroundColor,
  style,
}: EmdrDotProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const maxX = containerWidth > 0
    ? containerWidth - DOT_SIZE - SIDE_PADDING * 2
    : 0;

  useEffect(() => {
    cancelAnimation(translateX);
    if (isPlaying && maxX > 0) {
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(maxX, {
          duration: speedSeconds * 1000,
          easing: Easing.linear,
        }),
        -1,
        true
      );
    }
  }, [isPlaying, speedSeconds, maxX]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[styles.container, { backgroundColor }, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {!isPlaying ? (
        <View style={styles.waitingContainer}>
          <Text
            style={[
              styles.waitingText,
              { color: dotColor, opacity: 0.75 },
            ]}
          >
            Waiting for session to begin
          </Text>
        </View>
      ) : (
        <View style={styles.trackContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: DOT_SIZE / 2,
                backgroundColor: dotColor,
                shadowColor: dotColor,
              },
              dotStyle,
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  waitingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 30,
  },
  trackContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SIDE_PADDING,
  },
  dot: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 10,
  },
});
