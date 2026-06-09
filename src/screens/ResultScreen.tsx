import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Share, Platform, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '@/store/gameStore';
import { fetchNextPuzzleId, ratePuzzle } from '@/api/puzzles';
import { CategoryReveal } from '@/components/CategoryReveal';
import { AdBanner } from '@/components/BannerAd';
import { FriendPickerModal } from '@/components/FriendPickerModal';
import { buildShareText, copyShareText } from '@/utils/shareGrid';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import type { AppStackParamList } from '../App';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width="15" height="15" viewBox="0 0 20 20">
      <Path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M7 18v-6h6v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Result'> };

export function ResultScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { puzzle, status, mistakes, solvedOrder, reset, currentMode, currentPuzzleId, currentCollection, startTime, firstSolve, score, hintsUsed, hintPenalty } = useGameStore();
  const user = useAuthStore(s => s.user);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [sentToHandle, setSentToHandle] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [rating, setRating] = useState<1 | -1 | null>(null);

  const won = status === 'won';
  const allCategories = puzzle?.categories ?? [];
  const canChallenge = won && firstSolve && currentMode !== 'nyt' && !!currentPuzzleId && !!currentCollection && !user?.isGuest;

  async function handleShare() {
    const text = buildShareText(undefined, solvedOrder, mistakes, won, score);
    if (Platform.OS === 'web') {
      if (navigator.share) {
        try { await navigator.share({ text }); return; } catch { /* fall through */ }
      }
      try { await navigator.clipboard.writeText(text); } catch { await copyShareText(text); }
    } else {
      try { await Share.share({ message: text }); return; } catch { await copyShareText(text); }
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  }

  async function handleRate(value: 1 | -1) {
    if (rating !== null || !puzzle) return;
    setRating(value);
    await ratePuzzle(puzzle.id, value);
  }

  async function handleNext() {
    reset();
    if (currentMode === 'nyt' && !currentPuzzleId) {
      navigation.navigate('Game', { mode: 'nyt' });
      return;
    }
    if (currentMode === 'freeplay' && currentPuzzleId && currentCollection) {
      const nextId = await fetchNextPuzzleId(currentPuzzleId, currentCollection);
      if (nextId) {
        navigation.navigate('Game', { mode: 'freeplay', puzzleId: nextId, collection: currentCollection });
        return;
      }
    }
    navigation.navigate('PuzzleSelect');
  }

  function handleHome() {
    reset();
    navigation.navigate('Home');
  }

  function handleChallenge() {
    setShowFriendPicker(true);
  }

  function handleChallengeSent(friendHandle: string) {
    setShowFriendPicker(false);
    setSentToHandle(friendHandle);
    setTimeout(() => setSentToHandle(null), 3500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FriendPickerModal
        visible={showFriendPicker}
        onClose={() => setShowFriendPicker(false)}
        onChallengeSent={handleChallengeSent}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{won ? '🎉' : '💀'}</Text>
          <Text style={styles.title}>{won ? 'Nicely done!' : 'Better luck next time'}</Text>
          {won && mistakes > 0 && (
            <Text style={styles.subtitle}>{mistakes} mistake{mistakes > 1 ? 's' : ''}</Text>
          )}
          {won && mistakes === 0 && (
            <Text style={styles.subtitle}>Perfect game!</Text>
          )}
          {won && score !== null && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>⭐ {score} pts</Text>
            </View>
          )}
          {won && hintsUsed > 0 && (
            <Text style={styles.hintNote}>
              💡 {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} used · −{hintPenalty} pts
            </Text>
          )}
        </View>

        <View style={styles.categories}>
          {allCategories.map((cat, i) => (
            <CategoryReveal key={cat.name} category={cat} index={i} showExplanation={!won} />
          ))}
        </View>

        {/* Puzzle rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>
            {rating === null ? 'How was this puzzle?' : rating === 1 ? 'Thanks for rating! 👍' : 'Thanks for the feedback! 👎'}
          </Text>
          {rating === null && (
            <View style={styles.ratingBtns}>
              <Pressable style={styles.ratingBtn} onPress={() => handleRate(1)}>
                <Text style={styles.ratingBtnText}>👍</Text>
              </Pressable>
              <Pressable style={styles.ratingBtn} onPress={() => handleRate(-1)}>
                <Text style={styles.ratingBtnText}>👎</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {canChallenge && (
            <Pressable style={styles.btnChallenge} onPress={handleChallenge}>
              <Text style={styles.btnChallengeText}>
                {sentToHandle ? `✓ Sent to ${sentToHandle}!` : '⚡ Challenge a Friend'}
              </Text>
            </Pressable>
          )}
          <View style={styles.buttons}>
            <Pressable style={styles.btnNext} onPress={handleNext}>
              <Text style={styles.btnNextText}>Next Puzzle</Text>
            </Pressable>
            <Pressable style={styles.btnShare} onPress={handleShare}>
              <Text style={styles.btnShareText}>{copiedShare ? '✓ Copied!' : 'Share'}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.btnHome} onPress={handleHome}>
            <HomeIcon color={colors.text2} />
            <Text style={styles.btnHomeText}>Home</Text>
          </Pressable>
          <AdBanner />
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, justifyContent: 'space-between', paddingVertical: 24 },
    header: { alignItems: 'center', gap: 8, paddingTop: 16 },
    emoji: { fontSize: 52 },
    title: { fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1 },
    subtitle: { fontSize: 16, fontFamily: FONTS.bold, color: c.text2 },
    scorePill: { backgroundColor: c.yellow, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
    scoreText: { fontSize: 18, fontFamily: FONTS.extraBold, color: '#162219' },
    hintNote: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, marginTop: 2 },
    categories: { paddingHorizontal: 8, gap: 4 },
    ratingRow: {
      alignItems: 'center', gap: 10,
      paddingVertical: 12, paddingHorizontal: 20,
    },
    ratingLabel: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
    ratingBtns: { flexDirection: 'row', gap: 16 },
    ratingBtn: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: c.bgBase, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },
    ratingBtnText: { fontSize: 24 },
    footer: { gap: 12 },
    buttons: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
    btnShare: { flex: 1, borderWidth: 1.5, borderColor: c.border, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnShareText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    btnNext: { flex: 1, backgroundColor: c.text1, borderRadius: 12, padding: 14, alignItems: 'center' },
    btnNextText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.bgScreen },
    btnHome: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: c.bgBase, borderRadius: 20,
      paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'center',
    },
    btnHomeText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
    btnChallenge: {
      backgroundColor: '#E8903A', borderRadius: 12, padding: 15,
      alignItems: 'center', marginHorizontal: 20, minHeight: 50, justifyContent: 'center',
    },
    btnChallengeText: { fontSize: 16, fontFamily: FONTS.extraBold, color: '#FFF' },
  });
}
