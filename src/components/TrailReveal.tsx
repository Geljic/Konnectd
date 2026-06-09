import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { FONTS } from '@/constants/fonts';
import { LIGHT_COLORS } from '@/constants/colors';

interface TrailRevealProps {
  label: string;
  words: string[];
  color: string;
  revealed?: boolean; // true when shown as solution on loss (no animation)
}

export function TrailReveal({ label, words, color, revealed = false }: TrailRevealProps) {
  const translateY = useSharedValue(revealed ? 0 : -40);
  const scaleY = useSharedValue(revealed ? 1 : 0.4);
  const opacity = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    if (revealed) return;
    translateY.value = withSpring(0, { damping: 13, stiffness: 160 });
    scaleY.value = withSequence(
      withTiming(1.06, { duration: 220, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 14, stiffness: 260 }),
    );
    opacity.value = withTiming(1, { duration: 160 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scaleY: scaleY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.banner, { backgroundColor: color }, revealed && styles.bannerRevealed, animStyle]}>
      <Text style={styles.name}>{label.toUpperCase()}</Text>
      <View style={styles.wordRow}>
        {words.map((word, i) => (
          <React.Fragment key={word}>
            <View style={styles.wordChip}>
              <Text style={styles.wordText}>{word}</Text>
            </View>
            {i < words.length - 1 && <Text style={styles.arrow}>›</Text>}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 0,
    alignItems: 'center',
    gap: 8,
  },
  bannerRevealed: {
    opacity: 0.72,
  },
  name: {
    fontSize: 13,
    fontFamily: FONTS.extraBold,
    color: LIGHT_COLORS.categoryText,
    letterSpacing: 1,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordChip: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wordText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: LIGHT_COLORS.categoryText,
    letterSpacing: 0.6,
  },
  arrow: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: LIGHT_COLORS.categoryText,
    opacity: 0.6,
  },
});
