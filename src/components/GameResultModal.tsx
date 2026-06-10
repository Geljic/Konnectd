import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import {
  getPuzzleResult, getRemotePuzzleResult, getUserRatingForPuzzle, ratePuzzle,
  fetchPuzzleById, fetchNytPuzzleById,
  type PuzzleResult, type Puzzle,
} from '@/api/puzzles';
import { CategoryReveal } from '@/components/CategoryReveal';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { Ruleset } from '@/constants/gameModes';
import { createReport } from '@/api/safety';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export interface GameResultModalProps {
  visible: boolean;
  label: string;
  date?: string | null;
  preloadedResult?: { durationSeconds: number; mistakes: number } | null;
  puzzleId?: string | null;
  collection?: 'puzzles' | 'nyt_puzzles';
  score?: number | null;
  gameMode?: Ruleset | null;
  onClose: () => void;
  onPlayAgain?: () => void;
  onViewBoard?: () => void;
}

export function GameResultModal({
  visible, label, date, preloadedResult, puzzleId, collection = 'puzzles',
  score, gameMode, onClose, onPlayAgain, onViewBoard,
}: GameResultModalProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [fetchedResult, setFetchedResult] = useState<PuzzleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullPuzzle, setFullPuzzle] = useState<Puzzle | null>(null);
  const [userRating, setUserRating] = useState<1 | -1 | null>(null);

  useEffect(() => {
    if (!visible || !puzzleId) {
      setFetchedResult(null);
      setFullPuzzle(null);
      setUserRating(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      const [local, rating, puzzle] = await Promise.all([
        preloadedResult ? Promise.resolve(null) : getPuzzleResult(puzzleId),
        getUserRatingForPuzzle(puzzleId),
        collection === 'nyt_puzzles' ? fetchNytPuzzleById(puzzleId) : fetchPuzzleById(puzzleId),
      ]);
      if (cancelled) return;
      if (!preloadedResult) {
        setFetchedResult(local ?? (await getRemotePuzzleResult(puzzleId)));
      }
      if (cancelled) return;
      setUserRating(rating);
      setFullPuzzle(puzzle);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [visible, puzzleId, collection, preloadedResult]);

  async function handleRate(value: 1 | -1) {
    if (!puzzleId) return;
    const prev = userRating;
    setUserRating(value);
    await ratePuzzle(puzzleId, value, collection);
    if (prev === value) return; // no change — nothing more to do
  }

  function handleReportPuzzle() {
    if (!puzzleId) return;
    Alert.alert(
      'Report Puzzle',
      'Send this puzzle to us for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async () => {
            const ok = await createReport({
              targetType: 'puzzle',
              targetId: puzzleId,
              reason: 'Puzzle issue',
              details: `${label} (${collection})`,
            });
            Alert.alert(ok ? 'Report sent' : 'Report failed', ok
              ? 'Thanks. We will review this puzzle.'
              : 'Please try again in a moment.');
          },
        },
      ],
    );
  }

  const result = preloadedResult ?? fetchedResult;
  const mistakes = result?.mistakes ?? 0;
  const categories = fullPuzzle?.categories ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.pillRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>✓ Completed</Text>
                </View>
                {gameMode === 'hard' && (
                  <View style={styles.hardPill}>
                    <Text style={styles.hardPillText}>🔥 Hard Mode</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{label}</Text>
              {date ? <Text style={styles.date}>{date}</Text> : null}
            </View>

            {/* Stats + categories */}
            {loading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={colors.text2} />
            ) : (
              <>
                {result ? (
                  <>
                    <View style={styles.statsRow}>
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{formatTime(result.durationSeconds)}</Text>
                        <Text style={styles.statLabel}>Time</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{mistakes}</Text>
                        <Text style={styles.statLabel}>Mistake{mistakes !== 1 ? 's' : ''}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.statBox}>
                        <Text style={styles.statValue}>{mistakes === 0 ? '🌟' : mistakes <= 1 ? '👏' : '💪'}</Text>
                        <Text style={styles.statLabel}>{mistakes === 0 ? 'Perfect!' : mistakes <= 1 ? 'Great' : 'Good try'}</Text>
                      </View>
                    </View>
                    {score != null && (
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreValue}>⭐ {score}</Text>
                        <Text style={styles.scoreLabel}>Score</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.noData}>No result data found.</Text>
                )}

                {/* Category review */}
                {categories.length > 0 && (
                  <View style={styles.categoriesSection}>
                    <Text style={styles.categoriesHeading}>The Groups</Text>
                    {categories.map((cat, i) => (
                      <CategoryReveal key={cat.name} category={cat} index={i} showExplanation />
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>
                {userRating === null
                  ? 'How was this puzzle?'
                  : userRating === 1 ? 'Thanks for rating! 👍' : 'Thanks for the feedback! 👎'}
              </Text>
              <View style={styles.ratingBtns}>
                <Pressable
                  style={[styles.ratingBtn, userRating === 1 && styles.ratingBtnActive]}
                  onPress={() => handleRate(1)}
                >
                  <Text style={styles.ratingBtnText}>👍</Text>
                </Pressable>
                <Pressable
                  style={[styles.ratingBtn, userRating === -1 && styles.ratingBtnActive]}
                  onPress={() => handleRate(-1)}
                >
                  <Text style={styles.ratingBtnText}>👎</Text>
                </Pressable>
              </View>
            </View>

            {puzzleId && (
              <Pressable style={styles.reportBtn} onPress={handleReportPuzzle}>
                <Text style={styles.reportBtnText}>Report puzzle issue</Text>
              </Pressable>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </Pressable>
              {onViewBoard && (
                <Pressable style={styles.btnSecondary} onPress={onViewBoard}>
                  <Text style={styles.btnSecondaryText}>View Board</Text>
                </Pressable>
              )}
              {onPlayAgain && (
                <Pressable style={styles.btnPrimary} onPress={onPlayAgain}>
                  <Text style={styles.btnPrimaryText}>Play Again</Text>
                </Pressable>
              )}
            </View>

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    card: { backgroundColor: c.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    scrollContent: { padding: 28, gap: 20 },
    header: { alignItems: 'center', gap: 8 },
    pillRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    pill: { backgroundColor: c.green, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
    pillText: { fontSize: 14, fontFamily: FONTS.extraBold, color: '#162219' },
    hardPill: { backgroundColor: c.purple, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    hardPillText: { fontSize: 12, fontFamily: FONTS.bold, color: '#FFF' },
    title: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    date: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3 },
    noData: { textAlign: 'center', color: c.text3, fontFamily: FONTS.bold, paddingVertical: 12 },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    statBox: { alignItems: 'center', gap: 4, flex: 1 },
    statValue: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1 },
    statLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    divider: { width: 1, height: 40, backgroundColor: c.border },
    scoreBox: { alignItems: 'center', backgroundColor: c.bgBase, borderRadius: 12, paddingVertical: 14, gap: 4 },
    scoreValue: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1 },
    scoreLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    categoriesSection: { gap: 0 },
    categoriesHeading: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text2, letterSpacing: 0.8, textAlign: 'center', marginBottom: 4 },
    ratingRow: { alignItems: 'center', gap: 10, paddingVertical: 4 },
    ratingLabel: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
    ratingBtns: { flexDirection: 'row', gap: 16 },
    ratingBtn: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: c.bgBase, borderWidth: 1.5, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    ratingBtnActive: { borderColor: c.green, backgroundColor: c.green + '33' },
    ratingBtnText: { fontSize: 24 },
    reportBtn: { alignItems: 'center', paddingVertical: 2 },
    reportBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, textDecorationLine: 'underline' },
    actions: { flexDirection: 'row', gap: 10 },
    btnSecondary: { flex: 1, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnSecondaryText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    btnPrimary: { flex: 1, backgroundColor: c.green, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnPrimaryText: { fontSize: 15, fontFamily: FONTS.extraBold, color: '#162219' },
  });
}
