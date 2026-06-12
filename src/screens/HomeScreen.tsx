import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useGuestGuard } from '@/hooks/useGuestGuard';
import { KonnectIcon } from '@/components/KonnectLogo';
import { NextStepsIcon } from '@/components/NextStepsLogo';
import { CrossedSignalsIcon } from '@/components/CrossedSignalsLogo';
import { BottomNav } from '@/components/BottomNav';
import { AdBanner } from '@/components/BannerAd';
import { GameResultModal } from '@/components/GameResultModal';
import { fetchMyChallenges, subscribeToChallengeChanges, isMine } from '@/api/challenges';
import { fetchDailyPuzzle, getCompletedPuzzleIds } from '@/api/puzzles';
import { getNextSteps } from '@/api/nextSteps';
import { getDailyNextStepsPuzzle, getNextStepsResult } from '@/utils/nextSteps';
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

const MODE_ORDER: HomeGameType[] = ['connections', 'word_trails', 'crossed_signals'];

/* ── Icons ────────────────────────────────────────────────── */

function SettingsGearIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.7" fill="none" />
      <Path
        d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.04-.04A2 2 0 1 1 7.06 4.6l.04.04a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlameIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 1.2 C9.7 4 11.3 5.2 11.3 8.6 C11.3 11.3 9.8 13.2 8 13.2 C6.2 13.2 4.7 11.4 4.7 9 C4.7 7.7 5.3 6.9 5.8 6.3 C6 8 7 8.5 7.4 7.8 C8.1 6.8 6.4 5.2 8 1.2 Z"
        fill={color}
      />
    </Svg>
  );
}

function PuzzlePieceIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M6 2 C6 1 7 1 7.5 1 C8 1 9 1 9 2 C9 2.8 9.6 3 10 3 C11 3 11.5 3 11.5 4 L11.5 5.5 C12.5 5.5 13 6 13 7 C13 8 12.5 8.5 11.5 8.5 L11.5 11 C11.5 12 11 12.5 10 12.5 L7.5 12.5 C7.5 11.5 7 11 6 11 C5 11 4.5 11.5 4.5 12.5 L3 12.5 C2 12.5 1.5 12 1.5 11 L1.5 8.5 C2.5 8.5 3 8 3 7 C3 6 2.5 5.5 1.5 5.5 L1.5 4 C1.5 3 2 3 3 3 L4.5 3 C4.5 2.4 5 2 6 2 Z"
        fill={color}
      />
    </Svg>
  );
}

function CheckCircleIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M5 8 L7.2 10.2 L11 5.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Svg>
  );
}

function CheckIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M3.5 8.5 L6.5 11.5 L12.5 5" stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5 L19 12 L8 19 Z" fill={color} />
    </Svg>
  );
}

function ArrowRightIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M3 8 L12 8 M8.5 4 L12.5 8 L8.5 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Svg>
  );
}

function GiftIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Rect x="2.5" y="6.5" width="11" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/>
      <Line x1="2" y1="6.5" x2="14" y2="6.5" stroke={color} strokeWidth="1.4"/>
      <Line x1="8" y1="6.5" x2="8" y2="13.5" stroke={color} strokeWidth="1.4"/>
      <Path d="M8 6.5 C8 4 6.5 3 5.5 4 C4.6 4.9 6 6 8 6.5 Z" stroke={color} strokeWidth="1.2" fill="none"/>
      <Path d="M8 6.5 C8 4 9.5 3 10.5 4 C11.4 4.9 10 6 8 6.5 Z" stroke={color} strokeWidth="1.2" fill="none"/>
    </Svg>
  );
}

function TrophyIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M4 2.5 L12 2.5 L12 6 C12 8.2 10.2 9.5 8 9.5 C5.8 9.5 4 8.2 4 6 Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <Path d="M4 3.5 C2.5 3.5 2 4.5 2.5 5.5 C2.9 6.3 3.5 6.5 4 6.5" stroke={color} strokeWidth="1.3" fill="none"/>
      <Path d="M12 3.5 C13.5 3.5 14 4.5 13.5 5.5 C13.1 6.3 12.5 6.5 12 6.5" stroke={color} strokeWidth="1.3" fill="none"/>
      <Line x1="8" y1="9.5" x2="8" y2="12" stroke={color} strokeWidth="1.4"/>
      <Path d="M5.5 13.5 L10.5 13.5 L10 12 L6 12 Z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
    </Svg>
  );
}

function CalendarTile({ accent }: { accent: string }) {
  const day = new Date().getDate();
  return (
    <View style={[calStyles.tile, { backgroundColor: accent }]}>
      <View style={calStyles.rings}>
        <View style={calStyles.ring} />
        <View style={calStyles.ring} />
      </View>
      <View style={calStyles.body}>
        <Text style={[calStyles.day, { color: accent }]}>{day}</Text>
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  tile: { width: 60, height: 60, borderRadius: 13, padding: 6, paddingTop: 8 },
  rings: { flexDirection: 'row', justifyContent: 'center', gap: 12, height: 6, marginBottom: 3 },
  ring: { width: 3, height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  body: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  day: { fontSize: 21, fontFamily: FONTS.extraBold, marginTop: -1 },
});

/* ── Screen ───────────────────────────────────────────────── */

export function HomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore(s => s.user);
  const { isGuest, guardAction } = useGuestGuard();
  const scrollRef = useRef<ScrollView>(null);
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
    const stepsDaily = getDailyNextStepsPuzzle(getNextSteps());
    const stepsResult = await getNextStepsResult(stepsDaily.id);
    const crossedDaily = getDailyCrossedSignalsPuzzle(getCrossedSignalsPuzzles());
    const crossedResult = await getCrossedSignalsResult(crossedDaily.id);
    setDailyDone({
      connections: groupsCompleted,
      word_trails: !!stepsResult?.completed,
      crossed_signals: !!crossedResult?.completed,
    });
  }, []);

  useEffect(() => {
    const refresh = () => {
      refreshDailyDone();
      if (!isGuest) useAuthStore.getState().refreshProfile();
    };
    refresh();
    const unsubscribe = navigation.addListener('focus', refresh);
    return unsubscribe;
  }, [navigation, refreshDailyDone, isGuest]);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    subscribeToChallengeChanges(refreshOpenChallengeCount).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });
    // Realtime subscription handles updates; this is only a fallback poll.
    const interval = setInterval(refreshOpenChallengeCount, 60000);
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

  const heroAnimStyle = {
    opacity: actionAnim,
    transform: [{
      translateY: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
    }],
  };

  const modeAccents: Record<HomeGameType, string> = {
    connections: colors.green,
    word_trails: colors.blue,
    crossed_signals: colors.purple,
  };
  const gameAccent = modeAccents[selectedGame];
  const selectedDailyDone = dailyDone[selectedGame];
  const completedCount = MODE_ORDER.filter(m => dailyDone[m]).length;
  const allDailiesDone = completedCount === MODE_ORDER.length;
  const streak = user?.streakCurrent ?? 0;

  const heroSub =
    selectedDailyDone ? 'Tap to view your result' :
    selectedGame === 'connections' ? 'Find four hidden groups' :
    selectedGame === 'word_trails' ? 'Build four ordered paths' :
    'Decode the meaning grid';
  const dailyTag =
    selectedGame === 'connections' ? 'DAILY GROUPS' :
    selectedGame === 'word_trails' ? 'DAILY STEPS' :
    'DAILY SIGNALS';

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
      const daily = getDailyNextStepsPuzzle(getNextSteps());
      const result = await getNextStepsResult(daily.id);
      if (result?.completed) {
        setCompletedDaily({
          label: `Next Steps · ${daily.title}`,
          preloadedResult: { durationSeconds: result.durationSeconds, mistakes: result.mistakes },
        });
      } else {
        navigation.navigate('NextStepsGame', { mode: 'daily' });
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

  function handleFreePlay() {
    if (selectedGame === 'connections') navigation.navigate('PuzzleSelect');
    else if (selectedGame === 'word_trails') navigation.navigate('NextStepsSelect');
    else navigation.navigate('CrossedSignalsSelect');
  }

  function handleLeaderboard() {
    if (selectedGame === 'connections') guardAction(() => navigation.navigate('Leaderboard', { gameType: 'connections' }));
    else if (selectedGame === 'word_trails') guardAction(() => navigation.navigate('Leaderboard', { gameType: 'word_trails' }));
    else navigation.navigate('Stats');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar: brand + settings */}
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <KonnectIcon size={56} />
            <View style={styles.brandText}>
              <Text style={styles.wordmark}>Konnectd</Text>
              <Text style={styles.tagline}>Daily word puzzles</Text>
            </View>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Settings')} hitSlop={8}>
            <SettingsGearIcon color={colors.text2} size={20} />
          </Pressable>
        </View>

        <Text style={styles.greeting}>Hey, {user?.displayName} 👋</Text>

        {isGuest && (
          <Pressable style={styles.guestBanner} onPress={() => guardAction(() => {})}>
            <Text style={styles.guestBannerText}>Playing as guest — tap to create a free account</Text>
          </Pressable>
        )}

        {/* Stats / streak strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCell}>
            <FlameIcon color={streak > 0 ? colors.yellow : colors.text3} size={22} />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <PuzzlePieceIcon color={colors.green} size={22} />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{MODE_ORDER.length}</Text>
              <Text style={styles.statLabel}>modes</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <CheckCircleIcon color={allDailiesDone ? colors.green : colors.blue} size={22} />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{completedCount}/{MODE_ORDER.length}</Text>
              <Text style={styles.statLabel}>done today</Text>
            </View>
          </View>
        </View>

        {/* Today's puzzle hero */}
        <Animated.View style={heroAnimStyle}>
          <Pressable
            style={[styles.hero, { borderColor: gameAccent }, selectedDailyDone && { backgroundColor: colors.bgSurface }]}
            onPress={handleDailyPress}
          >
            <View style={styles.heroTop}>
              <CalendarTile accent={gameAccent} />
              <View style={styles.heroBody}>
                <Text style={[styles.heroTag, { color: gameAccent }]}>{dailyTag}</Text>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle}>{selectedDailyDone ? 'Completed' : "Today's puzzle"}</Text>
                  {selectedDailyDone && (
                    <View style={[styles.donePill, { backgroundColor: gameAccent }]}>
                      <CheckIcon color="#FFFFFF" size={10} />
                      <Text style={styles.donePillText}>DONE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.heroSub, { color: selectedDailyDone ? colors.text2 : gameAccent }]}>{heroSub}</Text>
              </View>
              <View style={[styles.playBtn, { backgroundColor: gameAccent }]}>
                {selectedDailyDone ? <CheckIcon color="#FFFFFF" size={24} /> : <PlayIcon color="#FFFFFF" />}
              </View>
            </View>

            {/* Progress: one node per mode + reward */}
            <View style={styles.progressRow}>
              {MODE_ORDER.map((m, i) => (
                <React.Fragment key={m}>
                  {i > 0 && (
                    <View style={[styles.progressLine, dailyDone[MODE_ORDER[i - 1]] && dailyDone[m] && { backgroundColor: colors.green }]} />
                  )}
                  <View style={[styles.progressNode, dailyDone[m] ? { backgroundColor: modeAccents[m], borderColor: modeAccents[m] } : null]}>
                    {dailyDone[m] && <CheckIcon color="#FFFFFF" size={11} />}
                  </View>
                </React.Fragment>
              ))}
              <View style={[styles.progressLine, allDailiesDone && { backgroundColor: colors.green }]} />
              <GiftIcon color={allDailiesDone ? colors.green : colors.text3} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Mode picker */}
        <Text style={styles.sectionTitle}>Choose game mode</Text>
        <View style={styles.gameCards}>
          <ModeCard
            styles={styles}
            active={selectedGame === 'connections'}
            accent={modeAccents.connections}
            title="Groups"
            sub="Hidden groups"
            done={dailyDone.connections}
            onPress={() => setSelectedGame('connections')}
            icon={<KonnectIcon size={40} />}
          />
          <ModeCard
            styles={styles}
            active={selectedGame === 'word_trails'}
            accent={modeAccents.word_trails}
            title="Next Steps"
            sub="Ordered steps"
            done={dailyDone.word_trails}
            onPress={() => setSelectedGame('word_trails')}
            icon={<NextStepsIcon size={11} />}
          />
          <ModeCard
            styles={styles}
            active={selectedGame === 'crossed_signals'}
            accent={modeAccents.crossed_signals}
            title="Crossed Signals"
            sub="Meaning grid"
            done={dailyDone.crossed_signals}
            onPress={() => setSelectedGame('crossed_signals')}
            icon={<CrossedSignalsIcon size={13} />}
          />
        </View>

        {/* Secondary rows */}
        <Pressable style={styles.row} onPress={handleFreePlay}>
          <View style={[styles.rowIcon, { backgroundColor: colors.bgSurface }]}>
            <PuzzlePieceIcon color={gameAccent} size={20} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Free Play</Text>
            <Text style={styles.rowSub}>Choose any puzzle</Text>
          </View>
          <ArrowRightIcon color={colors.text3} />
        </Pressable>

        <Pressable style={styles.row} onPress={handleLeaderboard}>
          <View style={[styles.rowIcon, { backgroundColor: colors.bgSurface }]}>
            <TrophyIcon color={colors.purple} size={20} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{selectedGame === 'crossed_signals' ? 'Local Stats' : 'Leaderboard'}</Text>
            <Text style={styles.rowSub}>{selectedGame === 'crossed_signals' ? 'See your records' : 'See how you rank'}</Text>
          </View>
          <ArrowRightIcon color={colors.text3} />
        </Pressable>
      </ScrollView>

      <AdBanner />
      <BottomNav active="home" onHomePress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />

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

/* ── Mode card ────────────────────────────────────────────── */

function ModeCard({
  styles, active, accent, title, sub, done, icon, onPress,
}: {
  styles: ReturnType<typeof makeStyles>;
  active: boolean;
  accent: string;
  title: string;
  sub: string;
  done: boolean;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.gameCard, active && { borderColor: accent, backgroundColor: styles.gameCardActiveBg.backgroundColor }]}
      onPress={onPress}
    >
      <View style={styles.gameCardIcon}>{icon}</View>
      <View>
        <Text style={styles.gameCardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.gameCardSub} numberOfLines={1}>{sub}</Text>
      </View>
      <View style={[styles.gameCardArrow, active && { backgroundColor: accent }]}>
        {done
          ? <CheckIcon color={active ? '#FFFFFF' : accent} size={13} />
          : <ArrowRightIcon color={active ? '#FFFFFF' : styles.gameCardArrowIdle.color} size={14} />}
      </View>
    </Pressable>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    scroll: { flex: 1 },
    container: { padding: 18, paddingBottom: 24, gap: 14 },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandText: { gap: 1 },
    wordmark: { fontSize: 24, fontFamily: FONTS.extraBold, color: c.text1, letterSpacing: 0.5 },
    tagline: { fontSize: 12.5, fontFamily: FONTS.bold, color: c.text3 },
    iconBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgBase, borderWidth: 1, borderColor: c.border,
    },

    greeting: { fontSize: 22, fontFamily: FONTS.extraBold, color: c.text1, marginTop: 2 },

    guestBanner: {
      backgroundColor: c.bgBase, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 9,
      borderWidth: 1, borderColor: c.border,
    },
    guestBannerText: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },

    statsStrip: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.bgBase, borderRadius: 12,
      borderWidth: 1, borderColor: c.border,
      paddingVertical: 12, paddingHorizontal: 6,
    },
    statCell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    statText: { gap: 0 },
    statValue: { fontSize: 17, fontFamily: FONTS.extraBold, color: c.text1 },
    statLabel: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3 },
    statDivider: { width: 1, height: 28, backgroundColor: c.border },

    hero: {
      backgroundColor: c.bgBase, borderRadius: 14,
      borderWidth: 1.5, padding: 16, gap: 14,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    heroBody: { flex: 1, gap: 3 },
    heroTag: { fontSize: 10.5, fontFamily: FONTS.extraBold, letterSpacing: 1.5 },
    heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroTitle: { fontSize: 19, fontFamily: FONTS.extraBold, color: c.text1 },
    donePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    donePillText: { fontSize: 9.5, fontFamily: FONTS.extraBold, color: '#FFFFFF', letterSpacing: 0.6 },
    heroSub: { fontSize: 13, fontFamily: FONTS.bold },
    playBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingLeft: 0 },

    progressRow: { flexDirection: 'row', alignItems: 'center' },
    progressNode: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.text3, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    progressLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.border, marginHorizontal: 4 },

    sectionTitle: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1, marginTop: 2 },
    gameCards: { flexDirection: 'row', gap: 10 },
    gameCard: {
      flex: 1, minHeight: 132, borderRadius: 12,
      backgroundColor: c.bgBase, borderWidth: 1.5, borderColor: c.border,
      padding: 12, justifyContent: 'space-between', gap: 10,
    },
    gameCardActiveBg: { backgroundColor: c.bgSurface },
    gameCardIcon: { height: 44, justifyContent: 'center' },
    gameCardTitle: { fontSize: 14.5, fontFamily: FONTS.extraBold, color: c.text1 },
    gameCardSub: { fontSize: 11.5, fontFamily: FONTS.bold, color: c.text3 },
    gameCardArrow: {
      width: 26, height: 26, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.bgScreen, borderWidth: 1, borderColor: c.border,
    },
    gameCardArrowIdle: { color: c.text3 },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.bgBase, borderRadius: 12,
      borderWidth: 1, borderColor: c.border,
      paddingVertical: 13, paddingHorizontal: 14,
    },
    rowIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowBody: { flex: 1, gap: 1 },
    rowTitle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
  });
}
