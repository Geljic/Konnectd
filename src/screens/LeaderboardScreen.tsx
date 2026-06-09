import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet,
  ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchFriendsLeaderboard, fetchGlobalLeaderboard, fetchHeadToHead,
  type LeaderboardEntry, type HeadToHead,
} from '@/api/leaderboard';
import { GAME_TYPE_LABELS, type GameType } from '@/constants/gameModes';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../App';

const MEDAL = ['🥇', '🥈', '🥉'];
type Tab = 'friends' | 'global';
type Props = NativeStackScreenProps<AppStackParamList, 'Leaderboard'>;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export function LeaderboardScreen({ route }: Props) {
  const gameType: GameType = route.params?.gameType ?? 'connections';
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tab, setTab] = useState<Tab>('friends');
  const [friendsData, setFriendsData] = useState<LeaderboardEntry[]>([]);
  const [globalData, setGlobalData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [h2h, setH2H] = useState<HeadToHead | null>(null);
  const [h2hLoading, setH2HLoading] = useState(false);

  useEffect(() => { loadAll(); }, [gameType]);

  async function loadAll() {
    setLoading(true);
    const [friends, global] = await Promise.all([fetchFriendsLeaderboard(gameType), fetchGlobalLeaderboard(gameType)]);
    setFriendsData(friends);
    setGlobalData(global);
    setLoading(false);
  }

  async function handleEntryPress(entry: LeaderboardEntry) {
    if (entry.isMe) return;
    setSelectedEntry(entry);
    setH2H(null);
    setH2HLoading(true);
    const result = await fetchHeadToHead(entry.userId, gameType);
    setH2H(result);
    setH2HLoading(false);
  }

  const data = tab === 'friends' ? friendsData : globalData;
  const myEntry = friendsData.find(e => e.isMe);
  const modeLabel = GAME_TYPE_LABELS[gameType];

  function EntryRow({ item }: { item: LeaderboardEntry }) {
    const medal = item.rank <= 3 ? MEDAL[item.rank - 1] : null;
    return (
      <Pressable
        style={[styles.row, item.isMe && styles.rowMe]}
        onPress={!item.isMe && tab === 'friends' ? () => handleEntryPress(item) : undefined}
        disabled={item.isMe || tab === 'global'}
      >
        <Text style={styles.rankText}>{medal ?? `#${item.rank}`}</Text>
        <View style={styles.rowAvatar}>
          <Text style={styles.avatarText}>{item.displayName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowHandle, item.isMe && styles.rowHandleMe]} numberOfLines={1}>
            {item.handle}{item.isMe ? ' (you)' : ''}
          </Text>
          <Text style={styles.rowSub}>
            {gameType === 'word_trails'
              ? `${item.puzzlesWon} solved${item.streakCurrent > 0 ? ` · best ${formatTime(item.streakCurrent)}` : ''}`
              : `${item.puzzlesWon}W · 🔥${item.streakCurrent}`}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.winRateText}>{item.winRate}%</Text>
          <Text style={styles.winRateLabel}>win rate</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab bar */}
      <Text style={styles.title}>{modeLabel} Leaderboard</Text>
      <View style={styles.tabBar}>
        {(['friends', 'global'] as Tab[]).map(t => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'friends' ? '👥 Friends' : '🌍 Global'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.text2} />
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{tab === 'friends' ? 'No friends yet' : 'Not enough data'}</Text>
          <Text style={styles.emptyBody}>
            {tab === 'friends' ? 'Add friends to see how you compare.' : gameType === 'word_trails' ? 'Complete a Next Steps puzzle to appear here.' : 'Play 10+ puzzles to appear on the global board.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <EntryRow item={item} />}
          ListHeaderComponent={
            tab === 'global' && myEntry ? (
              <View style={styles.myGlobalBanner}>
                <Text style={styles.myGlobalText}>Your friends rank: #{myEntry.rank} · {myEntry.winRate}% win rate</Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedEntry && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setSelectedEntry(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedEntry(null)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selectedEntry.handle}</Text>
              <Text style={styles.modalSub}>Head to Head</Text>

              {h2hLoading ? (
                <ActivityIndicator style={{ marginVertical: 24 }} color={colors.text2} />
              ) : !h2h || h2h.totalGames === 0 ? (
                <Text style={styles.modalEmpty}>No challenges played yet.{'\n'}Challenge them to get started!</Text>
              ) : (
                <>
                  <View style={styles.h2hRow}>
                    <View style={styles.h2hSide}>
                      <Text style={styles.h2hScore}>{h2h.myWins}</Text>
                      <Text style={styles.h2hLabel}>Your wins</Text>
                    </View>
                    <Text style={styles.h2hVs}>vs</Text>
                    <View style={styles.h2hSide}>
                      <Text style={styles.h2hScore}>{h2h.theirWins}</Text>
                      <Text style={styles.h2hLabel}>Their wins</Text>
                    </View>
                  </View>

                  {h2h.myCurrentStreak > 1 && (
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: colors.green }]}>
                        <Text style={styles.badgeText}>🔥 You're on a {h2h.myCurrentStreak}-win streak</Text>
                      </View>
                    </View>
                  )}
                  {h2h.iAmNemesis && (
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: colors.errorFlash }]}>
                        <Text style={styles.badgeText}>💀 They're your nemesis</Text>
                      </View>
                    </View>
                  )}
                  {h2h.theyAreNemesis && (
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, { backgroundColor: colors.purple }]}>
                        <Text style={styles.badgeText}>👑 You dominate them</Text>
                      </View>
                    </View>
                  )}

                  <Text style={styles.totalGames}>{h2h.totalGames} challenge{h2h.totalGames !== 1 ? 's' : ''} played</Text>
                </>
              )}

              <Pressable style={styles.modalClose} onPress={() => setSelectedEntry(null)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    title: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center', marginTop: 14 },
    tabBar: { flexDirection: 'row', margin: 16, marginBottom: 8, backgroundColor: c.bgBase, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
    tabActive: { backgroundColor: c.bgScreen },
    tabText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3 },
    tabTextActive: { color: c.text1, fontFamily: FONTS.extraBold },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    myGlobalBanner: { backgroundColor: c.bgBase, borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
    myGlobalText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    rowMe: { backgroundColor: c.bgBase, borderRadius: 12, paddingHorizontal: 10, marginHorizontal: -10 },
    rankText: { width: 32, textAlign: 'center', fontSize: 15, fontFamily: FONTS.extraBold, color: c.text2 },
    rowAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.tileStrip, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowInfo: { flex: 1, gap: 3 },
    rowHandle: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text1 },
    rowHandleMe: { color: c.green },
    rowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    rowRight: { alignItems: 'flex-end', gap: 2 },
    winRateText: { fontSize: 18, fontFamily: FONTS.extraBold, color: c.text1 },
    winRateLabel: { fontSize: 10, fontFamily: FONTS.bold, color: c.text3 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: FONTS.extraBold, color: c.text1 },
    emptyBody: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3, textAlign: 'center', lineHeight: 22 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: c.bgScreen, borderRadius: 20, padding: 28, width: '85%', maxWidth: 360, alignItems: 'center', gap: 8 },
    modalTitle: { fontSize: 18, fontFamily: FONTS.extraBold, color: c.text1 },
    modalSub: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3, marginBottom: 8 },
    modalEmpty: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3, textAlign: 'center', lineHeight: 22, marginVertical: 16 },
    h2hRow: { flexDirection: 'row', alignItems: 'center', gap: 24, marginVertical: 8 },
    h2hSide: { alignItems: 'center', gap: 4 },
    h2hScore: { fontSize: 42, fontFamily: FONTS.extraBold, color: c.text1 },
    h2hLabel: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    h2hVs: { fontSize: 16, fontFamily: FONTS.bold, color: c.text2 },
    badgeRow: { width: '100%', alignItems: 'center' },
    badge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    badgeText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
    totalGames: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3, marginTop: 8 },
    modalClose: { marginTop: 12, borderWidth: 1.5, borderColor: c.border, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    modalCloseText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
  });
}
