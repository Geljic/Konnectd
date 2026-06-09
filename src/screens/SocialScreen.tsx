import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  searchUsers, fetchFriends, fetchPendingRequests,
  sendFriendRequest, acceptFriendRequest, removeFriendship, getFriendshipWith,
  type FriendUser, type Friendship,
} from '@/api/friends';
import { fetchFriendSummaries, type FriendSummary } from '@/api/social';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Friends'> };

// ─── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['yellow', 'green', 'blue', 'purple', 'tileStrip'] as const;
type AvatarPaletteKey = (typeof AVATAR_PALETTE)[number];

function avatarColor(name: string, colors: ColorTheme): string {
  const code = name.charCodeAt(0) || 0;
  const key = AVATAR_PALETTE[code % 5] as AvatarPaletteKey;
  return colors[key] as string;
}

function Avatar({ name, size = 40, colors }: { name: string; size?: number; colors: ColorTheme }) {
  const bg = avatarColor(name, colors);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontFamily: FONTS.extraBold, color: '#162219' }}>
        {name[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

// ─── Search icon ─────────────────────────────────────────────────────────────

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Path d="M12.5 12.5 L16 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Relationship badge pill ──────────────────────────────────────────────────

function RelBadge({ label, colors }: { label: string; colors: ColorTheme }) {
  let bg: string;
  let fg: string;
  switch (label) {
    case 'Best Frenemy':
      bg = colors.purple; fg = '#FFF'; break;
    case 'Frenemy':
      bg = colors.blue; fg = '#FFF'; break;
    case 'Their Nemesis':
      bg = colors.yellow; fg = '#162219'; break;
    case 'Your Nemesis':
      bg = colors.errorFlash; fg = '#FFF'; break;
    case 'New Rival':
      bg = colors.green; fg = '#162219'; break;
    default: // 'Friend'
      bg = colors.bgBase; fg = colors.text2; break;
  }
  return (
    <View style={{ backgroundColor: bg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontFamily: FONTS.extraBold, color: fg }}>{label}</Text>
    </View>
  );
}

// ─── FriendRow ────────────────────────────────────────────────────────────────

function FriendRow({
  item,
  colors,
  styles,
  onPress,
}: {
  item: FriendSummary;
  colors: ColorTheme;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar name={item.friendDisplayName} size={46} colors={colors} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.friendDisplayName}</Text>
        <Text style={styles.rowHandle}>{item.friendHandle}</Text>
      </View>
      <View style={styles.rowRight}>
        <RelBadge label={item.relationshipLabel} colors={colors} />
        <View style={styles.rowMeta}>
          {item.challengeStreak >= 2 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {item.challengeStreak}</Text>
            </View>
          )}
          {item.coStreak >= 2 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🤝 {item.coStreak}</Text>
            </View>
          )}
          {item.openChallengeId !== null && (
            <View style={styles.openDot} />
          )}
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// ─── RequestRow ───────────────────────────────────────────────────────────────

function RequestRow({
  item,
  onAccept,
  onDecline,
  colors,
  styles,
}: {
  item: Friendship;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  colors: ColorTheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.row}>
      <Avatar name={item.friend.displayName} size={46} colors={colors} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.friend.displayName}</Text>
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

// ─── SearchRow ────────────────────────────────────────────────────────────────

function SearchRow({
  user,
  onAdd,
  colors,
  styles,
}: {
  user: FriendUser;
  onAdd: (id: string) => Promise<boolean>;
  colors: ColorTheme;
  styles: ReturnType<typeof makeStyles>;
}) {
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
      <Avatar name={user.displayName} size={46} colors={colors} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{user.displayName}</Text>
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

// ─── SocialScreen ─────────────────────────────────────────────────────────────

export function SocialScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [summaries, setSummaries] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [f, r] = await Promise.all([fetchFriends(), fetchPendingRequests()]);
    setFriends(f);
    setRequests(r);
    const sums = await fetchFriendSummaries(f);
    setSummaries(sums);
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

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
    setRequests(r => r.filter(x => x.id !== id));
    load();
  }

  async function handleDecline(id: string) {
    await removeFriendship(id);
    setRequests(r => r.filter(x => x.id !== id));
  }

  const isSearching = searchQuery.trim().length > 0;

  // Build flat list data for FlatList
  type ListItem =
    | { type: 'header' }
    | { type: 'searchBar' }
    | { type: 'searchResult'; user: FriendUser }
    | { type: 'searchEmpty' }
    | { type: 'sectionHeader'; title: string }
    | { type: 'requestRow'; item: Friendship }
    | { type: 'friendRow'; item: FriendSummary }
    | { type: 'empty' };

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    items.push({ type: 'header' });

    if (showSearch) {
      items.push({ type: 'searchBar' });
      if (isSearching) {
        items.push({ type: 'sectionHeader', title: 'Search Results' });
        if (searchResults.length === 0 && !searching) {
          items.push({ type: 'searchEmpty' });
        } else {
          searchResults.forEach(u => items.push({ type: 'searchResult', user: u }));
        }
      }
    }

    if (!isSearching) {
      if (requests.length > 0) {
        items.push({ type: 'sectionHeader', title: `Friend Requests  ${requests.length}` });
        requests.forEach(r => items.push({ type: 'requestRow', item: r }));
      }
      items.push({ type: 'sectionHeader', title: `Friends  ${friends.length}` });
      if (summaries.length === 0) {
        items.push({ type: 'empty' });
      } else {
        summaries.forEach(s => items.push({ type: 'friendRow', item: s }));
      }
    }

    return items;
  }, [showSearch, isSearching, searchResults, searching, requests, friends.length, summaries]);

  function renderItem({ item }: { item: ListItem }) {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.screenHeader}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
              <Text style={styles.backBtnText}>‹</Text>
            </Pressable>
            <Text style={styles.screenTitle}>Friends</Text>
            <Pressable
              style={[styles.searchToggle, showSearch && styles.searchToggleActive]}
              onPress={() => {
                setShowSearch(v => !v);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <SearchIcon color={showSearch ? colors.bgScreen : colors.text2} />
            </Pressable>
          </View>
        );

      case 'searchBar':
        return (
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
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={colors.text2} style={{ marginLeft: 8 }} />}
          </View>
        );

      case 'searchResult':
        return <SearchRow user={item.user} onAdd={handleAdd} colors={colors} styles={styles} />;

      case 'searchEmpty':
        return <Text style={styles.empty}>No users found.</Text>;

      case 'sectionHeader':
        return <Text style={styles.sectionHeader}>{item.title}</Text>;

      case 'requestRow':
        return (
          <RequestRow
            item={item.item}
            onAccept={handleAccept}
            onDecline={handleDecline}
            colors={colors}
            styles={styles}
          />
        );

      case 'friendRow': {
        const s = item.item;
        return (
          <FriendRow
            item={s}
            colors={colors}
            styles={styles}
            onPress={() =>
              navigation.navigate('FriendDetail', {
                friendshipId: s.friendshipId,
                friendId: s.friendId,
                friendHandle: s.friendHandle,
                friendDisplayName: s.friendDisplayName,
              })
            }
          />
        );
      }

      case 'empty':
        return (
          <Text style={styles.empty}>
            Add friends to start challenging each other!
          </Text>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.text2} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, idx) => {
          if (item.type === 'searchResult') return `search-${item.user.id}`;
          if (item.type === 'requestRow') return `req-${item.item.id}`;
          if (item.type === 'friendRow') return `friend-${item.item.friendId}`;
          return `${item.type}-${idx}`;
        }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text3} />
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backBtnText: { fontSize: 32, color: c.text1, fontFamily: FONTS.bold, lineHeight: 36 },
    screenTitle: { flex: 1, fontSize: 26, fontFamily: FONTS.extraBold, color: c.text1 },
    searchToggle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.bgBase,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchToggleActive: { backgroundColor: c.text1 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: c.bgSurface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 14,
    },
    searchInput: { flex: 1, height: 44, fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    sectionHeader: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: c.text2,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
    },
    empty: {
      textAlign: 'center',
      color: c.text3,
      fontFamily: FONTS.bold,
      fontSize: 14,
      marginTop: 24,
      lineHeight: 22,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    rowInfo: { flex: 1, gap: 2 },
    rowName: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowHandle: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    rowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    rowRight: { alignItems: 'flex-end', gap: 4 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    streakPill: {
      backgroundColor: c.bgBase,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    streakText: { fontSize: 11, fontFamily: FONTS.bold, color: c.text2 },
    openDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.errorFlash,
    },
    chevron: { fontSize: 22, color: c.text3, fontFamily: FONTS.bold, marginLeft: 4 },
    rowActions: { flexDirection: 'row', gap: 8 },
    acceptBtn: { backgroundColor: c.green, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    acceptBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#162219' },
    declineBtn: { borderWidth: 1.5, borderColor: c.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
    declineBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    addBtn: { backgroundColor: c.text1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
    addBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.bgScreen },
    alreadyText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
  });
}
