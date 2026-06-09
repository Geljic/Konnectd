import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WORD_TRAILS_PUZZLES, type WordTrailsPuzzle } from '@/data/wordTrailsPuzzles';
import { getCompletedWordTrailsIds } from '@/utils/wordTrails';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'WordlinesSelect'>;

const DIFFICULTIES = [1, 2, 3, 4, 5] as const;

export function WordlinesSelectScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [difficulty, setDifficulty] = useState<WordTrailsPuzzle['difficulty'] | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCompletedWordTrailsIds().then(setCompletedIds);
  }, []);

  const puzzles = difficulty
    ? WORD_TRAILS_PUZZLES.filter(puzzle => puzzle.difficulty === difficulty)
    : WORD_TRAILS_PUZZLES;

  const renderItem: ListRenderItem<WordTrailsPuzzle> = ({ item }) => {
    const done = completedIds.has(item.id);
    return (
      <Pressable
        style={styles.row}
        onPress={() => navigation.navigate('WordlinesGame', { mode: 'freeplay', puzzleId: item.id })}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.difficulty}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowMeta}>{item.trails.map(t => t.relation).slice(0, 3).join(' / ')}</Text>
        </View>
        {done && <View style={styles.donePill}><Text style={styles.donePillText}>Done</Text></View>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, !difficulty && styles.chipActive]} onPress={() => setDifficulty(null)}>
            <Text style={[styles.chipText, !difficulty && styles.chipTextActive]}>All</Text>
          </Pressable>
          {DIFFICULTIES.map(level => (
            <Pressable
              key={level}
              style={[styles.chip, difficulty === level && styles.chipActive]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.chipText, difficulty === level && styles.chipTextActive]}>{level}</Text>
            </Pressable>
          ))}
        </View>
        <FlatList
          data={puzzles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 16 },
    chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: { minWidth: 42, alignItems: 'center', backgroundColor: c.bgBase, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
    chipActive: { backgroundColor: c.blue },
    chipText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text2 },
    chipTextActive: { color: c.bgScreen },
    list: { paddingBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgSurface, borderRadius: 8, padding: 12, marginBottom: 8 },
    badge: { width: 34, height: 34, borderRadius: 8, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.bgScreen },
    rowContent: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowMeta: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3, textTransform: 'capitalize' },
    donePill: { backgroundColor: c.bgBase, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    donePillText: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.text2 },
  });
}
