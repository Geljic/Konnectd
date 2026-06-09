import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { fetchFriends, type Friendship } from '@/api/friends';
import { createChallenge } from '@/api/challenges';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useGameStore } from '@/store/gameStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onChallengeSent: (friendHandle: string) => void;
}

function Avatar({ name, bgColor, size = 40 }: { name: string; bgColor: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontFamily: FONTS.extraBold, color: '#162219' }}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

export function FriendPickerModal({ visible, onClose, onChallengeSent }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { puzzle, currentPuzzleId, currentCollection, mistakes, solvedOrder, startTime, score } = useGameStore();

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null); // friendId being challenged

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchFriends().then(f => {
      setFriends(f);
      setLoading(false);
    });
  }, [visible]);

  async function handleChallenge(friendship: Friendship) {
    if (!currentPuzzleId || !currentCollection || !puzzle) return;
    setSending(friendship.friend.id);

    const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const nytDate = puzzle?.daily_date
      ? new Date(puzzle.daily_date + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;
    const label = currentCollection === 'nyt_puzzles'
      ? `NYT Puzzle${nytDate ? ` · ${nytDate}` : ''}`
      : `Curated Puzzle`;

    const challenge = await createChallenge({
      puzzleId: currentPuzzleId,
      puzzleCollection: currentCollection,
      puzzleLabel: label,
      mistakes,
      durationSeconds: duration,
      solvedOrder,
      score: score ?? undefined,
      recipientId: friendship.friend.id,
    });

    setSending(null);
    if (challenge) {
      onChallengeSent(friendship.friend.handle);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Challenge a Friend</Text>
        <Text style={styles.subtitle}>Pick who you want to challenge</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.text2} />
        ) : friends.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No friends yet.{'\n'}Add friends from the Friends screen first!</Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={f => f.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isSending = sending === item.friend.id;
              const done = sending !== null && !isSending;
              return (
                <View style={styles.row}>
                  <Avatar name={item.friend.displayName} bgColor={colors.tileStrip} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowHandle}>{item.friend.handle}</Text>
                    <Text style={styles.rowSub}>🔥 {item.friend.streakCurrent} streak · {item.friend.puzzlesWon} wins</Text>
                  </View>
                  <Pressable
                    style={[styles.challengeBtn, done && styles.challengeBtnDisabled]}
                    onPress={() => handleChallenge(item)}
                    disabled={sending !== null}
                  >
                    {isSending
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={styles.challengeBtnText}>⚡ Challenge</Text>
                    }
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: c.bgScreen,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 36,
      maxHeight: '75%',
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center', marginTop: 12, marginBottom: 20,
    },
    title: { fontSize: 20, fontFamily: FONTS.extraBold, color: c.text1, textAlign: 'center' },
    subtitle: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center', marginTop: 4, marginBottom: 20 },
    list: { paddingBottom: 12 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    rowInfo: { flex: 1, gap: 3 },
    rowHandle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowSub: { fontSize: 12, fontFamily: FONTS.bold, color: c.text3 },
    challengeBtn: {
      backgroundColor: '#E8903A', borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 8, minWidth: 100, alignItems: 'center',
    },
    challengeBtnDisabled: { opacity: 0.4 },
    challengeBtnText: { fontSize: 13, fontFamily: FONTS.extraBold, color: '#FFF' },
    empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
    emptyEmoji: { fontSize: 40 },
    emptyText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center', lineHeight: 22 },
    cancelBtn: {
      marginTop: 16, borderWidth: 1.5, borderColor: c.border,
      borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
  });
}
