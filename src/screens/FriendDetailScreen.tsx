import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { fetchMatchHistory, type ChallengeMatch } from '@/api/social';
import { fetchMyChallenges } from '@/api/challenges';
import { removeFriendship } from '@/api/friends';
import pb from '@/api/pb';
import type { AppStackParamList } from '../App';

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

function MatchRow({ match, styles, colors }: { match: ChallengeMatch; styles: ReturnType<typeof makeStyles>; colors: ColorTheme }) {
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

  return (
    <View style={styles.matchRow}>
      <View style={styles.matchRowTop}>
        <Text style={styles.matchPuzzleLabel} numberOfLines={1}>{match.puzzleLabel}</Text>
        <Text style={styles.matchDate}>{dateStr}</Text>
      </View>
      <View style={styles.matchRowMid}>
        <Text style={styles.matchStat}>You: {myScoreStr}{myMistakeStr}</Text>
        <Text style={styles.matchVs}>vs</Text>
        <Text style={styles.matchStat}>Them: {theirScoreStr}{theirMistakeStr}</Text>
      </View>
      <View style={styles.matchRowBottom}>
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

  const [matches, setMatches] = useState<ChallengeMatch[]>([]);
  const [openChallengeId, setOpenChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const myId = pb.authStore.model?.id as string | undefined;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [history, challenges] = await Promise.all([
        fetchMatchHistory(friendId),
        fetchMyChallenges(),
      ]);
      setMatches(history);

      // Find open challenge with this friend
      const open = challenges.find(c => {
        const involves =
          (c.challenger === myId && c.opponent === friendId) ||
          (c.challenger === friendId && c.opponent === myId);
        return involves && c.status !== 'complete';
      });
      setOpenChallengeId(open ? open.id : null);
      setLoading(false);
    }
    loadData();
  }, [friendId, myId]);

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

  type ListItem =
    | { type: 'profile' }
    | { type: 'openChallenge' }
    | { type: 'noChallenge' }
    | { type: 'sectionHeader' }
    | { type: 'match'; match: ChallengeMatch }
    | { type: 'emptyMatches' }
    | { type: 'removeBtn' };

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    items.push({ type: 'profile' });
    if (openChallengeId) {
      items.push({ type: 'openChallenge' });
    } else {
      items.push({ type: 'noChallenge' });
    }
    items.push({ type: 'sectionHeader' });
    if (matches.length === 0) {
      items.push({ type: 'emptyMatches' });
    } else {
      matches.forEach(m => items.push({ type: 'match', match: m }));
    }
    items.push({ type: 'removeBtn' });
    return items;
  }, [openChallengeId, matches]);

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

      case 'openChallenge':
        return (
          <Pressable
            style={styles.openChallengeBtn}
            onPress={() => navigation.navigate('Challenge', { challengeId: openChallengeId! })}
          >
            <Text style={styles.openChallengeBtnText}>⚡ Open Challenge →</Text>
          </Pressable>
        );

      case 'noChallenge':
        return (
          <Text style={styles.noChallengeHint}>
            Win a puzzle to send them a challenge ⚡
          </Text>
        );

      case 'sectionHeader':
        return <Text style={styles.sectionHeader}>Match History</Text>;

      case 'match':
        return <MatchRow match={item.match} styles={styles} colors={colors} />;

      case 'emptyMatches':
        return (
          <Text style={styles.emptyText}>
            No matches yet — win a puzzle and challenge them from the result screen!
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

    openChallengeBtn: {
      backgroundColor: c.purple,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginVertical: 8,
    },
    openChallengeBtnText: { fontSize: 16, fontFamily: FONTS.extraBold, color: '#FFF' },

    noChallengeHint: {
      textAlign: 'center',
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: c.text3,
      marginVertical: 12,
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
    },
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
