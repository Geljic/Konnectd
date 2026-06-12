import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchChallenge, subscribeToChallenge, isExpired, isMine, type Challenge } from '@/api/challenges';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'Challenge'>;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function ChallengeScreen({ route, navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenge(challengeId).then(c => {
      if (!c) setError('Challenge not found or you need to be logged in.');
      else setChallenge(c);
      setLoading(false);
    });
  }, [challengeId]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    subscribeToChallenge(challengeId, c => {
      if (!c) {
        setError('Challenge not found or you need to be logged in.');
        return;
      }
      setChallenge(c);
      if (c.status === 'complete' && isMine(c)) {
        navigation.replace('ChallengeResult', { challengeId });
      }
    }).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [challengeId, navigation]);

  // Poll every 5s while challenger is waiting for opponent to play
  useEffect(() => {
    if (!challenge || !isMine(challenge) || challenge.status === 'complete') return;
    const interval = setInterval(async () => {
      const updated = await fetchChallenge(challengeId);
      if (updated) {
        setChallenge(updated);
        if (updated.status === 'complete') {
          clearInterval(interval);
          navigation.replace('ChallengeResult', { challengeId });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [challenge?.status, challengeId]);

  function handlePlay() {
    if (!challenge) return;
    if (challenge.gameType === 'word_trails') {
      navigation.replace('NextStepsGame', {
        mode: 'freeplay',
        puzzleId: challenge.puzzleId,
        challengeId: challenge.id,
      });
      return;
    }
    if (challenge.gameType === 'crossed_signals') {
      navigation.replace('CrossedSignalsGame', {
        mode: 'freeplay',
        puzzleId: challenge.puzzleId,
        challengeId: challenge.id,
      });
      return;
    }
    navigation.replace('Game', {
      mode: 'freeplay',
      puzzleId: challenge.puzzleId,
      collection: challenge.puzzleCollection,
      challengeId: challenge.id,
    });
  }

  function handleViewResult() {
    navigation.replace('ChallengeResult', { challengeId });
  }

  function handleBack() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <ActivityIndicator style={{ flex: 1 }} color={colors.text2} />
      </SafeAreaView>
    );
  }

  if (error || !challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error || 'Something went wrong.'}</Text>
          <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnSecondaryText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const expired = isExpired(challenge);
  const mine = isMine(challenge);
  const alreadyComplete = challenge.status === 'complete';

  if (mine && alreadyComplete) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.title}>Challenge complete!</Text>
          <Text style={styles.subtitle}>{challenge.opponentName} has accepted your challenge.</Text>
          <Pressable style={styles.btnPrimary} onPress={handleViewResult}>
            <Text style={styles.btnPrimaryText}>See Results</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mine) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Waiting for opponent</Text>
          <Text style={styles.subtitle}>
            You challenged someone to{'\n'}
            <Text style={styles.puzzleLabel}>{challenge.puzzleLabel}</Text>
          </Text>
          <View style={styles.yourResult}>
            <Text style={styles.yourResultLabel}>Your result</Text>
            <Text style={styles.yourResultTime}>{formatTime(challenge.challengerDuration)}</Text>
            <Text style={styles.yourResultMistakes}>
              {challenge.challengerMistakes} mistake{challenge.challengerMistakes !== 1 ? 's' : ''}
            </Text>
          </View>
          {expired && <Text style={styles.expiredHint}>This challenge has expired.</Text>}
          <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnSecondaryText}>← Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.emoji}>⚡</Text>
        <Text style={styles.title}>{challenge.challengerName} challenged you!</Text>
        <Text style={styles.subtitle}>
          Can you beat them at{'\n'}
          <Text style={styles.puzzleLabel}>{challenge.puzzleLabel}</Text>?
        </Text>

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>Their result is hidden until you complete the puzzle.</Text>
        </View>

        {expired ? (
          <>
            <Text style={styles.expiredHint}>This challenge has expired (48 hour limit).</Text>
            <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.btnSecondaryText}>Go Home</Text>
            </Pressable>
          </>
        ) : alreadyComplete ? (
          <>
            <Text style={styles.expiredHint}>This challenge has already been accepted.</Text>
            <Pressable style={styles.btnSecondary} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.btnSecondaryText}>Go Home</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.btnPrimary} onPress={handlePlay}>
            <Text style={styles.btnPrimaryText}>⚡ Accept Challenge</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    backBtn: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 },
    backText: { fontSize: 24, color: c.text2, fontFamily: FONTS.bold },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
    emoji: { fontSize: 64 },
    title: { fontSize: 24, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    subtitle: { fontSize: 16, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center', lineHeight: 24 },
    puzzleLabel: { color: c.text1, fontFamily: FONTS.extraBold },
    hintBox: { backgroundColor: c.bgBase, borderRadius: 12, padding: 16, width: '100%' },
    hintText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    yourResult: { backgroundColor: c.bgSurface, borderRadius: 16, padding: 20, alignItems: 'center', gap: 4, width: '100%' },
    yourResultLabel: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3, letterSpacing: 1 },
    yourResultTime: { fontSize: 32, fontFamily: FONTS.extraBold, color: c.text1 },
    yourResultMistakes: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
    expiredHint: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3, textAlign: 'center' },
    errorEmoji: { fontSize: 48 },
    errorText: { fontSize: 16, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    btnPrimary: { backgroundColor: c.green, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
    btnPrimaryText: { fontSize: 17, fontFamily: FONTS.extraBold, color: '#162219' },
    btnSecondary: { borderWidth: 1.5, borderColor: c.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
    btnSecondaryText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
  });
}
