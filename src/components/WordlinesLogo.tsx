import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LIGHT_COLORS } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { FONTS } from '@/constants/fonts';

const NODE_COLORS = [
  LIGHT_COLORS.yellow,
  LIGHT_COLORS.green,
  LIGHT_COLORS.blue,
  LIGHT_COLORS.purple,
];

function AnimatedNode({ color, bobDelay, size }: { color: string; bobDelay: number; size: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      bobDelay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: color }, style]} />
  );
}

function Dash({ color, width = 24 }: { color: string; width?: number }) {
  return (
    <View style={{ width, height: 3, borderRadius: 2, backgroundColor: color, opacity: 0.6, alignSelf: 'center' }} />
  );
}

export function WordlinesIcon({ size = 36 }: { size?: number }) {
  const dashWidth = size * 0.55;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {NODE_COLORS.map((color, i) => (
        <React.Fragment key={i}>
          <AnimatedNode color={color} bobDelay={i * 200} size={size} />
          {i < NODE_COLORS.length - 1 && (
            <Dash color={NODE_COLORS[i + 1]} width={dashWidth} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export function WordlinesLogo({ nodeSize = 32 }: { nodeSize?: number }) {
  const colors = useColors();
  return (
    <View style={styles.root}>
      <WordlinesIcon size={nodeSize} />
      <Text style={[styles.wordmark, { color: colors.text1 }]}>Next Steps</Text>
      <Text style={[styles.tagline, { color: colors.text2 }]}>Ordered word paths</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 14 },
  wordmark: { fontSize: 30, fontFamily: FONTS.extraBold, letterSpacing: 2 },
  tagline: { fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 0.3 },
});
