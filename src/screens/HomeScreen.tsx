import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useGuestGuard } from '@/hooks/useGuestGuard';
import { KonnectLogo } from '@/components/KonnectLogo';
import { AdBanner } from '@/components/BannerAd';
import { GameResultModal } from '@/components/GameResultModal';
import { fetchMyChallenges, subscribeToChallengeChanges, isMine } from '@/api/challenges';
import { fetchDailyPuzzle, getCompletedPuzzleIds } from '@/api/puzzles';
import { getWordTrails } from '@/api/wordTrails';
import { getDailyWordTrailsPuzzle, getWordTrailsResult } from '@/utils/wordTrails';
import {
  getCrossedSignalsResult,
  getDailyCrossedSignalsPuzzle,
  getCrossedSignalsPuzzles,
} from '@/utils/crossedSignals';
import type { AppStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Home'> };
type HomeGameType = 'connections' | 'word_trails' | 'crossed_signals';
type CompletedDailyModal = {
  label: string;
  puzzleId?: string;
  preloadedResult?: { durationSeconds: number; mistakes: number };
  score?: number | null;
};

function BarChartIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Path d="M1 13 L1 8 L4 8 L4 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M6 13 L6 5 L9 5 L9 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M11 13 L11 2 L14 2 L14 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Line x1="0.5" y1="13.5" x2="15.5" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M8 1.5 L8 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M8 13 L8 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M1.5 8 L3 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M13 8 L14.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M3.5 3.5 L4.6 4.6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M11.4 11.4 L12.5 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M12.5 3.5 L11.4 4.6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M4.6 11.4 L3.5 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M2 14 C2 11 4.7 9 8 9 C11.3 9 14 11 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="6" cy="5" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M1 14 C1 11.2 3.2 9 6 9 C8.8 9 11 11.2 11 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Circle cx="11.5" cy="4.5" r="2" stroke={color} strokeWidth="1.3" fill="none"/>
      <Path d="M13 9 C14.7 9.5 15.5 11 15.5 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

function CrossedSignalsIcon({ colors, active }: { colors: ColorTheme; active: boolean }) {
  const rail = active ? colors.bgScreen : colors.text3;
  const center = active ? colors.bgScreen : colors.purple;
  return (
    <Svg width="48" height="48" viewBox="0 0 48 48">
      <Line x1="12" y1="24" x2="36" y2="24" stroke={rail} strokeWidth="3" strokeLinecap="round" opacity={0.7} />
      <Line x1="24" y1="12" x2="24" y2="36" stroke={rail} strokeWidth="3" strokeLinecap="round" opacity={0.7} />
      <Path d="M12 12 H20 V20 H12 Z" fill={colors.yellow} />
      <Path d="M28 12 H36 V20 H28 Z" fill={colors.green} />
      <Path d="M12 28 H20 V36 H12 Z" fill={colors.blue} />
      <Path d="M28 28 H36 V36 H28 Z" fill={colors.purple} />
      <Circle cx="24" cy="24" r="4.5" fill={center} />
      <Circle cx="24" cy="24" r="2" fill={active ? colors.purple : colors.bgScreen} opacity={0.9} />
    </Svg>
  );
}

export function HomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore(s => s.user);
  const { isGuest, guardAction } = useGuestGuard();
  const [openChallengeCount, setOpenChallengeCount] = useState(0);
  const [selectedGame, setSelectedGame] = useState<HomeGameType>('connections');
  const [dailyDone, setDailyDone] = useState<Record<HomeGameType, boolean>>({ connections: false, word_trails: false, crossed_signals: false });
  const [completedDaily, setCompletedDaily] = useState<CompletedDailyModal | null>(null);
  const actionAnim = useRef(new Animated.Value(1)).current;

  const refreshOpenChallengeCount = useCallback(() => {
    fetchMyChallenges().then(cs =>
      setOpenChallengeCount(cs.filter(c => c.status !== 'complete' && !isMine(c)).length),
    );
  }, []);

  useEffect(() => {
    refreshOpenChallengeCount();
  }, [refreshOpenChallengeCount]);

  const refreshDailyDone = useCallback(async () => {
    const groupsDaily = await fetchDailyPuzzle();
    const groupsCompleted = groupsDaily ? (await getCompletedPuzzleIds()).has(groupsDaily.id) : false;
    const stepsDaily = getDailyWordTrailsPuzzle(getWordTrails());
    const stepsResult = await getWordTrailsResult(stepsDaily.id);
    const crossedDaily = getDailyCrossedSignalsPuzzle(getCrossedSignalsPuzzles());
    const crossedResult = await getCrossedSignalsResult(crossedDaily.id);
    setDailyDone({
      connections: groupsCompleted,
      word_trails: !!stepsResult?.completed,
      crossed_signals: !!crossedResult?.completed,
    });
  }, []);

  useEffect(() => {
    refreshDailyDone();
    const unsubscribe = navigation.addListener('focus', refreshDailyDone);
    return unsubscribe;
  }, [navigation, refreshDailyDone]);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    subscribeToChallengeChanges(refreshOpenChallengeCount).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });
    const interval = setInterval(refreshOpenChallengeCount, 10000);
    return () => {
      cancelled = true;
      unsubscribe?.();
      clearInterval(interval);
    };
  }, [isGuest, refreshOpenChallengeCount]);

  useEffect(() => {
    actionAnim.setValue(0);
    Animated.timing(actionAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selectedGame, actionAnim]);

  const actionPanelStyle = {
    opacity: actionAnim,
    transform: [{
      translateY: actionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      }),
    }],
  };

  const gameAccent = selectedGame === 'connections' ? colors.tileStrip : selectedGame === 'word_trails' ? colors.blue : colors.purple;
  const gamePrimaryBg = colors.text1;
  const gamePrimaryLabel = gameAccent;
  const gameSecondaryBg = selectedGame === 'connections' ? colors.bgBase : colors.bgSurface;
  const selectedDailyDone = dailyDone[selectedGame];
  const modeSubtitle =
    selectedGame === 'connections' ? 'Find four hidden groups.' :
    selectedGame === 'word_trails' ? 'Build four ordered paths.' :
    'Decode crossed meanings.';
  const dailyLabel =
    selectedGame === 'connections' ? 'DAILY GROUPS' :
    selectedGame === 'word_trails' ? 'DAILY STEPS' :
    'DAILY SIGNALS';
  const dailyCompletedLabel =
    selectedGame === 'connections' ? 'DAILY GROUPS · COMPLETED' :
    selectedGame === 'word_trails' ? 'DAILY STEPS · COMPLETED' :
    'DAILY SIGNALS · COMPLETED';

  async function handleDailyPress() {
    if (selectedGame === 'connections') {
      const daily = await fetchDailyPuzzle();
      if (!daily) {
        navigation.navigate('Game', { mode: 'daily' });
        return;
      }
      const completed = (await getCompletedPuzzleIds()).has(daily.id);
      if (completed) {
        setCompletedDaily({ label: 'Daily Groups', puzzleId: daily.id });
      } else {
        navigation.navigate('Game', { mode: 'daily' });
      }
      return;
    }

    if (selectedGame === 'word_trails') {
      const daily = getDailyWordTrailsPuzzle(getWordTrails());
      const result = await getWordTrailsResult(daily.id);
      if (result?.completed) {
        setCompletedDaily({
          label: `Next Steps · ${daily.title}`,
          preloadedResult: { durationSeconds: result.durationSeconds, mistakes: result.mistakes },
        });
      } else {
        navigation.navigate('WordlinesGame', { mode: 'daily' });
      }
      return;
    }

    if (selectedGame === 'crossed_signals') {
      const crossedDaily = getDailyCrossedSignalsPuzzle(getCrossedSignalsPuzzles());
      const crossedResult = await getCrossedSignalsResult(crossedDaily.id);
      if (crossedResult?.completed) {
        setCompletedDaily({
          label: `Crossed Signals · ${crossedDaily.title}`,
          preloadedResult: { durationSeconds: crossedResult.durationSeconds, mistakes: crossedResult.noise },
          score: crossedResult.score,
        });
      } else {
        navigation.navigate('CrossedSignalsGame', { mode: 'daily' });
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <KonnectLogo iconSize={120} />
          <Text style={styles.greeting}>Hey, {user?.displayName}</Text>
          {isGuest && (
            <Pressable style={styles.guestBanner} onPress={() => guardAction(() => {})}>
              <Text style={styles.guestBannerText}>Playing as guest — tap to create a free account</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.buttons}>
          <View style={styles.modeSection}>
            <Text style={styles.modeTitle}>Choose game mode</Text>
            <Text style={styles.modeSubtitle}>{modeSubtitle}</Text>
          </View>

          <View style={styles.gameCards}>
            <Pressable
              style={[
                styles.gameCard,
                selectedGame === 'connections' && styles.gameCardActive,
              ]}
              onPress={() => setSelectedGame('connections')}
            >
              <View style={styles.connectionsIcon}>
                <View style={[styles.iconTile, { backgroundColor: colors.yellow }]} />
                <View style={[styles.iconTile, { backgroundColor: colors.green }]} />
                <View style={[styles.iconTile, { backgroundColor: colors.blue }]} />
                <View style={[styles.iconTile, { backgroundColor: colors.purple }]} />
              </View>
              <Text style={[
                styles.gameCardTitle,
                selectedGame === 'connections' && styles.gameCardTitleActive,
              ]}>
                Groups
              </Text>
              <Text style={[
                styles.gameCardSub,
                selectedGame === 'connections' && styles.gameCardSubActive,
              ]}>
                Hidden groups
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.gameCard,
                selectedGame === 'word_trails' && styles.gameCardWordlinesActive,
              ]}
              onPress={() => setSelectedGame('word_trails')}
            >
              <View style={styles.wordlineIcon}>
                <View style={[styles.wordlineDot, { backgroundColor: colors.yellow }]} />
                <View style={[styles.wordlineDash, selectedGame !== 'word_trails' && { backgroundColor: colors.blue }]} />
                <View style={[styles.wordlineDot, { backgroundColor: colors.green }]} />
                <View style={[styles.wordlineDash, selectedGame !== 'word_trails' && { backgroundColor: colors.blue }]} />
                <View style={[styles.wordlineDot, { backgroundColor: colors.blue }]} />
                <View style={[styles.wordlineDash, selectedGame !== 'word_trails' && { backgroundColor: colors.blue }]} />
                <View style={[styles.wordlineDot, { backgroundColor: colors.purple }]} />
              </View>
              <Text style={[
                styles.gameCardTitle,
                selectedGame === 'word_trails' && styles.gameCardTitleActive,
              ]}>
                Next Steps
              </Text>
              <Text style={[
                styles.gameCardSub,
                selectedGame === 'word_trails' && styles.gameCardSubActive,
              ]}>
                Ordered steps
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.gameCard,
                selectedGame === 'crossed_signals' && styles.gameCardSignalsActive,
              ]}
              onPress={() => setSelectedGame('crossed_signals')}
            >
              <CrossedSignalsIcon colors={colors} active={selectedGame === 'crossed_signals'} />
              <Text style={[
                styles.gameCardTitle,
                selectedGame === 'crossed_signals' && styles.gameCardTitleActive,
              ]}>
                Crossed Signals
              </Text>
              <Text style={[
                styles.gameCardSub,
                selectedGame === 'crossed_signals' && styles.gameCardSubActive,
              ]}>
                Meaning grid
              </Text>
            </Pressable>
          </View>

          <Animated.View style={[styles.actionPanel, actionPanelStyle]}>
            <Pressable
              style={[styles.btnPrimary, { backgroundColor: gamePrimaryBg }]}
              onPress={handleDailyPress}
            >
              <Text style={[styles.btnLabel, { color: gamePrimaryLabel }]}>
                {selectedDailyDone ? dailyCompletedLabel : dailyLabel}
              </Text>
              <Text style={styles.btnPrimaryText}>
                {selectedDailyDone
                  ? "View today's result"
                  : selectedGame === 'connections' ? "Play today's puzzle"
                    : selectedGame === 'word_trails' ? "Find today's path"
                      : "Decode today's grid"}
              </Text>
            </Pressable>

            <View style={styles.btnRow}>
              {(selectedGame !== 'connections' || user?.nytAccess) && (
                <Pressable
                  style={[styles.btnSecondary, { flex: 1, backgroundColor: gameSecondaryBg }]}
                  onPress={() => selectedGame === 'connections'
                    ? navigation.navigate('Game', { mode: 'nyt' })
                    : selectedGame === 'word_trails'
                      ? navigation.navigate('WordlinesGame', { mode: 'random' })
                      : navigation.navigate('CrossedSignalsGame', { mode: 'random' })}
                >
                  <Text style={[styles.btnLabel, { color: selectedGame === 'connections' ? colors.text2 : gameAccent }]}>
                    {selectedGame === 'connections' ? 'NYT' : 'RANDOM'}
                  </Text>
                  <Text style={styles.btnSecondaryText}>Random puzzle</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.btnTertiary, { flex: 1, backgroundColor: gameSecondaryBg, borderColor: gameAccent }]}
                onPress={() => selectedGame === 'connections'
                  ? navigation.navigate('PuzzleSelect')
                  : selectedGame === 'word_trails'
                    ? navigation.navigate('WordlinesSelect')
                    : navigation.navigate('CrossedSignalsSelect')}
              >
                <Text style={[styles.btnLabel, { color: selectedGame === 'connections' ? colors.text2 : gameAccent }]}>
                  FREE PLAY
                </Text>
                <Text style={styles.btnSecondaryText}>Choose puzzle</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.btnLeaderboard, selectedGame !== 'connections' && { borderColor: gameAccent }]}
              onPress={() => selectedGame === 'connections'
                ? guardAction(() => navigation.navigate('Leaderboard', { gameType: 'connections' }))
                : selectedGame === 'word_trails'
                  ? guardAction(() => navigation.navigate('Leaderboard', { gameType: 'word_trails' }))
                  : navigation.navigate('Stats')}
            >
              <Text style={styles.btnLeaderboardText}>
                {selectedGame === 'crossed_signals' ? '📊  Local Stats' : '🏆  Leaderboard'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerBtns}>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Stats')}>
            <BarChartIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Stats</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => guardAction(() => navigation.navigate('Friends'))}>
            <View style={{ position: 'relative' }}>
              <PeopleIcon color={colors.text2} />
              {openChallengeCount > 0 && !isGuest && (
                <View style={styles.badge} />
              )}
            </View>
            <Text style={styles.footerBtnText}>Friends</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Settings')}>
            <GearIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Settings</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Profile')}>
            <PersonIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Profile</Text>
          </Pressable>
        </View>
        <AdBanner />
      </View>
      <GameResultModal
        visible={!!completedDaily}
        label={completedDaily?.label ?? ''}
        puzzleId={completedDaily?.puzzleId ?? null}
        preloadedResult={completedDaily?.preloadedResult ?? null}
        score={completedDaily?.score ?? null}
        gameMode={selectedGame !== 'connections' ? 'classic' : null}
        onClose={() => setCompletedDaily(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flexGrow: 1, justifyContent: 'space-between', padding: 24 },
    header: { alignItems: 'center', paddingTop: 12, gap: 12 },
    greeting: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
    guestBanner: {
      backgroundColor: c.bgBase, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: c.border,
    },
    guestBannerText: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    buttons: { gap: 14 },
    modeSection: { gap: 3 },
    modeTitle: { fontSize: 18, fontFamily: FONTS.extraBold, color: c.text1 },
    modeSubtitle: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    gameCards: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gameCard: {
      flex: 1,
      minWidth: 108,
      minHeight: 118,
      borderRadius: 16,
      backgroundColor: c.bgBase,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 14,
      justifyContent: 'space-between',
      gap: 8,
    },
    gameCardActive: { backgroundColor: c.text1, borderColor: c.tileStrip },
    gameCardWordlinesActive: { backgroundColor: c.text1, borderColor: c.blue },
    gameCardSignalsActive: { backgroundColor: c.text1, borderColor: c.purple },
    connectionsIcon: { width: 42, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
    iconTile: { width: 19, height: 19, borderRadius: 6 },
    wordlineIcon: { flexDirection: 'row', alignItems: 'center', height: 22 },
    wordlineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.bgScreen },
    wordlineDash: { width: 18, height: 3, borderRadius: 2, backgroundColor: c.bgScreen, opacity: 0.9 },
    gameCardTitle: { fontSize: 17, fontFamily: FONTS.extraBold, color: c.text1 },
    gameCardTitleActive: { color: c.bgScreen },
    gameCardSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    gameCardSubActive: { color: c.bgScreen, opacity: 0.85 },
    actionPanel: { gap: 12 },
    btnPrimary: { backgroundColor: c.text1, borderRadius: 16, padding: 20, gap: 4 },
    btnLabel: { fontSize: 11, fontFamily: FONTS.extraBold, letterSpacing: 2 },
    btnPrimaryText: { color: c.bgScreen, fontSize: 18, fontFamily: FONTS.extraBold },
    btnRow: { flexDirection: 'row', gap: 12 },
    btnSecondary: { backgroundColor: c.bgBase, borderRadius: 16, padding: 20, gap: 4 },
    btnTertiary: { backgroundColor: c.bgBase, borderRadius: 16, padding: 20, gap: 4, opacity: 0.85, borderWidth: 1 },
    btnSecondaryText: { color: c.text1, fontSize: 16, fontFamily: FONTS.extraBold },
    btnLeaderboard: {
      backgroundColor: c.bgBase, borderRadius: 16,
      paddingVertical: 14, paddingHorizontal: 20,
      alignItems: 'center',
    },
    btnLeaderboardText: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    footer: { gap: 12 },
    footerBtns: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: 6,
    },
    footerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.bgBase, borderRadius: 20,
      paddingHorizontal: 11, paddingVertical: 9,
    },
    footerBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: c.errorFlash },
  });
}
