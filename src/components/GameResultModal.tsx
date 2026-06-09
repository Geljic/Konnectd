import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { getPuzzleResult, getRemotePuzzleResult, type PuzzleResult } from '@/api/puzzles';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

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
  score?: number | null;
  gameMode?: 'normal' | 'hard' | null;
  onClose: () => void;
  onPlayAgain?: () => void;
}

export function GameResultModal({ visible, label, date, preloadedResult, puzzleId, score, gameMode, onClose, onPlayAgain }: GameResultModalProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [fetchedResult, setFetchedResult] = useState<PuzzleResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || preloadedResult || !puzzleId) return;
    setLoading(true);
    const load = async () => {
      const local = await getPuzzleResult(puzzleId);
      setFetchedResult(local ?? (await getRemotePuzzleResult(puzzleId)));
      setLoading(false);
    };
    load();
  }, [visible, puzzleId]);

  const result = preloadedResult ?? fetchedResult;
  const mistakes = result?.mistakes ?? 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
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

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 24 }} color={colors.text2} />
          ) : result ? (
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

          <View style={styles.actions}>
            <Pressable style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Close</Text>
            </Pressable>
            {onPlayAgain && (
              <Pressable style={styles.btnPrimary} onPress={onPlayAgain}>
                <Text style={styles.btnPrimaryText}>Play Again</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    card: { backgroundColor: c.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, gap: 20 },
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
    actions: { flexDirection: 'row', gap: 10 },
    btnSecondary: { flex: 1, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnSecondaryText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    btnPrimary: { flex: 1, backgroundColor: c.text1, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnPrimaryText: { fontSize: 15, fontFamily: FONTS.extraBold, color: '#FFF' },
  });
}
