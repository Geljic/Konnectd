import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { getSolvedBoard } from '@/utils/crossedSignals';
import type { CrossedSignalsPuzzle } from '@/data/crossedSignalsPuzzles';
import { getUserRatingForPuzzle, ratePuzzle } from '@/api/puzzles';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function lineColour(c: ColorTheme, index: number) {
  return [c.yellow, c.green, c.blue, c.purple][index % 4];
}

export interface CrossedSignalsResultModalProps {
  visible: boolean;
  status: 'won' | 'lost';
  puzzle: CrossedSignalsPuzzle;
  board: string[];
  noise: number;
  scansUsed: number;
  durationSeconds: number;
  score: number | null;
  onClose: () => void;
  onPlayAgain?: () => void;
  onShare?: () => void;
}

export function CrossedSignalsResultModal({
  visible, status, puzzle, board, noise, scansUsed, durationSeconds, score,
  onClose, onPlayAgain, onShare,
}: CrossedSignalsResultModalProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const solved = useMemo(() => getSolvedBoard(puzzle), [puzzle]);
  const [userRating, setUserRating] = useState<1 | -1 | null>(null);
  const won = status === 'won';
  const correctCount = solved.filter((word, i) => board[i] === word).length;
  const perfect = won && noise === 0 && scansUsed === 0;

  useEffect(() => {
    if (!visible) {
      setUserRating(null);
      return;
    }
    let cancelled = false;
    getUserRatingForPuzzle(puzzle.id, 'crossed_signals')
      .then(rating => {
        if (!cancelled) setUserRating(rating);
      })
      .catch(() => {
        if (!cancelled) setUserRating(null);
      });
    return () => { cancelled = true; };
  }, [puzzle.id, visible]);

  async function handleRate(value: 1 | -1) {
    setUserRating(value);
    await ratePuzzle(puzzle.id, value, 'puzzles', 'crossed_signals');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <View style={styles.header}>
              <View style={[styles.pill, won ? styles.pillWon : styles.pillLost]}>
                <Text style={[styles.pillText, !won && styles.pillTextLost]}>
                  {won ? '✓ Signal decoded' : '✕ Signal collapsed'}
                </Text>
              </View>
              <Text style={styles.title}>Crossed Signals · {puzzle.title}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatTime(durationSeconds)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{noise}</Text>
                <Text style={styles.statLabel}>Noise</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{scansUsed}</Text>
                <Text style={styles.statLabel}>Scan{scansUsed !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{won ? (perfect ? '🌟' : '👏') : `${correctCount}/16`}</Text>
                <Text style={styles.statLabel}>{won ? (perfect ? 'Perfect!' : 'Solved') : 'Correct'}</Text>
              </View>
            </View>

            {score != null && (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreValue}>⭐ {score}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            )}

            <View style={styles.solutionSection}>
              <Text style={styles.solutionHeading}>The Solution</Text>
              <View style={styles.grid}>
                <View style={styles.gridRow}>
                  <View style={styles.corner} />
                  {puzzle.columns.map((col, ci) => (
                    <View key={col.id} style={[styles.colHead, { backgroundColor: lineColour(colors, ci) + '22' }]}>
                      <Text style={styles.colHeadText} numberOfLines={2}>{col.label}</Text>
                    </View>
                  ))}
                </View>
                {puzzle.rows.map((row, ri) => (
                  <View key={row.id} style={styles.gridRow}>
                    <View style={[styles.rowHead, { backgroundColor: lineColour(colors, ri) + '22' }]}>
                      <Text style={styles.rowHeadText} numberOfLines={3}>{row.label}</Text>
                    </View>
                    {puzzle.columns.map((col, ci) => {
                      const index = ri * 4 + ci;
                      const wasRight = board[index] === solved[index];
                      return (
                        <View
                          key={col.id}
                          style={[styles.cell, wasRight ? styles.cellRight : styles.cellWrong]}
                        >
                          <Text style={styles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                            {solved[index]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
                  <Text style={styles.legendText}>You placed correctly</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.errorFlash }]} />
                  <Text style={styles.legendText}>Was misplaced</Text>
                </View>
              </View>
            </View>

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

            <View style={styles.actions}>
              <Pressable style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </Pressable>
              {onShare && (
                <Pressable style={styles.btnSecondary} onPress={onShare}>
                  <Text style={styles.btnSecondaryText}>Share</Text>
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
    pill: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
    pillWon: { backgroundColor: c.green },
    pillLost: { backgroundColor: c.errorFlash },
    pillText: { fontSize: 14, fontFamily: FONTS.extraBold, color: '#162219' },
    pillTextLost: { color: '#FFFFFF' },
    title: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    statBox: { alignItems: 'center', gap: 4, flex: 1 },
    statValue: { fontSize: 24, fontFamily: FONTS.extraBold, color: c.text1 },
    statLabel: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    divider: { width: 1, height: 40, backgroundColor: c.border },
    scoreBox: { alignItems: 'center', backgroundColor: c.bgBase, borderRadius: 12, paddingVertical: 14, gap: 4 },
    scoreValue: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1 },
    scoreLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    solutionSection: { gap: 10 },
    solutionHeading: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text2, letterSpacing: 0.8, textAlign: 'center' },
    grid: { gap: 4 },
    gridRow: { flexDirection: 'row', gap: 4 },
    corner: { width: 64 },
    colHead: { flex: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 2 },
    colHeadText: { fontSize: 8.5, fontFamily: FONTS.extraBold, color: c.text2, textAlign: 'center' },
    rowHead: { width: 64, borderRadius: 6, justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 4 },
    rowHeadText: { fontSize: 8.5, fontFamily: FONTS.extraBold, color: c.text2 },
    cell: { flex: 1, minHeight: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1.5 },
    cellRight: { backgroundColor: c.green + '1A', borderColor: c.green },
    cellWrong: { backgroundColor: c.errorFlash + '14', borderColor: c.errorFlash + '55' },
    cellText: { fontSize: 9.5, fontFamily: FONTS.extraBold, color: c.text1 },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 2 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3 },
    ratingRow: { alignItems: 'center', gap: 10, paddingVertical: 4 },
    ratingLabel: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    ratingBtns: { flexDirection: 'row', gap: 16 },
    ratingBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.bgBase,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingBtnActive: { borderColor: c.green, backgroundColor: c.green + '33' },
    ratingBtnText: { fontSize: 24 },
    actions: { flexDirection: 'row', gap: 10 },
    btnSecondary: { flex: 1, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnSecondaryText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    btnPrimary: { flex: 1, backgroundColor: c.green, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnPrimaryText: { fontSize: 15, fontFamily: FONTS.extraBold, color: '#162219' },
  });
}
