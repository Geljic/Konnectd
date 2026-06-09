import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  searchUsers, fetchFriends, fetchPendingRequests,
  sendFriendRequest, acceptFriendRequest, removeFriendship, getFriendshipWith,
  type FriendUser, type Friendship,
} from '@/api/friends';
import { fetchPendingChallengesForMe, isExpired, type Challenge } from '@/api/challenges';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Friends'> };

function Avatar({ name, size = 40, bgColor }: { name: string; size?: number; bgColor: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontFamily: FONTS.extraBold, color: '#162219' }}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

function FriendRow({ item, onRemove, colors }: { item: Friendship; onRemove: (id: string) => void; colors: ColorTheme }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  function confirmRemove() {
    Alert.alert('Remove Friend', `Remove ${item.friend.handle}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
    ]);
  }
  return (
    <View style={styles.row}>
      <Avatar name={item.friend.displayName} bgColor={colors.tileStrip} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowHandle}>{item.friend.handle}</Text>
        <Text style={styles.rowSub}>🔥 {item.friend.streakCurrent} streak · {item.friend.puzzlesWon} wins</Text>
      </View>
      <Pressable style={styles.removeBtn} onPress={confirmRemove}>
        <Text style={styles.removeBtnText}>Remove</Text>
      </Pressable>
    </View>
  );
}

function RequestRow({ item, onAccept, onDecline, colors }: { item: Friendship; onAccept: (id: string) => void; onDecline: (id: string) => void; colors: ColorTheme }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Avatar name={item.friend.displayName} bgColor={colors.yellow} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowHandle}>{item.friend.handle}</Text>
        <Text style={styles.rowSub}>Wants to be friends</Text>
      </View>
      <View style={styles.rowActions}>
        <Pressable style={styles.acceptBtn} onPress={() => onAccept(item.id)}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </Pressable>
        <Pressable style={styles.declineBtn} onPress={() => onDecline(item.id)}>
          <Text style={styles.declineBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SearchRow({ user, onAdd, colors }: { user: FriendUser; onAdd: (id: string) => Promise<boolean>; colors: ColorTheme }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'already'>('idle');

  useEffect(() => {
    getFriendshipWith(user.id).then(f => {
      if (f) setStatus(f.status === 'accepted' ? 'already' : 'sent');
    });
  }, [user.id]);

  async function handleAdd() {
    setStatus('loading');
    const ok = await onAdd(user.id);
    setStatus(ok ? 'sent' : 'idle');
  }

  return (
    <View style={styles.row}>
      <Avatar name={user.displayName} bgColor={colors.blue} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowHandle}>{user.handle}</Text>
        <Text style={styles.rowSub}>{user.puzzlesWon} wins · 🔥 {user.streakCurrent}</Text>
      </View>
      {status === 'already' ? (
        <Text style={styles.alreadyText}>Friends</Text>
      ) : status === 'sent' ? (
        <Text style={styles.alreadyText}>Requested</Text>
      ) : status === 'loading' ? (
        <ActivityIndicator size="small" color={colors.text2} />
      ) : (
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      )}
    </View>
  );
}

export function FriendsScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    setLoading(true);
    const [f, r, c] = await Promise.all([fetchFriends(), fetchPendingRequests(), fetchPendingChallengesForMe()]);
    setFriends(f);
    setRequests(r);
    setPendingChallenges(c.filter(ch => !isExpired(ch)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(text.trim());
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }

  async function handleAdd(userId: string): Promise<boolean> {
    return sendFriendRequest(userId);
  }

  async function handleAccept(id: string) {
    await acceptFriendRequest(id);
    load();
  }

  async function handleDecline(id: string) {
    await removeFriendship(id);
    setRequests(r => r.filter(x => x.id !== id));
  }

  async function handleRemove(id: string) {
    await removeFriendship(id);
    setFriends(f => f.filter(x => x.id !== id));
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Pressable style={styles.leaderboardBtn} onPress={() => navigation.navigate('Leaderboard')}>
        <Text style={styles.leaderboardBtnText}>🏆 View Leaderboard</Text>
        <Text style={styles.leaderboardArrow}>›</Text>
      </Pressable>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or Name#1234"
          placeholderTextColor={colors.text3}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searching && <ActivityIndicator size="small" color={colors.text2} style={{ marginLeft: 8 }} />}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text2} />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => ''}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {isSearching && (
                <>
                  <Text style={styles.sectionHeader}>Search Results</Text>
                  {searchResults.length === 0 && !searching ? (
                    <Text style={styles.empty}>No users found.</Text>
                  ) : (
                    searchResults.map(u => <SearchRow key={u.id} user={u} onAdd={handleAdd} colors={colors} />)
                  )}
                </>
              )}

              {!isSearching && pendingChallenges.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>
                    Challenges<Text style={styles.sectionCount}> {pendingChallenges.length}</Text>
                  </Text>
                  {pendingChallenges.map(ch => (
                    <Pressable
                      key={ch.id}
                      style={styles.challengeRow}
                      onPress={() => navigation.navigate('Challenge', { challengeId: ch.id })}
                    >
                      <View style={styles.challengeRowLeft}>
                        <Text style={styles.challengeRowTitle}>⚡ {ch.challengerName}</Text>
                        <Text style={styles.challengeRowSub}>{ch.puzzleLabel}</Text>
                      </View>
                      <View style={styles.challengePlayBtn}>
                        <Text style={styles.challengePlayBtnText}>Play</Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}

              {!isSearching && requests.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>
                    Friend Requests<Text style={styles.sectionCount}> {requests.length}</Text>
                  </Text>
                  {requests.map(r => <RequestRow key={r.id} item={r} onAccept={handleAccept} onDecline={handleDecline} colors={colors} />)}
                </>
              )}

              {!isSearching && (
                <>
                  <Text style={styles.sectionHeader}>
                    Friends<Text style={styles.sectionCount}> {friends.length}</Text>
                  </Text>
                  {friends.length === 0 ? (
                    <Text style={styles.empty}>No friends yet.{'\n'}Search by username above to add someone!</Text>
                  ) : (
                    friends.map(f => <FriendRow key={f.id} item={f} onRemove={handleRemove} colors={colors} />)
                  )}
                </>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    leaderboardBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: 16, marginTop: 12, marginBottom: 4,
      backgroundColor: c.bgBase, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 13,
    },
    leaderboardBtnText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    leaderboardArrow: { fontSize: 22, color: c.text3, fontFamily: FONTS.bold },
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      margin: 16, marginBottom: 8,
      backgroundColor: c.bgSurface,
      borderRadius: 12, borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 14,
    },
    searchInput: { flex: 1, height: 44, fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    sectionHeader: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text2, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
    sectionCount: { color: c.text3 },
    empty: { textAlign: 'center', color: c.text3, fontFamily: FONTS.bold, fontSize: 14, marginTop: 16, lineHeight: 22 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 },
    rowInfo: { flex: 1, gap: 3 },
    rowHandle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowSub: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    rowActions: { flexDirection: 'row', gap: 8 },
    addBtn: { backgroundColor: c.text1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
    addBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
    alreadyText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    acceptBtn: { backgroundColor: c.green, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    acceptBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
    declineBtn: { borderWidth: 1.5, borderColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
    declineBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    removeBtn: { borderWidth: 1.5, borderColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    removeBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2 },
    challengeRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    challengeRowLeft: { flex: 1, gap: 3 },
    challengeRowTitle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    challengeRowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    challengePlayBtn: { backgroundColor: '#E8903A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    challengePlayBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
  });
}
