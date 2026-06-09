import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchMyChallenges, isMine, isExpired, type Challenge } from '@/api/challenges';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'ChallengesInbox'>;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function ChallengesInboxScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchMyChallenges().then(c => {
      setChallenges(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, []);

  function handlePress(item: Challenge) {
    if (item.status === 'complete') {
      navigation.navigate('ChallengeResult', { challengeId: item.id });
    } else {
      navigation.navigate('Challenge', { challengeId: item.id });
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.text2} />
      </SafeAreaView>
    );
  }

  function ChallengeRow({ item }: { item: Challenge }) {
    const mine = isMine(item);
    const expired = isExpired(item);
    const complete = item.status === 'complete';

    let statusLabel = '';
    let statusColor = colors.text3;
    if (complete) { statusLabel = '✓ Complete'; statusColor = colors.green; }
    else if (expired) { statusLabel = 'Expired'; statusColor = colors.text3; }
    else if (mine) { statusLabel = '⏳ Waiting'; statusColor = colors.yellow; }
    else { statusLabel = '⚡ Play Now'; statusColor = colors.purple; }

    return (
      <Pressable style={styles.row} onPress={() => handlePress(item)}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>
            {mine ? `You → ${item.opponentName ?? 'waiting…'}` : `${item.challengerName} → You`}
          </Text>
          <Text style={styles.rowSub}>{item.puzzleLabel} · {formatDate(item.created)}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          {complete && (
            <Text style={styles.rowTime}>{formatTime(mine ? item.challengerDuration : item.opponentDuration ?? 0)}</Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={challenges}
        keyExtractor={c => c.id}
        renderItem={({ item }) => <ChallengeRow item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚡</Text>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptySub}>Complete a puzzle and challenge a friend to beat your score!</Text>
          </View>
        }
        ListHeaderComponent={
          challenges.length > 0 ? (
            <Text style={styles.header}>
              {challenges.filter(c => c.status === 'pending' && !isMine(c) && !isExpired(c)).length > 0
                ? `${challenges.filter(c => c.status === 'pending' && !isMine(c) && !isExpired(c)).length} waiting for you`
                : 'All challenges'}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    list: { padding: 20, paddingBottom: 40 },
    header: { fontSize: 14, fontFamily: FONTS.bold, color: c.text3, marginBottom: 12 },
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    rowLeft: { flex: 1, gap: 3 },
    rowTitle: { fontSize: 15, fontFamily: FONTS.bold, color: c.text1 },
    rowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    rowRight: { alignItems: 'flex-end', gap: 2 },
    statusLabel: { fontSize: 13, fontFamily: FONTS.extraBold },
    rowTime: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1 },
    emptySub: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center', paddingHorizontal: 20 },
  });
}
