import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LIGHT_COLORS } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { FONTS } from '@/constants/fonts';

const TILE_COLORS = [
  LIGHT_COLORS.yellow,
  LIGHT_COLORS.green,
  LIGHT_COLORS.blue,
  LIGHT_COLORS.purple,
];

// Each tile drifts diagonally out from / back toward the centre, on its own beat.
const OFFSETS = [
  { x: -1, y: -1 }, // top-left
  { x:  1, y: -1 }, // top-right
  { x: -1, y:  1 }, // bottom-left
  { x:  1, y:  1 }, // bottom-right
];

function AnimatedTile({ color, offset, delay, size, drift }: {
  color: string; offset: { x: number; y: number }; delay: number; size: number; drift: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.x * drift * t.value },
      { translateY: offset.y * drift * t.value },
    ],
  }));
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: color }, style]}
    />
  );
}

function AnimatedCore({ size, color }: { size: number; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + p.value * 0.35 }],
    opacity: 0.65 + p.value * 0.35,
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

export function CrossedSignalsIcon({ size = 14 }: { size?: number }) {
  const colors = useColors();
  const gap = size * 0.42;
  const grid = size * 2 + gap;
  const drift = size * 0.18;
  const railThickness = Math.max(2, size * 0.22);
  const core = size * 0.7;
  return (
    <View style={{ width: grid, height: grid, alignItems: 'center', justifyContent: 'center' }}>
      {/* crosshair rails behind the tiles */}
      <View style={{ position: 'absolute', width: grid, height: railThickness, borderRadius: railThickness, backgroundColor: colors.text3, opacity: 0.55 }} />
      <View style={{ position: 'absolute', width: railThickness, height: grid, borderRadius: railThickness, backgroundColor: colors.text3, opacity: 0.55 }} />
      <View style={{ width: grid, height: grid, flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {TILE_COLORS.map((color, i) => (
          <AnimatedTile key={i} color={color} offset={OFFSETS[i]} delay={i * 180} size={size} drift={drift} />
        ))}
      </View>
      <AnimatedCore size={core} color={colors.purple} />
      <View style={{ position: 'absolute', width: core * 0.42, height: core * 0.42, borderRadius: core, backgroundColor: colors.bgScreen, opacity: 0.9 }} />
    </View>
  );
}

export function CrossedSignalsLogo({ size = 16 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={styles.root}>
      <CrossedSignalsIcon size={size} />
      <Text style={[styles.wordmark, { color: colors.text1 }]}>Crossed Signals</Text>
      <Text style={[styles.tagline, { color: colors.text2 }]}>Decode the meaning grid</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 14 },
  wordmark: { fontSize: 28, fontFamily: FONTS.extraBold, letterSpacing: 1 },
  tagline: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 0.3 },
});
