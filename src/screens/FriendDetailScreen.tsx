import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { fetchMatchHistory, type ChallengeMatch } from '@/api/social';
import { fetchActiveChallengesWithFriend, subscribeToChallengeChanges, type Challenge } from '@/api/challenges';
import { removeFriendship } from '@/api/friends';
import pb from '@/api/pb';
import type { AppStackParamList } from '../App';
import { GAME_TYPE_LABELS, RULESET_LABELS } from '@/constants/gameModes';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'FriendDetail'>;
  route: RouteProp<AppStackParamList, 'FriendDetail'>;
};

// ─── Avatar (standalone, no shared state needed) ─────────────────────────────

const AVATAR_PALETTE = ['yellow', 'green', 'blue', 'purple', 'tileStrip'] as const;
type AvatarPaletteKey = (typeof AVATAR_PALETTE)[number];

function avatarBg(name: string, colors: ColorTheme): string {
  const code = name.charCodeAt(0) || 0;
  const key = AVATAR_PALETTE[code % 5] as AvatarPaletteKey;
  return colors[key] as string;
}

function Avatar({ name, size, colors }: { name: string; size: number; colors: ColorTheme }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: avatarBg(name, colors),
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

// ─── MatchRow ────────────────────────────────────────────────────────────────

function MatchRow({ match, matchNumber, styles, colors }: { match: ChallengeMatch; matchNumber: number; styles: ReturnType<typeof makeStyles>; colors: ColorTheme }) {
  const dateStr = useMemo(() => {
    const d = new Date(match.created);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, [match.created]);

  let winBadgeBg: string;
  let winBadgeFg: string;
  let winBadgeLabel: string;
  let winBadgeBorder: boolean = false;

  if (match.iWon === true) {
    winBadgeBg = colors.green;
    winBadgeFg = '#162219';
    winBadgeLabel = '🏆 You won';
  } else if (match.iWon === false) {
    winBadgeBg = colors.purple;
    winBadgeFg = '#FFF';
    winBadgeLabel = '💀 They won';
  } else {
    winBadgeBg = 'transparent';
    winBadgeFg = colors.text2;
    winBadgeLabel = '🤝 Tie';
    winBadgeBorder = true;
  }

  const myScoreStr = match.myScore !== null ? `${match.myScore}pts · ` : '';
  const theirScoreStr = match.theirScore !== null ? `${match.theirScore}pts · ` : '';
  const myMistakeStr = match.myMistakes === 1 ? '1 mistake' : `${match.myMistakes} mistakes`;
  const theirMistakeStr = match.theirMistakes === 1 ? '1 mistake' : `${match.theirMistakes} mistakes`;
  const modeLabel = match.gameType === 'connections'
    ? `${GAME_TYPE_LABELS.connections} · ${RULESET_LABELS[match.gameMode]}`
    : GAME_TYPE_LABELS[match.gameType];

  return (
    <View style={styles.matchRow}>
      <View style={styles.matchRowTop}>
        <Text style={styles.matchPuzzleLabel} numberOfLines={1}>{match.puzzleLabel}</Text>
        <Text style={styles.matchDate}>#{matchNumber} · {dateStr}</Text>
      </View>
      <View style={styles.matchRowMid}>
        <Text style={styles.matchStat}>You: {myScoreStr}{myMistakeStr}</Text>
        <Text style={styles.matchVs}>vs</Text>
        <Text style={styles.matchStat}>Them: {theirScoreStr}{theirMistakeStr}</Text>
      </View>
      <View style={styles.matchRowBottom}>
        <View style={[styles.modePill, { backgroundColor: match.gameType === 'connections' ? colors.green : colors.blue }]}>
          <Text style={styles.modePillText}>{modeLabel}</Text>
        </View>
        <View
          style={[
            styles.winBadge,
            { backgroundColor: winBadgeBg },
            winBadgeBorder && styles.winBadgeBorder,
          ]}
        >
          <Text style={[styles.winBadgeText, { color: winBadgeFg }]}>{winBadgeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── FriendDetailScreen ───────────────────────────────────────────────────────

export function FriendDetailScreen({ navigation, route }: Props) {
  const { friendshipId, friendId, friendHandle, friendDisplayName } = route.params;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const CHALLENGE_LIMIT = 5;

  const [matches, setMatches] = useState<ChallengeMatch[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const myId = pb.authStore.model?.id as string | undefined;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let unsubscribe: (() => void) | undefined;
      async function loadData(showSpinner = true) {
        if (showSpinner) setLoading(true);
        const [history, challenges] = await Promise.all([
          fetchMatchHistory(friendId),
          fetchActiveChallengesWithFriend(friendId),
        ]);
        if (!cancelled) {
          setMatches(history);
          setActiveChallenges(challenges);
          setLoading(false);
        }
      }
      loadData();
      subscribeToChallengeChanges(() => loadData(false)).then(fn => {
        if (cancelled) fn();
        else unsubscribe = fn;
      });
      const interval = setInterval(() => loadData(false), 10000);
      return () => {
        cancelled = true;
        unsubscribe?.();
        clearInterval(interval);
      };
    }, [friendId]),
  );

  const totalGames = matches.length;
  const myWins = matches.filter(m => m.iWon === true).length;
  const myLosses = matches.filter(m => m.iWon === false).length;

  async function handleRemoveFriend() {
    Alert.alert(
      'Remove Friend',
      `Remove ${friendDisplayName} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriendship(friendshipId);
            navigation.goBack();
          },
        },
      ],
    );
  }

  const atLimit = activeChallenges.length >= CHALLENGE_LIMIT;

  type ListItem =
    | { type: 'profile' }
    | { type: 'challengesHeader' }
    | { type: 'activeChallenge'; challenge: Challenge }
    | { type: 'newChallengeBtn' }
    | { type: 'matchesHeader' }
    | { type: 'match'; match: ChallengeMatch; matchNumber: number }
    | { type: 'emptyMatches' }
    | { type: 'removeBtn' };

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    items.push({ type: 'profile' });
    items.push({ type: 'challengesHeader' });
    activeChallenges.forEach((c: Challenge) => items.push({ type: 'activeChallenge', challenge: c }));
    items.push({ type: 'newChallengeBtn' });
    items.push({ type: 'matchesHeader' });
    if (matches.length === 0) {
      items.push({ type: 'emptyMatches' });
    } else {
      matches.forEach((m: ChallengeMatch, i: number) => items.push({ type: 'match', match: m, matchNumber: matches.length - i }));
    }
    items.push({ type: 'removeBtn' });
    return items;
  }, [activeChallenges, matches]);

  function renderItem({ item }: { item: ListItem }) {
    switch (item.type) {
      case 'profile':
        return (
          <View style={styles.profileCard}>
            <Avatar name={friendDisplayName} size={64} colors={colors} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{friendDisplayName}</Text>
              <Text style={styles.profileHandle}>{friendHandle}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {totalGames} game{totalGames !== 1 ? 's' : ''}
                {'  ·  '}
                {myWins} win{myWins !== 1 ? 's' : ''}
                {'  ·  '}
                {myLosses} loss{myLosses !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>
        );

      case 'challengesHeader':
        return (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Active Challenges</Text>
            <Text style={styles.challengeCount}>{activeChallenges.length}/{CHALLENGE_LIMIT}</Text>
          </View>
        );

      case 'activeChallenge': {
        const c = item.challenge;
        const isMyChallenge = c.challenger === myId;
        const statusLabel = isMyChallenge ? 'Waiting for them…' : 'Your turn! ⚡';
        const statusColor = isMyChallenge ? colors.text3 : colors.green;
        const dateStr = new Date(c.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const modeLabel = c.gameType === 'connections'
          ? `${GAME_TYPE_LABELS.connections} · ${RULESET_LABELS[c.gameMode]}`
          : GAME_TYPE_LABELS[c.gameType];
        return (
          <Pressable
            style={styles.activeChallengeRow}
            onPress={() => navigation.navigate('Challenge', { challengeId: c.id })}
          >
            <View style={styles.activeChallengeInfo}>
              <Text style={styles.activeChallengeLabel} numberOfLines={1}>{c.puzzleLabel}</Text>
              <Text style={styles.activeChallengeMode}>{modeLabel}</Text>
              <Text style={[styles.activeChallengeStatus, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.activeChallengeDate}>{dateStr} →</Text>
          </Pressable>
        );
      }

      case 'newChallengeBtn':
        return atLimit ? (
          <Text style={styles.limitHint}>
            5/5 active challenges — finish one to send more
          </Text>
        ) : (
          <Pressable
            style={styles.newChallengeBtn}
            onPress={() => navigation.navigate('PuzzleSelect', {
              recipientId: friendId,
              recipientName: friendDisplayName,
            })}
          >
            <Text style={styles.newChallengeBtnText}>+ New Challenge</Text>
          </Pressable>
        );

      case 'matchesHeader':
        return <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Match History</Text>;

      case 'match':
        return <MatchRow match={item.match} matchNumber={item.matchNumber} styles={styles} colors={colors} />;

      case 'emptyMatches':
        return (
          <Text style={styles.emptyText}>
            No completed matches yet — win a puzzle and challenge them from the result screen!
          </Text>
        );

      case 'removeBtn':
        return (
          <Pressable style={styles.removeBtn} onPress={handleRemoveFriend}>
            <Text style={styles.removeBtnText}>Remove Friend</Text>
          </Pressable>
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
          if (item.type === 'match') return `match-${item.match.id}`;
          return `${item.type}-${idx}`;
        }}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    list: { paddingHorizontal: 16, paddingBottom: 40 },

    profileCard: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 16,
      gap: 8,
    },
    profileInfo: { alignItems: 'center', gap: 2 },
    profileName: { fontSize: 22, fontFamily: FONTS.extraBold, color: c.text1 },
    profileHandle: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3 },
    statsRow: { marginTop: 4 },
    statsText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },

    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    challengeCount: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: c.text3,
    },

    activeChallengeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgSurface,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      gap: 12,
    },
    activeChallengeInfo: { flex: 1, gap: 3 },
    activeChallengeLabel: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    activeChallengeMode: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3 },
    activeChallengeStatus: { fontSize: 12, fontFamily: FONTS.bold },
    activeChallengeDate: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },

    newChallengeBtn: {
      borderWidth: 1.5,
      borderColor: c.purple,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    newChallengeBtnText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.purple },

    limitHint: {
      textAlign: 'center',
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: c.text3,
      marginTop: 4,
      marginBottom: 4,
    },

    sectionHeader: {
      fontSize: 13,
      fontFamily: FONTS.extraBold,
      color: c.text2,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
    },

    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: c.text3,
      marginTop: 16,
      lineHeight: 22,
    },

    matchRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 6,
    },
    matchRowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    matchPuzzleLabel: {
      flex: 1,
      fontSize: 15,
      fontFamily: FONTS.extraBold,
      color: c.text1,
    },
    matchDate: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: c.text3,
      marginLeft: 8,
    },
    matchRowMid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    matchStat: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: c.text2,
    },
    matchVs: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: c.text3,
    },
    matchRowBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    modePillText: { fontSize: 11, fontFamily: FONTS.extraBold, color: '#162219' },
    winBadge: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    winBadgeBorder: {
      borderWidth: 1.5,
      borderColor: 'rgba(120,160,140,0.4)',
    },
    winBadgeText: {
      fontSize: 12,
      fontFamily: FONTS.extraBold,
    },

    removeBtn: {
      marginTop: 32,
      borderWidth: 1.5,
      borderColor: c.errorFlash,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
    },
    removeBtnText: {
      fontSize: 15,
      fontFamily: FONTS.extraBold,
      color: c.errorFlash,
    },
  });
}
