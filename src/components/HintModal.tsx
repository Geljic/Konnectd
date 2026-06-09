import React, { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { type HintTier, type HintResult, HINT_COSTS } from '@/store/gameStore';
import { MAX_HINTS } from '@/constants/config';

const TIER_META: Array<{ tier: HintTier; label: string; description: string; emoji: string }> = [
  {
    tier: 'warmcold',
    label: 'Warm / Cold',
    description: 'How many of your selected words belong in the same group?',
    emoji: '🌡️',
  },
  {
    tier: 'wordreveal',
    label: 'Word Reveal',
    description: 'One word is revealed with its group colour.',
    emoji: '💡',
  },
  {
    tier: 'categorypeek',
    label: 'Category Peek',
    description: 'One category name is revealed, without its words.',
    emoji: '👁️',
  },
];

interface Props {
  visible: boolean;
  hintsUsed: number;
  hintPenalty: number;
  rewardedHintTokens: number;
  isPremium: boolean;
  onSelectTier: (tier: HintTier) => void;
  onClose: () => void;
  onWatchRewardedAd?: () => void;
  rewardedAdLoading?: boolean;
}

export function HintModal({
  visible,
  hintsUsed,
  hintPenalty,
  rewardedHintTokens,
  isPremium,
  onSelectTier,
  onClose,
  onWatchRewardedAd,
  rewardedAdLoading = false,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hintsLeft = isPremium ? Infinity : MAX_HINTS - hintsUsed;
  const exhausted = !isPremium && hintsLeft <= 0 && rewardedHintTokens <= 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Use a Hint</Text>
            {isPremium ? (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ Premium — unlimited hints</Text>
              </View>
            ) : (
              <Text style={styles.subtitle}>
                {hintsLeft === Infinity ? '' : `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} remaining`}
                {rewardedHintTokens > 0 ? ` · ${rewardedHintTokens} ad hint${rewardedHintTokens !== 1 ? 's' : ''}` : ''}
                {hintPenalty > 0 ? ` · −${hintPenalty} pts so far` : ''}
              </Text>
            )}
          </View>

          {exhausted ? (
            <View style={styles.upgradeBox}>
              <Text style={styles.upgradeTitle}>No hints left</Text>
              <Text style={styles.upgradeDesc}>
                Watch a rewarded video to unlock one extra hint for this puzzle.
              </Text>
              {onWatchRewardedAd && (
                <Pressable
                  style={[styles.rewardBtn, rewardedAdLoading && styles.rewardBtnDisabled]}
                  onPress={onWatchRewardedAd}
                  disabled={rewardedAdLoading}
                >
                  <Text style={styles.rewardBtnText}>
                    {rewardedAdLoading ? 'Loading ad...' : 'Watch ad for 1 hint'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            TIER_META.map(({ tier, label, description, emoji }) => {
              const cost = HINT_COSTS[tier];
              return (
                <Pressable
                  key={tier}
                  style={styles.option}
                  onPress={() => onSelectTier(tier)}
                >
                  <Text style={styles.optionEmoji}>{emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{label}</Text>
                    <Text style={styles.optionDesc}>{description}</Text>
                  </View>
                  <View style={styles.costPill}>
                    <Text style={styles.costText}>−{cost}</Text>
                  </View>
                </Pressable>
              );
            })
          )}

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Shown after a hint is used — small result toast/callout
interface HintResultBannerProps {
  result: HintResult;
  categoryColour?: string;
  onDismiss: () => void;
}

export function HintResultBanner({ result, categoryColour, onDismiss }: HintResultBannerProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  let message = '';
  if (result.tier === 'warmcold') {
    const n = result.matchCount;
    message = n === 0
      ? 'None of your selected words are in the same group.'
      : n === 4
      ? 'All 4 selected words belong together!'
      : `${n} of your selected words belong in the same group.`;
  } else if (result.tier === 'wordreveal') {
    message = `"${result.word}" belongs in the ${result.colour} group.`;
  } else {
    message = `One group is: "${result.categoryName}"`;
  }

  return (
    <Pressable
      style={[styles.resultBanner, categoryColour ? { borderColor: categoryColour } : {}]}
      onPress={onDismiss}
    >
      <Text style={styles.resultText}>{message}</Text>
      <Text style={styles.resultDismiss}>Tap to dismiss</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.bgSurface,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 20, gap: 10,
    },
    header: { alignItems: 'center', paddingBottom: 6 },
    title: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    subtitle: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, marginTop: 2 },
    option: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.bgBase, borderRadius: 12, padding: 14,
    },
    optionDisabled: { opacity: 0.4 },
    optionEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
    optionText: { flex: 1, gap: 2 },
    optionLabel: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    optionLabelDisabled: { color: c.text3 },
    optionDesc: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    costPill: {
      backgroundColor: c.errorFlash + '22',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    costPillDisabled: { backgroundColor: c.border },
    costText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.errorFlash },
    costTextDisabled: { color: c.text3 },
    premiumBadge: {
      backgroundColor: c.yellow + '33', borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
    },
    premiumBadgeText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text1 },
    upgradeBox: {
      backgroundColor: c.bgBase, borderRadius: 12, padding: 16, gap: 10, alignItems: 'center',
    },
    upgradeTitle: { fontSize: 17, fontFamily: FONTS.extraBold, color: c.text1 },
    upgradeDesc: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    rewardBtn: {
      borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 20, paddingVertical: 11,
    },
    rewardBtnDisabled: { opacity: 0.5 },
    rewardBtnText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text1 },
    cancelBtn: {
      alignItems: 'center', padding: 14,
      borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
      marginTop: 4,
    },
    cancelText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
    // Result banner
    resultBanner: {
      backgroundColor: c.bgSurface,
      borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
      padding: 14, marginHorizontal: 16, marginBottom: 8,
      alignItems: 'center', gap: 4,
    },
    resultText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1, textAlign: 'center' },
    resultDismiss: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3 },
  });
}
