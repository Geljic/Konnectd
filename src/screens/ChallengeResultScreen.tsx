import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchChallenge, isMine, type Challenge } from '@/api/challenges';
import { CATEGORY_COLOURS, type CategoryColour, type ColorTheme } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'ChallengeResult'>;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function determineWinner(challenge: Challenge): 'challenger' | 'opponent' | 'tie' {
  // Score is the primary criterion; fall back to mistakes then time for legacy sessions
  const cs = challenge.challengerScore;
  const os = challenge.opponentScore;
  if (cs !== null && os !== null) {
    if (cs > os) return 'challenger';
    if (os > cs) return 'opponent';
    return 'tie';
  }
  const cm = challenge.challengerMistakes;
  const om = challenge.opponentMistakes ?? 0;
  const cd = challenge.challengerDuration;
  const od = challenge.opponentDuration ?? 0;
  if (cm < om) return 'challenger';
  if (om < cm) return 'opponent';
  if (cd < od) return 'challenger';
  if (od < cd) return 'opponent';
  return 'tie';
}

export function ChallengeResultScreen({ route, navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenge(challengeId).then(c => {
      setChallenge(c);
      setLoading(false);
    });
  }, [challengeId]);

  async function handleShare() {
    if (!challenge) return;
    const winner = determineWinner(challenge);
    const mine = isMine(challenge);
    const iWon = (mine && winner === 'challenger') || (!mine && winner === 'opponent');
    const fmtScore = (s: number | null) => s !== null ? ` · ${s} pts` : '';
    const text = [
      `⚡ KonnectD Challenge — ${challenge.puzzleLabel}`,
      '',
      mine
        ? `Me: ${formatTime(challenge.challengerDuration)}, ${challenge.challengerMistakes} mistakes${fmtScore(challenge.challengerScore)}`
        : `${challenge.challengerName}: ${formatTime(challenge.challengerDuration)}, ${challenge.challengerMistakes} mistakes${fmtScore(challenge.challengerScore)}`,
      mine
        ? `${challenge.opponentName}: ${formatTime(challenge.opponentDuration!)}, ${challenge.opponentMistakes} mistakes${fmtScore(challenge.opponentScore)}`
        : `Me: ${formatTime(challenge.opponentDuration!)}, ${challenge.opponentMistakes} mistakes${fmtScore(challenge.opponentScore)}`,
      '',
      winner === 'tie' ? "It's a tie! 🤝" : iWon ? 'I won! 🏆' : `${mine ? challenge.opponentName : challenge.challengerName} won! 🏆`,
      '',
      'Play at konnectd.xyz',
    ].join('\n');
    await Share.share({ message: text });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.text2} />
      </SafeAreaView>
    );
  }

  if (!challenge || challenge.status !== 'complete') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Still waiting…</Text>
          <Text style={styles.subtitle}>
            {challenge?.opponentName
              ? `${challenge.opponentName} hasn't finished yet.`
              : "Your opponent hasn't accepted yet."}
          </Text>
          <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnSecondaryText}>← Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const mine = isMine(challenge);
  const winner = determineWinner(challenge);
  const challengerIsWinner = winner === 'challenger';
  const opponentIsWinner = winner === 'opponent';
  const tie = winner === 'tie';
  const iWon = (mine && challengerIsWinner) || (!mine && opponentIsWinner);

  function EmojiGrid({ solvedOrder }: { solvedOrder: CategoryColour[] }) {
    return (
      <View style={styles.grid}>
        {solvedOrder.map((colour, i) => (
          <View key={i} style={styles.gridRow}>
            {[0,1,2,3].map(j => (
              <View key={j} style={[styles.gridTile, { backgroundColor: CATEGORY_COLOURS[colour] }]} />
            ))}
          </View>
        ))}
      </View>
    );
  }

  function ResultCard({ name, mistakes, duration, solvedOrder, isWinner, isYou, score }: {
    name: string; mistakes: number; duration: number;
    solvedOrder: CategoryColour[]; isWinner: boolean; isYou: boolean; score: number | null;
  }) {
    return (
      <View style={[styles.card, isWinner && styles.cardWinner]}>
        {isWinner && <Text style={styles.winnerBadge}>👑 Winner</Text>}
        <Text style={styles.cardName}>{isYou ? 'You' : name}</Text>
        {score !== null && <Text style={styles.cardScore}>⭐ {score} pts</Text>}
        <EmojiGrid solvedOrder={solvedOrder} />
        <Text style={styles.cardTime}>{formatTime(duration)}</Text>
        <Text style={styles.cardMistakes}>{mistakes} mistake{mistakes !== 1 ? 's' : ''}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{tie ? '🤝' : iWon ? '🏆' : '💪'}</Text>
          <Text style={styles.headerTitle}>
            {tie ? "It's a tie!" : iWon ? 'You won!' : `${mine ? challenge.opponentName : challenge.challengerName} won!`}
          </Text>
          <Text style={styles.headerSub}>{challenge.puzzleLabel}</Text>
        </View>

        <View style={styles.cards}>
          <ResultCard
            name={challenge.challengerName}
            mistakes={challenge.challengerMistakes}
            duration={challenge.challengerDuration}
            solvedOrder={challenge.challengerSolvedOrder}
            isWinner={challengerIsWinner}
            isYou={mine}
            score={challenge.challengerScore}
          />
          <View style={styles.vsLabel}><Text style={styles.vsText}>VS</Text></View>
          <ResultCard
            name={challenge.opponentName ?? 'Opponent'}
            mistakes={challenge.opponentMistakes ?? 0}
            duration={challenge.opponentDuration ?? 0}
            solvedOrder={challenge.opponentSolvedOrder ?? []}
            isWinner={opponentIsWinner}
            isYou={!mine}
            score={challenge.opponentScore}
          />
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.btnShare} onPress={handleShare}>
            <Text style={styles.btnShareText}>Share Result</Text>
          </Pressable>
          <Pressable style={styles.btnHome} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnHomeText}>← Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, justifyContent: 'space-between', padding: 20 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
    header: { alignItems: 'center', paddingTop: 8, gap: 4 },
    headerEmoji: { fontSize: 52 },
    headerTitle: { fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1 },
    headerSub: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3 },
    cards: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    card: { flex: 1, backgroundColor: c.bgSurface, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: 'transparent' },
    cardWinner: { borderColor: c.yellow },
    winnerBadge: { fontSize: 12, fontFamily: FONTS.extraBold, color: c.text2 },
    cardName: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text1 },
    cardScore: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.yellow },
    grid: { gap: 3 },
    gridRow: { flexDirection: 'row', gap: 3 },
    gridTile: { width: 16, height: 16, borderRadius: 4 },
    cardTime: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    cardMistakes: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    vsLabel: { width: 30, alignItems: 'center' },
    vsText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text3 },
    footer: { gap: 10 },
    btnShare: { backgroundColor: c.text1, borderRadius: 14, padding: 16, alignItems: 'center' },
    btnShareText: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.bgScreen },
    btnHome: { alignItems: 'center', paddingVertical: 8 },
    btnHomeText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
    emoji: { fontSize: 52 },
    title: { fontSize: 22, fontFamily: FONTS.extraBold, color: c.text1 },
    subtitle: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    btnSecondary: { borderWidth: 1.5, borderColor: c.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
    btnSecondaryText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
  });
}
