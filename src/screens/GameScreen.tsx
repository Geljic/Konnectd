import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGameStore, type HintTier, type HintResult } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { fetchDailyPuzzle, fetchPuzzleById, fetchNytPuzzleById, fetchRandomNytPuzzle, recordPlaySession, updateUserStats, markPuzzleCompleted, saveGameProgress, loadGameProgress, clearGameProgress, getCompletedPuzzleIds } from '@/api/puzzles';
import { submitChallengeResult, createChallenge } from '@/api/challenges';
import { calculateScore } from '@/utils/scoring';
import { GameBoard } from '@/components/GameBoard';
import { MistakeDots } from '@/components/MistakeDots';
import { OneAwayToast } from '@/components/OneAwayToast';
import { Confetti } from '@/components/Confetti';
import { ShuffleIcon, DeselectIcon, CheckIcon } from '@/components/GameIcons';
import { HelpModal } from '@/components/HelpModal';
import { HintModal, HintResultBanner } from '@/components/HintModal';
import { useSound } from '@/hooks/useSound';
import { FONTS } from '@/constants/fonts';
import { MAX_HINTS } from '@/constants/config';
import { showRewardedHintAd } from '@/api/rewardedAds';
import { useMonetisationStore } from '@/store/monetisationStore';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'Game'>;

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Path d="M11 4 L5 9 L11 14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Circle cx="9" cy="9" r="8" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="9" y1="8" x2="9" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="5.5" r="1.2" fill={color} />
    </Svg>
  );
}

function FireIcon({ color }: { color: string }) {
  return (
    <Svg width="14" height="14" viewBox="0 0 20 20">
      <Path
        d="M10 2 C10 2 13 6 13 9 C13 9 15 7 14 5 C14 5 18 8 18 13 C18 17.4 14.4 20 10 20 C5.6 20 2 17.4 2 13 C2 9 5 6 5 6 C5 8 7 9 7 9 C7 6.5 10 2 10 2Z"
        fill={color}
      />
    </Svg>
  );
}

function difficultyLabel(difficulty?: string) {
  if (difficulty === 'yellow') return 'Easy';
  if (difficulty === 'green') return 'Medium';
  if (difficulty === 'blue') return 'Hard';
  if (difficulty === 'purple') return 'Expert';
  return 'Puzzle';
}

export function GameScreen({ route, navigation }: Props) {
  const { mode, puzzleId, collection, challengeId, recipientId, recipientName } = route.params;
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const compact = width <= 480 || height <= 760;
  const tight = width <= 390 || height <= 700;
  const styles = useMemo(() => makeStyles(colors, compact, tight), [colors, compact, tight]);

  const [loading, setLoading] = useState(true);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const [shuffleSignal, setShuffleSignal] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [helpVisible, setHelpVisible] = useState(false);
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [hintResult, setHintResult] = useState<HintResult | null>(null);
  const [rewardedAdLoading, setRewardedAdLoading] = useState(false);

  const hardMode = useSettingsStore(s => s.hardMode);
  const accountPremium = useAuthStore(s => s.user?.isPremium ?? false);
  const supporter = useMonetisationStore(s => s.isSupporter());
  const isPremium = accountPremium || supporter;

  const {
    loadPuzzle, restoreProgress, submitGuess, commitSolve, shuffleBoard, clearSelection, dismissToast, setScore,
    useHint, grantRewardedHintToken,
    status, mistakes, toastMessage, puzzle, selectedWords, startTime, currentMode, currentPuzzleId,
    solvedCategories, currentCollection, hintsUsed, hintPenalty, rewardedHintTokens,
  } = useGameStore();
  const { play, playCorrect } = useSound();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const s = useGameStore.getState();
      const resuming =
        !recipientId &&
        !challengeId &&
        mode !== 'nyt' &&
        s.status === 'playing' &&
        s.currentMode === mode &&
        (mode !== 'freeplay' || s.currentPuzzleId === puzzleId);
      if (resuming) {
        if (!cancelled) setLoading(false);
        return;
      }
      const p = mode === 'daily'
        ? await fetchDailyPuzzle()
        : mode === 'nyt' && !puzzleId
        ? await fetchRandomNytPuzzle()
        : collection === 'nyt_puzzles'
        ? await fetchNytPuzzleById(puzzleId!)
        : await fetchPuzzleById(puzzleId!);
      if (cancelled) return;
      if (!p) {
        console.error(`[GameScreen] fetchPuzzle returned null for mode=${mode}`);
        navigation.goBack();
        return;
      }
      const coll = collection ?? (mode === 'nyt' ? 'nyt_puzzles' : undefined);
      const completedIds = await getCompletedPuzzleIds();
      if (cancelled) return;
      const firstSolve = !completedIds.has(p.id);
      loadPuzzle(p, mode, puzzleId, hardMode ? 'hard' : 'normal', coll as 'puzzles' | 'nyt_puzzles' | undefined, firstSolve);

      if (mode === 'freeplay' && puzzleId) {
        const saved = await loadGameProgress(puzzleId);
        if (saved && saved.solvedCategoryNames.length > 0) {
          const solvedCats = p.categories.filter(c => saved.solvedCategoryNames.includes(c.name));
          restoreProgress(solvedCats, saved.mistakes, saved.elapsedSeconds * 1000);
        }
      }

      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [mode, puzzleId, collection, challengeId, recipientId, hardMode, loadPuzzle, restoreProgress, navigation]);

  useEffect(() => {
    if (status !== 'playing' || mode !== 'freeplay' || !puzzleId || !collection) return;
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    saveGameProgress({
      puzzleId,
      collection: collection as 'puzzles' | 'nyt_puzzles',
      solvedCategoryNames: solvedCategories.map(c => c.name),
      mistakes,
      elapsedSeconds: elapsed,
    });
  }, [solvedCategories.length, mistakes]);

  function handleLeave() {
    navigation.goBack();
  }

  useEffect(() => {
    if (status !== 'playing' || !startTime) return;
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status, startTime]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    if (status !== 'won' && status !== 'lost') return;

    const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const solvedOrder = useGameStore.getState().solvedOrder;
    const gameMode = useGameStore.getState().gameMode;
    const hintPenaltyFinal = useGameStore.getState().hintPenalty;
    const score = status === 'won' ? calculateScore(solvedOrder, mistakes, duration, hintPenaltyFinal) : null;
    setScore(score);

    if (puzzle) {
      // Sequence: record session first so updateUserStats sees the new row
      (async () => {
        await recordPlaySession({
          puzzleId: puzzle.id,
          collection: currentCollection ?? 'puzzles',
          completed: status === 'won',
          mistakes,
          durationSeconds: duration,
          solvedOrder,
          gameMode,
          gameType: 'connections',
          score: score ?? undefined,
        });
        await updateUserStats(status === 'won');
        await useAuthStore.getState().refreshProfile();
      })();

      if (status === 'won') {
        markPuzzleCompleted(puzzle.id, { durationSeconds: duration, mistakes, solvedOrder });
      }
      clearGameProgress();

      if (challengeId) {
        submitChallengeResult(challengeId, { mistakes, durationSeconds: duration, solvedOrder, score: score ?? undefined });
      }
    }

    const delay = status === 'won' ? 1500 : 800;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (recipientId && puzzle && !challengeId) {
      let cancelled = false;
      const nytDate = puzzle.daily_date
        ? new Date(puzzle.daily_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;
      const puzzleLabel = currentCollection === 'nyt_puzzles'
        ? `NYT Puzzle${nytDate ? ` · ${nytDate}` : ''}`
        : nytDate
        ? `Daily Puzzle · ${nytDate}`
        : 'Curated Puzzle';
      createChallenge({
        puzzleId: puzzle.id,
        puzzleCollection: currentCollection ?? 'puzzles',
        puzzleLabel,
        mistakes,
        durationSeconds: duration,
        solvedOrder,
        score: score ?? undefined,
        gameType: 'connections',
        gameMode,
        recipientId,
      }).then(challenge => {
        if (cancelled) return;
        timeoutId = setTimeout(() => {
          if (!navigation.isFocused()) return;
          if (challenge) navigation.navigate('ChallengeResult', { challengeId: challenge.id });
          else navigation.navigate('Result');
        }, delay);
      });
      return () => { cancelled = true; clearTimeout(timeoutId); };
    }

    timeoutId = setTimeout(() => {
      if (!navigation.isFocused()) return;
      if (challengeId) {
        navigation.navigate('ChallengeResult', { challengeId });
      } else {
        navigation.navigate('Result');
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [status]);

  function handleHintSelect(tier: HintTier) {
    setHintModalVisible(false);
    const result = useHint(tier, isPremium);
    if (result) setHintResult(result);
  }

  async function handleRewardedHintAd() {
    if (rewardedAdLoading) return;
    setRewardedAdLoading(true);
    try {
      const earnedReward = await showRewardedHintAd();
      if (earnedReward) {
        grantRewardedHintToken();
        Alert.alert('Hint unlocked', 'You earned one extra hint for this puzzle.');
      } else {
        Alert.alert('Ad unavailable', 'No rewarded ad was available. Please try again soon.');
      }
    } catch {
      Alert.alert('Ad unavailable', 'No rewarded ad was available. Please try again soon.');
    } finally {
      setRewardedAdLoading(false);
    }
  }

  function handleShuffle() {
    setShuffleSignal(s => s + 1);
    setTimeout(shuffleBoard, 160);
  }

  function handleSubmit() {
    if (selectedWords.length !== 4) return;
    const result = submitGuess();
    if (result.result === 'correct') {
      playCorrect(result.category!.colour);
      setTimeout(commitSolve, 480);
    } else {
      play('wrong');
      setShakeWords([...selectedWords]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loader} color={colors.text2} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftCluster}>
            <Pressable style={styles.iconBtn} onPress={handleLeave} hitSlop={12}>
              <BackIcon color={colors.text1} />
            </Pressable>
            <Text style={styles.modeLabel}>Groups</Text>
          </View>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {puzzle?.title ?? 'Konnectd'}
              </Text>
              {hardMode && (
                <View style={styles.hardBadge}>
                  <FireIcon color={colors.purple} />
                </View>
              )}
            </View>
            <Text
              style={styles.subtitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {hardMode ? `${difficultyLabel(puzzle?.difficulty_min)} · Hard mode` : difficultyLabel(puzzle?.difficulty_min)}
            </Text>
          </View>

          <View style={styles.rightCluster}>
            <Pressable
              style={styles.headerHintBtn}
              onPress={() => setHintModalVisible(true)}
              disabled={status !== 'playing'}
            >
              <Text style={styles.headerHintText}>💡 Hint</Text>
            </Pressable>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </View>
            <Pressable style={styles.iconBtn} onPress={() => setHelpVisible(true)} hitSlop={12}>
              <InfoIcon color={colors.text2} />
            </Pressable>
          </View>
        </View>

        <GameBoard
          shakeWords={shakeWords}
          onShakeDone={() => setShakeWords([])}
          shuffleSignal={shuffleSignal}
        />

        <View style={styles.footer}>
          <MistakeDots mistakes={mistakes} />
          {hintResult && (
            <HintResultBanner
              result={hintResult}
              categoryColour={hintResult.tier === 'wordreveal' ? colors[hintResult.colour] : undefined}
              onDismiss={() => setHintResult(null)}
            />
          )}
          <View style={styles.actions}>
            <Pressable style={styles.btnSecondary} onPress={handleShuffle}>
              <ShuffleIcon color={colors.text1} />
              <Text style={styles.btnSecondaryText}>Shuffle</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={clearSelection}>
              <DeselectIcon color={colors.text1} />
              <Text style={styles.btnSecondaryText}>Deselect</Text>
            </Pressable>
            <Pressable
              style={[styles.btnSubmit, selectedWords.length !== 4 && styles.btnSubmitDisabled]}
              onPress={handleSubmit}
              disabled={selectedWords.length !== 4}
            >
              <CheckIcon color={colors.actionText} />
              <Text style={styles.btnSubmitText}>Submit</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <OneAwayToast
        visible={toastMessage !== null}
        onDismiss={dismissToast}
        message={toastMessage ?? ''}
      />
      <Confetti active={status === 'won'} />
      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
      <HintModal
        visible={hintModalVisible}
        hintsUsed={hintsUsed}
        hintPenalty={hintPenalty}
        rewardedHintTokens={rewardedHintTokens}
        isPremium={isPremium}
        onSelectTier={handleHintSelect}
        onClose={() => setHintModalVisible(false)}
        onWatchRewardedAd={supporter ? undefined : handleRewardedHintAd}
        rewardedAdLoading={rewardedAdLoading}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme, compact: boolean, tight: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, paddingVertical: 12 },
    loader: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 8, paddingHorizontal: 12, gap: 8,
      position: 'relative',
    },
    leftCluster: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1 },
    modeLabel: { fontSize: tight ? 9 : compact ? 10 : 11, fontFamily: FONTS.extraBold, color: c.blue, letterSpacing: 1.2, textTransform: 'uppercase' },
    headerCenter: {
      position: 'absolute',
      left: tight ? 112 : compact ? 124 : 132,
      right: tight ? 120 : compact ? 132 : 140,
      alignItems: 'center',
      gap: 3,
      zIndex: 0,
    },
    titleRow: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { maxWidth: '100%', flexShrink: 1, fontSize: tight ? 18 : compact ? 20 : 24, fontFamily: FONTS.extraBold, color: c.text1, letterSpacing: 0 },
    hardBadge: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: c.bgBase, alignItems: 'center', justifyContent: 'center',
    },
    subtitle: { width: '100%', maxWidth: '100%', fontSize: compact ? 11 : 13, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    rightCluster: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: tight ? 1 : compact ? 2 : 4, zIndex: 1 },
    headerHintBtn: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 18,
      paddingHorizontal: tight ? 6 : compact ? 8 : 10,
      paddingVertical: compact ? 5 : 6,
    },
    headerHintText: { fontSize: tight ? 10 : compact ? 11 : 12, fontFamily: FONTS.bold, color: c.text2 },
    timerBadge: { alignItems: 'flex-end', minWidth: tight ? 32 : 36 },
    timerText: { fontSize: compact ? 11 : 13, fontFamily: FONTS.bold, color: c.text2 },
    footer: { paddingHorizontal: 16, paddingVertical: 10, gap: 10, zIndex: 10, elevation: 10 },
    actions: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
    btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: c.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
    btnSecondaryText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text1 },
    btnSubmit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.actionBg, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 10 },
    btnSubmitDisabled: { backgroundColor: c.text3 },
    btnSubmitText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.actionText },
  });
}
