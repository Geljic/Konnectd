import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { fetchRecentSessions, type PlaySessionItem } from '@/api/puzzles';
import {
  fetchLocalWordTrailsSessions,
  computeWordTrailsStreak,
  type WordTrailsSessionItem,
} from '@/utils/wordTrails';
import { GameResultModal } from '@/components/GameResultModal';
import { AdBanner } from '@/components/BannerAd';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

type GameTab = 'connections' | 'word_trails';
type ConnectionsMode = 'normal' | 'hard';

export function StatsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const user = useAuthStore(s => s.user);
  const [sessions, setSessions] = useState<PlaySessionItem[]>([]);
  const [wtSessions, setWtSessions] = useState<WordTrailsSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<PlaySessionItem | null>(null);
  const [gameTab, setGameTab] = useState<GameTab>('connections');
  const [connectionsMode, setConnectionsMode] = useState<ConnectionsMode>('normal');

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const { refreshProfile } = useAuthStore.getState();
      Promise.all([
        fetchRecentSessions(500),
        fetchLocalWordTrailsSessions(),
        refreshProfile(),
      ]).then(([all, wt]) => {
        setSessions(all);
        setWtSessions(wt);
        setLoading(false);
      });
    }, [])
  );

  if (!user) return null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.text2} />
      </SafeAreaView>
    );
  }

  // Connections stats (from PocketBase)
  const filtered = sessions.filter(
    s => s.gameType === 'connections' && s.gameMode === connectionsMode,
  );

  // Word trails stats (from local AsyncStorage)
  const wtFiltered = wtSessions;

  const activeList = gameTab === 'connections' ? filtered : wtFiltered;
  const played = activeList.length;
  const won = activeList.filter(s => s.completed).length;
  const losses = played - won;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
  const wonWithTime = activeList.filter(s => s.completed && s.durationSeconds > 0);
  const avgTimeSecs = wonWithTime.length > 0
    ? Math.round(wonWithTime.reduce((a, s) => a + s.durationSeconds, 0) / wonWithTime.length)
    : null;

  let streakCurrent: number;
  let streakBest: number;
  if (gameTab === 'connections') {
    streakCurrent = user.streakCurrent ?? 0;
    streakBest = user.streakBest ?? 0;
  } else {
    const wtStreak = computeWordTrailsStreak(wtSessions);
    streakCurrent = wtStreak.current;
    streakBest = wtStreak.best;
  }

  const scoredSessions = filtered.filter(s => s.completed && s.score !== undefined && s.score > 0);
  const bestScore = scoredSessions.length > 0
    ? Math.max(...scoredSessions.map(s => s.score!))
    : null;

  const recentConnections = filtered.slice(0, 15);
  const recentWt = wtFiltered.slice(0, 15);

  function ConnectionsRow({ item, index }: { item: PlaySessionItem; index: number }) {
    return (
      <Pressable style={styles.sessionRow} onPress={item.completed ? () => setSelectedSession(item) : undefined}>
        <View style={[styles.sessionOutcome, { backgroundColor: item.completed ? colors.green : colors.purple }]}>
          <Text style={styles.sessionOutcomeText}>{item.completed ? '✓' : '✗'}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionLabel}>Game #{index + 1}</Text>
          <Text style={styles.sessionDate}>{formatDate(item.created)}</Text>
        </View>
        <View style={styles.sessionStats}>
          <Text style={styles.sessionTime}>{formatTime(item.durationSeconds)}</Text>
          <Text style={styles.sessionMistakes}>{item.mistakes} mistake{item.mistakes !== 1 ? 's' : ''}</Text>
          {item.completed && item.score != null && (
            <Text style={styles.sessionScore}>⭐ {item.score}</Text>
          )}
          {item.completed && <Text style={styles.sessionTap}>›</Text>}
        </View>
      </Pressable>
    );
  }

  function WtRow({ item, index }: { item: WordTrailsSessionItem; index: number }) {
    return (
      <View style={styles.sessionRow}>
        <View style={[styles.sessionOutcome, { backgroundColor: item.completed ? colors.green : colors.purple }]}>
          <Text style={styles.sessionOutcomeText}>{item.completed ? '✓' : '✗'}</Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionLabel}>{item.puzzle.toUpperCase()}</Text>
          <Text style={styles.sessionDate}>{formatDate(item.created)}</Text>
        </View>
        <View style={styles.sessionStats}>
          <Text style={styles.sessionTime}>{formatTime(item.durationSeconds)}</Text>
          <Text style={styles.sessionMistakes}>{item.mistakes} mistake{item.mistakes !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={gameTab === 'connections' ? recentConnections : recentWt}
        keyExtractor={s => s.id}
        renderItem={({ item, index }) =>
          gameTab === 'connections'
            ? <ConnectionsRow item={item as PlaySessionItem} index={index} />
            : <WtRow item={item as WordTrailsSessionItem} index={index} />
        }
        contentContainerStyle={styles.container}
        ListHeaderComponent={() => (
          <>
            <AdBanner />
            <Text style={styles.title}>Your Stats</Text>

            {/* Game type selector — top level */}
            <View style={styles.gameTypeRow}>
              <Pressable
                style={[styles.gameTypeBtn, gameTab === 'connections' && styles.gameTypeBtnActive]}
                onPress={() => setGameTab('connections')}
              >
                <Text style={[styles.gameTypeBtnText, gameTab === 'connections' && styles.gameTypeBtnTextActive]}>
                  Connections
                </Text>
              </Pressable>
              <Pressable
                style={[styles.gameTypeBtn, gameTab === 'word_trails' && styles.gameTypeBtnWtActive]}
                onPress={() => setGameTab('word_trails')}
              >
                <Text style={[styles.gameTypeBtnText, gameTab === 'word_trails' && styles.gameTypeBtnTextActive]}>
                  Next Steps
                </Text>
              </Pressable>
            </View>

            {/* Connections sub-filter */}
            {gameTab === 'connections' && (
              <View style={styles.subToggle}>
                <Pressable
                  style={[styles.subBtn, connectionsMode === 'normal' && styles.subBtnActive]}
                  onPress={() => setConnectionsMode('normal')}
                >
                  <Text style={[styles.subBtnText, connectionsMode === 'normal' && styles.subBtnTextActive]}>Normal</Text>
                </Pressable>
                <Pressable
                  style={[styles.subBtn, connectionsMode === 'hard' && styles.subBtnHardActive]}
                  onPress={() => setConnectionsMode('hard')}
                >
                  <Text style={[styles.subBtnText, connectionsMode === 'hard' && styles.subBtnTextActive]}>Hard</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.grid}>
              {([['Played', played], ['Win %', `${winRate}%`], ['Wins', won], ['Losses', losses]] as [string, string | number][]).map(([label, value]) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.streakRow}>
              {[['🔥', streakCurrent, 'Current streak'], ['⭐', streakBest, 'Best streak']].map(([icon, val, label]) => (
                <View key={label as string} style={styles.streakBox}>
                  <Text style={styles.streakFire}>{icon}</Text>
                  <View>
                    <Text style={styles.streakValue}>{val}</Text>
                    <Text style={styles.streakLabel}>{label}</Text>
                  </View>
                </View>
              ))}
            </View>

            {avgTimeSecs !== null && (
              <View style={styles.secondaryRow}>
                <View style={styles.avgTimeBox}>
                  <Text style={styles.avgTimeValue}>{formatTime(avgTimeSecs)}</Text>
                  <Text style={styles.avgTimeLabel}>Avg solve time</Text>
                </View>
                {bestScore !== null && gameTab === 'connections' && (
                  <View style={styles.avgTimeBox}>
                    <Text style={styles.avgTimeValue}>⭐ {bestScore}</Text>
                    <Text style={styles.avgTimeLabel}>Best score</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Win / Loss</Text>
              {played > 0 ? (
                <View style={styles.winBarContainer}>
                  <View style={styles.winBarTrack}>
                    <View style={[styles.winBarFill, { flex: won / played }]} />
                    <View style={[styles.lossBarFill, { flex: losses / played }]} />
                  </View>
                  <View style={styles.winBarLabels}>
                    <Text style={styles.winBarLabel}>W {won}</Text>
                    <Text style={styles.winBarLabel}>L {losses}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyHint}>
                  {gameTab === 'word_trails'
                    ? 'No Next Steps games yet.'
                    : connectionsMode === 'hard'
                      ? 'No hard mode games yet. Enable hard mode in Settings.'
                      : 'Play your first puzzle to see stats here.'}
                </Text>
              )}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Games</Text>
            {activeList.length === 0 && (
              <Text style={styles.emptyHint}>
                {gameTab === 'word_trails'
                  ? 'No Next Steps games recorded yet.'
                  : connectionsMode === 'hard'
                    ? 'No hard mode games recorded yet.'
                    : 'No games recorded yet.'}
              </Text>
            )}
          </>
        )}
        ListEmptyComponent={null}
      />

      <GameResultModal
        visible={!!selectedSession}
        label={selectedSession ? `Game · ${formatDate(selectedSession.created)}` : ''}
        date={selectedSession ? formatDate(selectedSession.created) : null}
        preloadedResult={selectedSession ? { durationSeconds: selectedSession.durationSeconds, mistakes: selectedSession.mistakes } : null}
        score={selectedSession?.score ?? null}
        gameMode={selectedSession?.gameMode ?? null}
        onClose={() => setSelectedSession(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1, marginVertical: 16 },

    gameTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    gameTypeBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: c.bgSurface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    gameTypeBtnActive: { backgroundColor: c.text1, borderColor: c.text1 },
    gameTypeBtnWtActive: { backgroundColor: c.blue, borderColor: c.blue },
    gameTypeBtnText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text2 },
    gameTypeBtnTextActive: { color: c.bgScreen },

    subToggle: { flexDirection: 'row', backgroundColor: c.bgBase, borderRadius: 10, padding: 3, marginBottom: 16, gap: 3 },
    subBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
    subBtnActive: { backgroundColor: c.text1 },
    subBtnHardActive: { backgroundColor: c.purple },
    subBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    subBtnTextActive: { color: c.bgScreen },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statBox: { flex: 1, minWidth: '40%', backgroundColor: c.bgSurface, borderRadius: 12, padding: 18, alignItems: 'center', gap: 4 },
    statValue: { fontSize: 32, fontFamily: FONTS.extraBold, color: c.text1 },
    statLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    streakRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    streakBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgSurface, borderRadius: 12, padding: 18 },
    streakFire: { fontSize: 28 },
    streakValue: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1 },
    streakLabel: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    avgTimeBox: { flex: 1, backgroundColor: c.bgSurface, borderRadius: 12, padding: 18, alignItems: 'center', gap: 4 },
    avgTimeValue: { fontSize: 28, fontFamily: FONTS.extraBold, color: c.text1 },
    avgTimeLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    section: { marginTop: 20, gap: 10 },
    sectionTitle: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1, marginBottom: 8 },
    winBarContainer: { gap: 6 },
    winBarTrack: { flexDirection: 'row', height: 28, borderRadius: 8, overflow: 'hidden', backgroundColor: c.bgBase },
    winBarFill: { backgroundColor: c.green },
    lossBarFill: { backgroundColor: c.purple, opacity: 0.6 },
    winBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    winBarLabel: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    emptyHint: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3, textAlign: 'center', marginTop: 8 },
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    sessionOutcome: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sessionOutcomeText: { fontSize: 16, fontFamily: FONTS.extraBold, color: '#FFF' },
    sessionMeta: { flex: 1 },
    sessionLabel: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    sessionDate: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    sessionStats: { alignItems: 'flex-end', gap: 2 },
    sessionTime: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    sessionMistakes: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    sessionScore: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    sessionTap: { fontSize: 18, color: c.text3, marginTop: 2 },
  });
}
