import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ListRenderItem, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WORD_TRAILS_PUZZLES, type WordTrailsPuzzle } from '@/data/wordTrailsPuzzles';
import { getCompletedWordTrailsIds, getWordTrailsResult } from '@/utils/wordTrails';
import { GameResultModal } from '@/components/GameResultModal';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'WordlinesSelect'>;

const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
type SortMode = 'title_asc' | 'diff_asc' | 'diff_desc';

const DIFFICULTY_LABELS: Record<WordTrailsPuzzle['difficulty'], string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Expert',
  5: 'Master',
};

const SORT_CYCLE: SortMode[] = ['title_asc', 'diff_asc', 'diff_desc'];
const SORT_LABELS: Record<SortMode, string> = {
  title_asc: 'A-Z',
  diff_asc: '↑ Easiest',
  diff_desc: '↓ Hardest',
};

const DIFFICULTY_COLOURS = (c: ColorTheme) => ({
  1: c.yellow,
  2: c.green,
  3: c.blue,
  4: c.purple,
  5: c.purple,
} as Record<number, string>);

export function WordlinesSelectScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const difficultyColours = useMemo(() => DIFFICULTY_COLOURS(colors), [colors]);
  const [difficulty, setDifficulty] = useState<WordTrailsPuzzle['difficulty'] | null>(null);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('title_asc');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [modalPuzzle, setModalPuzzle] = useState<{ id: string; title: string; result: { durationSeconds: number; mistakes: number } } | null>(null);

  useEffect(() => {
    getCompletedWordTrailsIds().then(setCompletedIds);
  }, []);

  const puzzles = WORD_TRAILS_PUZZLES
    .filter(puzzle => !difficulty || puzzle.difficulty === difficulty)
    .filter(puzzle => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        puzzle.title.toLowerCase().includes(q) ||
        puzzle.trails.some(trail =>
          trail.label.toLowerCase().includes(q) ||
          trail.relation.toLowerCase().includes(q) ||
          trail.words.some(word => word.toLowerCase().includes(q))
        )
      );
    })
    .sort((a, b) => {
      if (sortMode === 'diff_asc') return a.difficulty - b.difficulty || a.title.localeCompare(b.title);
      if (sortMode === 'diff_desc') return b.difficulty - a.difficulty || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });

  async function openPuzzle(item: WordTrailsPuzzle) {
    if (completedIds.has(item.id)) {
      const result = await getWordTrailsResult(item.id);
      if (result?.completed) {
        setModalPuzzle({
          id: item.id,
          title: item.title,
          result: { durationSeconds: result.durationSeconds, mistakes: result.mistakes },
        });
        return;
      }
    }
    navigation.navigate('WordlinesGame', { mode: 'freeplay', puzzleId: item.id });
  }

  function cycleSortMode() {
    setSortMode(SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length]);
  }

  const renderItem: ListRenderItem<WordTrailsPuzzle> = ({ item }) => {
    const done = completedIds.has(item.id);
    return (
      <Pressable
        style={styles.row}
        onPress={() => openPuzzle(item)}
      >
        <View style={[styles.badge, { backgroundColor: difficultyColours[item.difficulty] }]}>
          <Text style={styles.badgeText}>{DIFFICULTY_LABELS[item.difficulty]}</Text>
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
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable style={styles.sortBtn} onPress={cycleSortMode}>
            <Text style={styles.sortBtnText}>{SORT_LABELS[sortMode]}</Text>
          </Pressable>
        </View>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, !difficulty && styles.chipActive]} onPress={() => setDifficulty(null)}>
            <Text style={[styles.chipText, !difficulty && styles.chipTextActive]}>All</Text>
          </Pressable>
          {DIFFICULTIES.map(level => (
            <Pressable
              key={level}
              style={[styles.chip, difficulty === level && { backgroundColor: difficultyColours[level] }]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.chipText, difficulty === level && styles.chipTextActive]}>{DIFFICULTY_LABELS[level]}</Text>
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
      <GameResultModal
        visible={!!modalPuzzle}
        label={modalPuzzle ? `Next Steps · ${modalPuzzle.title}` : ''}
        preloadedResult={modalPuzzle?.result ?? null}
        gameMode="classic"
        onClose={() => setModalPuzzle(null)}
        onPlayAgain={() => {
          const id = modalPuzzle?.id;
          setModalPuzzle(null);
          if (id) navigation.navigate('WordlinesGame', { mode: 'freeplay', puzzleId: id });
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1, padding: 16 },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    searchInput: {
      flex: 1,
      backgroundColor: c.bgSurface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: c.text1,
    },
    sortBtn: { backgroundColor: c.bgBase, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
    sortBtnText: { fontSize: 12, fontFamily: FONTS.extraBold, color: c.text2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { minWidth: 42, alignItems: 'center', backgroundColor: c.bgBase, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
    chipActive: { backgroundColor: c.blue },
    chipText: { fontSize: 13, fontFamily: FONTS.extraBold, color: c.text2 },
    chipTextActive: { color: c.bgScreen },
    list: { paddingBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bgSurface, borderRadius: 8, padding: 12, marginBottom: 8 },
    badge: { minWidth: 70, height: 34, borderRadius: 8, backgroundColor: c.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    badgeText: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.categoryText },
    rowContent: { flex: 1, gap: 2 },
    rowTitle: { fontSize: 15, fontFamily: FONTS.extraBold, color: c.text1 },
    rowMeta: { fontSize: 11, fontFamily: FONTS.bold, color: c.text3, textTransform: 'capitalize' },
    donePill: { backgroundColor: c.bgBase, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    donePillText: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.text2 },
  });
}
