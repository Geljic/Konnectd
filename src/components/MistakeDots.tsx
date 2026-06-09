import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { MAX_MISTAKES } from '@/constants/config';

function XIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Line x1="3" y1="3" x2="15" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="3" x2="3" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function MistakeMark({ active, justUsed, errorColor, textColor }: { active: boolean; justUsed: boolean; errorColor: string; textColor: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (justUsed) {
      scale.value = withSequence(
        withSpring(1.5, { damping: 7 }),
        withTiming(0.9, { duration: 120 }),
        withSpring(1, { damping: 10 }),
      );
    }
  }, [justUsed]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: active ? 1 : 0.18,
  }));

  return (
    <Animated.View style={style}>
      <XIcon color={active ? errorColor : textColor} />
    </Animated.View>
  );
}

export function MistakeDots({ mistakes }: { mistakes: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mistakes remaining</Text>
      <View style={styles.marks}>
        {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
          <MistakeMark
            key={i}
            active={i >= mistakes}
            justUsed={i === mistakes - 1}
            errorColor={colors.errorFlash}
            textColor={colors.text1}
          />
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    container: { alignItems: 'center', gap: 8 },
    label: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    marks: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  });
}
