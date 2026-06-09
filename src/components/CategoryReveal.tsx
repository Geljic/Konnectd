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
import { CATEGORY_COLOURS, type CategoryColour, LIGHT_COLORS } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { PuzzleCategory } from '@/api/puzzles';

interface CategoryRevealProps {
  category: PuzzleCategory;
  index: number;
  showExplanation?: boolean;
}

export function CategoryReveal({ category, index, showExplanation = false }: CategoryRevealProps) {
  const translateY = useSharedValue(-40);
  const scaleY     = useSharedValue(0.4);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    // No stagger delay — each banner is mounted fresh when tiles commit
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

  const bg = CATEGORY_COLOURS[category.colour as CategoryColour];

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg }, animStyle]}>
      <Text style={styles.name}>{category.name.toUpperCase()}</Text>
      <Text style={styles.words}>{category.words.join(', ')}</Text>
      {showExplanation && category.explanation ? (
        <Text style={styles.explanation}>{category.explanation}</Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    color: LIGHT_COLORS.categoryText,
    letterSpacing: 1,
    marginBottom: 4,
  },
  words: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: LIGHT_COLORS.categoryText,
    opacity: 0.75,
  },
  explanation: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: LIGHT_COLORS.categoryText,
    opacity: 0.6,
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
