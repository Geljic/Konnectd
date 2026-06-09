import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';
import Ellipse from 'react-native-svg';
import { LIGHT_COLORS, type ColorTheme } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { FONTS } from '@/constants/fonts';

const AnimatedEllipse = Animated.createAnimatedComponent(
  require('react-native-svg').Ellipse
);

const TILE_COLORS = [
  LIGHT_COLORS.yellow,
  LIGHT_COLORS.green,
  LIGHT_COLORS.blue,
  LIGHT_COLORS.purple,
];

function AnimatedTile({ color, bobDelay }: { color: string; bobDelay: number }) {
  const translateY = useSharedValue(0);
  const leftRY = useSharedValue(7);
  const rightRY = useSharedValue(7);

  useEffect(() => {
    // Gentle continuous bob — each tile at its own pace
    translateY.value = withDelay(
      bobDelay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,  { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    // Random blink / wink scheduler
    let cancelToken = { cancelled: false };

    function scheduleBlink() {
      const delay = 1800 + Math.random() * 3500;
      setTimeout(() => {
        if (cancelToken.cancelled) return;
        const isWink = Math.random() > 0.55;
        const blinkEye = isWink ? (Math.random() > 0.5 ? 'left' : 'right') : 'both';

        const closeL = blinkEye === 'left' || blinkEye === 'both';
        const closeR = blinkEye === 'right' || blinkEye === 'both';

        if (closeL) leftRY.value  = withSequence(withTiming(0.8, { duration: 70 }), withTiming(7, { duration: 90 }));
        if (closeR) rightRY.value = withSequence(withTiming(0.8, { duration: 70 }), withTiming(7, { duration: 90 }));

        scheduleBlink();
      }, delay);
    }

    scheduleBlink();
    return () => { cancelToken.cancelled = true; };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const leftEyeProps  = useAnimatedProps(() => ({ ry: leftRY.value  as unknown as string }));
  const rightEyeProps = useAnimatedProps(() => ({ ry: rightRY.value as unknown as string }));

  return (
    <Animated.View style={[styles.tile, containerStyle]}>
      <Svg width="88" height="88" viewBox="0 0 88 88">
        <Rect x="0" y="0" width="88" height="88" rx="20" fill={color} />
        <AnimatedEllipse cx="29" cy="38" rx="7" animatedProps={leftEyeProps}  fill="rgba(255,255,255,0.9)" />
        <AnimatedEllipse cx="59" cy="38" rx="7" animatedProps={rightEyeProps} fill="rgba(255,255,255,0.9)" />
        <Path
          d="M28 60 Q44 72 60 60"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function KonnectIcon({ size = 200 }: { size?: number }) {
  const scale = size / 200;
  return (
    <View style={{ width: size, height: size, transform: [{ scale }], transformOrigin: 'top left' }}>
      <View style={styles.grid}>
        {TILE_COLORS.map((color, i) => (
          <AnimatedTile key={i} color={color} bobDelay={i * 220} />
        ))}
      </View>
    </View>
  );
}

export function KonnectLogo({ iconSize = 160 }: { iconSize?: number }) {
  const colors = useColors();
  const textStyles = useMemo(() => makeTextStyles(colors), [colors]);
  return (
    <View style={textStyles.root}>
      <KonnectIcon size={iconSize} />
      <Text style={textStyles.wordmark}>KonnectD</Text>
      <Text style={textStyles.tagline}>Find four hidden groups</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 9,
  },
  tile: {
    width: 88,
    height: 88,
  },
});

function makeTextStyles(c: ColorTheme) {
  return StyleSheet.create({
    root: { alignItems: 'center', gap: 16 },
    wordmark: { fontSize: 36, fontFamily: FONTS.extraBold, color: c.text1, letterSpacing: 4 },
    tagline:  { fontSize: 15, fontFamily: FONTS.bold, color: c.text2, letterSpacing: 0.3 },
  });
}
