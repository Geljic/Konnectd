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
  compact?: boolean;
  explanationLines?: number;
}

export function CategoryReveal({ category, index, showExplanation = false, compact = false, explanationLines }: CategoryRevealProps) {
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
    <Animated.View style={[styles.banner, compact && styles.bannerCompact, { backgroundColor: bg }, animStyle]}>
      <Text style={[styles.name, compact && styles.nameCompact]}>{category.name.toUpperCase()}</Text>
      <View style={[styles.wordTiles, compact && styles.wordTilesCompact]}>
        {category.words.map(word => (
          <View key={word} style={[styles.wordTile, compact && styles.wordTileCompact]}>
            <Text style={[styles.wordTileText, compact && styles.wordTileTextCompact]}>{word}</Text>
          </View>
        ))}
      </View>
      {showExplanation && category.explanation ? (
        <Text
          style={[styles.explanation, compact && styles.explanationCompact]}
          numberOfLines={explanationLines}
          adjustsFontSizeToFit={explanationLines === 1}
          minimumFontScale={0.86}
        >
          {category.explanation}
        </Text>
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
  bannerCompact: {
    borderRadius: 10,
    padding: 9,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    color: LIGHT_COLORS.categoryText,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nameCompact: {
    fontSize: 13,
    marginBottom: 2,
  },
  wordTiles: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
  },
  wordTilesCompact: {
    gap: 5,
    marginTop: 1,
  },
  wordTile: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  wordTileCompact: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  wordTileText: {
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    color: LIGHT_COLORS.categoryText,
    letterSpacing: 0.6,
  },
  wordTileTextCompact: {
    fontSize: 10,
    letterSpacing: 0.3,
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
  explanationCompact: {
    fontSize: 10,
    marginTop: 4,
  },
});
