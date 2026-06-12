import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, ListRenderItem, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { CATEGORY_COLOURS, type CategoryColour, CATEGORY_ORDER, type ColorTheme } from '@/constants/colors';
import {
  fetchPuzzlesPage, fetchDailyPuzzlesPage, fetchNytPuzzlesPage, getCompletedPuzzleIds,
  type PuzzleListItem, type DailyPuzzleListItem, type NytPuzzleListItem, type PuzzleSortMode,
  type PuzzleSource,
} from '@/api/puzzles';
import { GameResultModal } from '@/components/GameResultModal';
import { AdBanner } from '@/components/BannerAd';
import { useAuthStore } from '@/store/authStore';
import { FONTS } from '@/constants/fonts';
import { getNextSteps, loadNextSteps } from '@/api/nextSteps';
import { getCompletedNextStepsIds, getDailyNextStepsPuzzle } from '@/utils/nextSteps';
import {
  getCompletedCrossedSignalsIds,
  getCrossedSignalsPuzzles,
  getDailyCrossedSignalsPuzzle,
} from '@/utils/crossedSignals';
import type { AppStackParamList } from '../App';

type Props = NativeStackScreenProps<AppStackParamList, 'PuzzleSelect'>;
type Collection = 'generated' | 'daily' | 'nyt';
type DailyMode = 'groups' | 'word_trails' | 'crossed_signals';
type DailyArchiveItem = {
  id: string;
  title: string;
  date: string;
  mode: DailyMode;
  difficultyLabel: string;
  difficultyColour: string;
};

const DIFFICULTY_LABELS: Record<CategoryColour, string> = {
  yellow: 'Easy', green: 'Medium', blue: 'Hard', purple: 'Expert',
};

function formatNytDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SORT_CYCLE: PuzzleSortMode[] = ['date_desc', 'date_asc', 'diff_asc', 'diff_desc', 'top_rated'];
const SORT_LABELS: Record<PuzzleSortMode, string> = {
  date_desc: '↓ Newest', date_asc: '↑ Oldest', diff_asc: '↑ Easiest', diff_desc: '↓ Hardest', top_rated: '⭐ Top Rated',
};
const DAILY_ARCHIVE_DAYS = 14;
const NEXT_STEPS_DAILY_START = '2026-06-09';
const CROSSED_SIGNALS_DAILY_START = '2026-06-11';
const NUMERIC_DIFFICULTY_COLOURS = ['#F5C842', '#3DBE8A', '#4AAEC8', '#9D6EC8', '#7B5FB5'];
const MODE_LABELS: Record<DailyMode, string> = {
  groups: 'Groups',
  word_trails: 'Next Steps',
  crossed_signals: 'Crossed Signals',
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function numericDifficultyLabel(level: number) {
  if (level <= 1) return 'Easy';
  if (level === 2) return 'Medium';
  if (level === 3) return 'Hard';
  if (level === 4) return 'Expert';
  return 'Master';
}

function numericDifficultyColour(level: number) {
  const index = Math.min(Math.max(level - 1, 0), NUMERIC_DIFFICULTY_COLOURS.length - 1);
  return NUMERIC_DIFFICULTY_COLOURS[index];
}

function recentDailyDates(days: number) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return toIsoDate(date);
  });
}

export function PuzzleSelectScreen({ navigation, route }: Props) {
  const recipientId = route.params?.recipientId;
  const recipientName = route.params?.recipientName;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // NYT archive is gated behind a per-user flag; locked users never see the tab.
  const nytAccess = useAuthStore(s => !!s.user?.nytAccess);

  const [collection, setCollection] = useState<Collection>(nytAccess ? 'nyt' : 'generated');
  const [difficulty, setDifficulty] = useState<CategoryColour | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | PuzzleSource>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<PuzzleSortMode>('date_desc');
  const [dailySortAsc, setDailySortAsc] = useState(false);
  const [nytSortAsc, setNytSortAsc] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completedNextStepsTrailIds, setCompletedNextStepsTrailIds] = useState<Set<string>>(new Set());
  const [completedCrossedSignalIds, setCompletedCrossedSignalIds] = useState<Set<string>>(new Set());
  const [nextStepsPuzzles, setNextStepsPuzzles] = useState(() => getNextSteps());

  const [modalPuzzleId, setModalPuzzleId] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState('');
  const [modalCollection, setModalCollection] = useState<'puzzles' | 'nyt_puzzles'>('nyt_puzzles');

  const [genItems, setGenItems] = useState<PuzzleListItem[]>([]);
  const [genPage, setGenPage] = useState(1);
  const [genTotalPages, setGenTotalPages] = useState(1);
  const [genLoading, setGenLoading] = useState(false);

  const [dailyItems, setDailyItems] = useState<DailyPuzzleListItem[]>([]);
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyTotalPages, setDailyTotalPages] = useState(1);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [nytItems, setNytItems] = useState<NytPuzzleListItem[]>([]);
  const [nytPage, setNytPage] = useState(1);
  const [nytTotalPages, setNytTotalPages] = useState(1);
  const [nytLoading, setNytLoading] = useState(false);

  const loadGenerated = useCallback(async (page: number, diff: CategoryColour | null, mode: PuzzleSortMode, reset = false) => {
    setGenLoading(true);
    const result = await fetchPuzzlesPage(page, diff ?? undefined, mode, sourceFilter === 'all' ? undefined : sourceFilter);
    setGenItems(prev => reset ? result.items : [...prev, ...result.items]);
    setGenPage(page);
    setGenTotalPages(result.totalPages);
    setGenLoading(false);
  }, [sourceFilter]);

  const loadDaily = useCallback(async (page: number, asc: boolean, q: string, reset = false) => {
    setDailyLoading(true);
    const result = await fetchDailyPuzzlesPage(page, asc, q);
    setDailyItems(prev => reset ? result.items : [...prev, ...result.items]);
    setDailyPage(page);
    setDailyTotalPages(result.totalPages);
    setDailyLoading(false);
  }, []);

  const loadNyt = useCallback(async (page: number, asc: boolean, q: string, reset = false) => {
    setNytLoading(true);
    const result = await fetchNytPuzzlesPage(page, asc, q);
    setNytItems(prev => reset ? result.items : [...prev, ...result.items]);
    setNytPage(page);
    setNytTotalPages(result.totalPages);
    setNytLoading(false);
  }, []);

  useEffect(() => {
    if (nytAccess) loadNyt(1, nytSortAsc, '', true);
    loadDaily(1, dailySortAsc, '', true);
    loadGenerated(1, null, sortMode, true);
    getCompletedPuzzleIds().then(setCompletedIds);
    getCompletedNextStepsIds().then(setCompletedNextStepsTrailIds);
    getCompletedCrossedSignalsIds().then(setCompletedCrossedSignalIds);
    loadNextSteps().then(setNextStepsPuzzles);
  }, []);

  useEffect(() => {
    if (collection === 'generated') loadGenerated(1, difficulty, sortMode, true);
  }, [difficulty, sortMode, sourceFilter]);

  useEffect(() => {
    if (collection === 'daily') loadDaily(1, dailySortAsc, search, true);
  }, [dailySortAsc]);

  useEffect(() => {
    if (collection === 'nyt') loadNyt(1, nytSortAsc, search, true);
  }, [nytSortAsc]);

  function handleCollectionSwitch(c: Collection) {
    setCollection(c);
    setSearch('');
    if (c === 'daily' && dailyItems.length === 0) loadDaily(1, dailySortAsc, '', true);
    if (c === 'nyt' && nytItems.length === 0) loadNyt(1, nytSortAsc, '', true);
    if (c === 'generated' && genItems.length === 0) loadGenerated(1, difficulty, sortMode, true);
  }

  function handleSearch(text: string) {
    setSearch(text);
    if (collection === 'nyt') loadNyt(1, nytSortAsc, text, true);
    else if (collection === 'daily') loadDaily(1, dailySortAsc, text, true);
    else loadGenerated(1, difficulty, sortMode, true);
  }

  function cycleSortMode() {
    const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length];
    setSortMode(next);
  }

  function openPuzzle(id: string, label: string, coll: 'puzzles' | 'nyt_puzzles') {
    if (completedIds.has(id)) {
      setModalPuzzleId(id);
      setModalLabel(label);
      setModalCollection(coll);
    } else {
      navigation.push('Game', { mode: 'freeplay', puzzleId: id, collection: coll, recipientId, recipientName });
    }
  }

  function openDailyArchiveItem(item: DailyArchiveItem) {
    if (item.mode === 'groups') {
      openPuzzle(item.id, `${item.title} · ${formatNytDate(item.date)}`, 'puzzles');
      return;
    }
    if (item.mode === 'word_trails') {
      navigation.push('NextStepsGame', { mode: 'freeplay', puzzleId: item.id, recipientId, recipientName });
      return;
    }
    navigation.push('CrossedSignalsGame', { mode: 'freeplay', puzzleId: item.id, recipientId, recipientName });
  }

  function handlePlayAgain() {
    setModalPuzzleId(null);
    if (modalPuzzleId) {
      navigation.push('Game', { mode: 'freeplay', puzzleId: modalPuzzleId, collection: modalCollection, recipientId, recipientName });
    }
  }

  const isNyt = collection === 'nyt';
  const isDaily = collection === 'daily';
  const hasMore = isNyt
    ? nytPage < nytTotalPages
    : isDaily
    ? dailyPage < dailyTotalPages
    : genPage < genTotalPages;

  const localDailyItems = useMemo<DailyArchiveItem[]>(() => {
    const dates = recentDailyDates(DAILY_ARCHIVE_DAYS);
    const crossedSignals = getCrossedSignalsPuzzles();
    const items: DailyArchiveItem[] = [];

    dates.forEach(date => {
      const day = new Date(`${date}T12:00:00Z`);
      if (date >= NEXT_STEPS_DAILY_START && nextStepsPuzzles.length > 0) {
        const puzzle = getDailyNextStepsPuzzle(nextStepsPuzzles, day);
        items.push({
          id: puzzle.id,
          title: puzzle.title,
          date,
          mode: 'word_trails',
          difficultyLabel: numericDifficultyLabel(puzzle.difficulty),
          difficultyColour: numericDifficultyColour(puzzle.difficulty),
        });
      }
      if (date >= CROSSED_SIGNALS_DAILY_START && crossedSignals.length > 0) {
        const puzzle = getDailyCrossedSignalsPuzzle(crossedSignals, day);
        items.push({
          id: puzzle.id,
          title: puzzle.title,
          date,
          mode: 'crossed_signals',
          difficultyLabel: numericDifficultyLabel(puzzle.difficulty),
          difficultyColour: numericDifficultyColour(puzzle.difficulty),
        });
      }
    });

    return items;
  }, [nextStepsPuzzles]);

  const dailyArchiveItems = useMemo<DailyArchiveItem[]>(() => {
    const groupItems = dailyItems.map(item => ({
      id: item.id,
      title: item.title?.trim() || 'Daily Puzzle',
      date: item.daily_date,
      mode: 'groups' as const,
      difficultyLabel: DIFFICULTY_LABELS[item.difficulty_min],
      difficultyColour: CATEGORY_COLOURS[item.difficulty_min],
    }));
    const q = search.trim().toLowerCase();
    const merged = [...groupItems, ...localDailyItems].filter(item => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.date.includes(q) ||
        MODE_LABELS[item.mode].toLowerCase().includes(q)
      );
    });
    return merged.sort((a, b) => {
      const dateCompare = dailySortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return MODE_LABELS[a.mode].localeCompare(MODE_LABELS[b.mode]);
    });
  }, [dailyItems, dailySortAsc, localDailyItems, search]);

  function loadMore() {
    if (isNyt) loadNyt(nytPage + 1, nytSortAsc, search);
    else if (isDaily) loadDaily(dailyPage + 1, dailySortAsc, search);
    else loadGenerated(genPage + 1, difficulty, sortMode);
  }

  const renderGenItem: ListRenderItem<PuzzleListItem> = ({ item, index }) => {
    const done = completedIds.has(item.id);
    const playCount = Math.max(item.play_count ?? 0, done ? 1 : 0);
    const hasDate = !!(item.daily_date && item.daily_date !== '');
    const named = item.title?.trim();
    const rowTitle = hasDate ? 'Daily Puzzle' : named || `Puzzle #${index + 1}`;
    const label = hasDate ? `Daily · ${formatNytDate(item.daily_date!)}` : rowTitle;
    return (
      <Pressable style={styles.row} onPress={() => openPuzzle(item.id, label, 'puzzles')}>
        <View style={[styles.diffBadge, { backgroundColor: CATEGORY_COLOURS[item.difficulty_min] }]}>
          <Text style={styles.diffBadgeText}>{DIFFICULTY_LABELS[item.difficulty_min]}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{rowTitle}</Text>
          {hasDate && <Text style={styles.rowMeta}>{formatNytDate(item.daily_date!)}</Text>}
        </View>
        {item.source === 'curated' && <View style={styles.curatedPill}><Text style={styles.curatedPillText}>✨ Curated</Text></View>}
        {!hasDate && <Text style={styles.rowMeta}>{playCount} play{playCount === 1 ? '' : 's'}</Text>}
        {done && <View style={styles.donePill}><Text style={styles.donePillText}>✓ Done</Text></View>}
      </Pressable>
    );
  };

  const renderDailyArchiveItem: ListRenderItem<DailyArchiveItem> = ({ item }) => {
    const done =
      item.mode === 'groups'
        ? completedIds.has(item.id)
        : item.mode === 'word_trails'
          ? completedNextStepsTrailIds.has(item.id)
          : completedCrossedSignalIds.has(item.id);
    return (
      <Pressable style={styles.row} onPress={() => openDailyArchiveItem(item)}>
        <View style={[styles.diffBadge, { backgroundColor: item.difficultyColour }]}>
          <Text style={styles.diffBadgeText}>{item.difficultyLabel}</Text>
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.modePill}><Text style={styles.modePillText}>{MODE_LABELS[item.mode]}</Text></View>
          </View>
          <Text style={styles.rowMeta}>{formatNytDate(item.date)}</Text>
        </View>
        {done && <View style={styles.donePill}><Text style={styles.donePillText}>✓ Done</Text></View>}
      </Pressable>
    );
  };

  const renderNytItem: ListRenderItem<NytPuzzleListItem> = ({ item }) => {
    const done = completedIds.has(item.id);
    return (
      <Pressable style={styles.row} onPress={() => openPuzzle(item.id, `Puzzle #${item.nyt_id} · ${formatNytDate(item.nyt_date)}`, 'nyt_puzzles')}>
        <View style={styles.nytBadge}><Text style={styles.nytBadgeText}>NYT</Text></View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>#{item.nyt_id}</Text>
          <Text style={styles.rowMeta}>{formatNytDate(item.nyt_date)}</Text>
        </View>
        {done && <View style={styles.donePill}><Text style={styles.donePillText}>✓ Done</Text></View>}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {recipientId && recipientName && (
          <View style={styles.challengeBanner}>
            <Text style={styles.challengeBannerText}>⚡ Pick a puzzle to challenge {recipientName}</Text>
          </View>
        )}
        <AdBanner />

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, collection === 'generated' && styles.tabActive]} onPress={() => handleCollectionSwitch('generated')}>
            <Text style={[styles.tabText, collection === 'generated' && styles.tabTextActive]}>Curated</Text>
          </Pressable>
          <Pressable style={[styles.tab, isDaily && styles.tabActive]} onPress={() => handleCollectionSwitch('daily')}>
            <Text style={[styles.tabText, isDaily && styles.tabTextActive]}>Daily</Text>
          </Pressable>
          {nytAccess && (
            <Pressable style={[styles.tab, isNyt && styles.tabActive]} onPress={() => handleCollectionSwitch('nyt')}>
              <Text style={[styles.tabText, isNyt && styles.tabTextActive]}>NYT Puzzles</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={isNyt ? 'Search by date or #' : isDaily ? 'Search title, mode, or date' : 'Search...'}
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isNyt ? (
            <Pressable style={styles.sortBtn} onPress={() => setNytSortAsc(v => !v)}>
              <Text style={styles.sortBtnText}>{nytSortAsc ? '↑ Oldest' : '↓ Newest'}</Text>
            </Pressable>
          ) : isDaily ? (
            <Pressable style={styles.sortBtn} onPress={() => setDailySortAsc(v => !v)}>
              <Text style={styles.sortBtnText}>{dailySortAsc ? '↑ Oldest' : '↓ Newest'}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.sortBtn} onPress={cycleSortMode}>
              <Text style={styles.sortBtnText}>{SORT_LABELS[sortMode]}</Text>
            </Pressable>
          )}
        </View>

        {collection === 'generated' && (
          <View style={styles.chips}>
            {(['all', 'curated', 'generated'] as const).map(s => (
              <Pressable
                key={s}
                style={[styles.chip, sourceFilter === s && styles.chipActive]}
                onPress={() => setSourceFilter(s)}
              >
                <Text style={[styles.chipText, sourceFilter === s && styles.chipTextActive]}>
                  {s === 'all' ? 'All' : s === 'curated' ? '✨ Curated' : 'Generated'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {collection === 'generated' && (
          <View style={styles.chips}>
            <Pressable style={[styles.chip, !difficulty && styles.chipActive]} onPress={() => setDifficulty(null)}>
              <Text style={[styles.chipText, !difficulty && styles.chipTextActive]}>All</Text>
            </Pressable>
            {CATEGORY_ORDER.map(colour => (
              <Pressable
                key={colour}
                style={[styles.chip, difficulty === colour && { backgroundColor: CATEGORY_COLOURS[colour], borderColor: CATEGORY_COLOURS[colour] }]}
                onPress={() => setDifficulty(colour)}
              >
                <Text style={[styles.chipText, difficulty === colour && styles.chipTextActive]}>
                  {DIFFICULTY_LABELS[colour]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {(isNyt ? nytLoading : isDaily ? dailyLoading : genLoading) && (isNyt ? nytItems.length : isDaily ? dailyArchiveItems.length : genItems.length) === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.text2} />
        ) : isNyt ? (
          <FlatList
            data={nytItems}
            keyExtractor={p => p.id}
            renderItem={renderNytItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No NYT puzzles found.</Text>}
            ListFooterComponent={hasMore ? (
              <Pressable style={styles.loadMore} onPress={loadMore} disabled={nytLoading}>
                {nytLoading ? <ActivityIndicator color={colors.text2} /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null}
          />
        ) : isDaily ? (
          <FlatList
            data={dailyArchiveItems}
            keyExtractor={p => `${p.mode}-${p.date}-${p.id}`}
            renderItem={renderDailyArchiveItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No daily puzzles found.</Text>}
            ListFooterComponent={hasMore ? (
              <Pressable style={styles.loadMore} onPress={loadMore} disabled={dailyLoading}>
                {dailyLoading ? <ActivityIndicator color={colors.text2} /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null}
          />
        ) : (
          <FlatList
            data={genItems}
            keyExtractor={p => p.id}
            renderItem={renderGenItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No puzzles found.</Text>}
            ListFooterComponent={hasMore ? (
              <Pressable style={styles.loadMore} onPress={loadMore} disabled={genLoading}>
                {genLoading ? <ActivityIndicator color={colors.text2} /> : <Text style={styles.loadMoreText}>Load more</Text>}
              </Pressable>
            ) : null}
          />
        )}
      </View>

      <GameResultModal
        visible={!!modalPuzzleId}
        puzzleId={modalPuzzleId}
        collection={modalCollection}
        label={modalLabel}
        onClose={() => setModalPuzzleId(null)}
        onPlayAgain={handlePlayAgain}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flex: 1 },
    challengeBanner: { backgroundColor: c.green, marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 12, alignItems: 'center' },
    challengeBannerText: { fontSize: 14, fontFamily: FONTS.extraBold, color: '#162219' },
    tabs: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 12, borderRadius: 12, backgroundColor: c.bgBase, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: c.text1 },
    tabText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
    tabTextActive: { color: c.bgScreen },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 10 },
    searchInput: {
      flex: 1, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: c.border,
      paddingHorizontal: 12, fontSize: 14, fontFamily: FONTS.bold, color: c.text1,
      backgroundColor: c.bgSurface,
    },
    sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: c.border },
    sortBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: c.border },
    chipActive: { backgroundColor: c.text1, borderColor: c.text1 },
    chipText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    chipTextActive: { color: c.bgScreen },
    loader: { marginTop: 40 },
    list: { paddingHorizontal: 20, paddingBottom: 24 },
    empty: { textAlign: 'center', color: c.text3, marginTop: 40, fontFamily: FONTS.bold },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, gap: 10 },
    rowContent: { flex: 1 },
    rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, minWidth: 58, alignItems: 'center' },
    diffBadgeText: { fontSize: 11, fontFamily: FONTS.extraBold, color: '#162219', letterSpacing: 0.3 },
    nytBadge: { backgroundColor: '#162219', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    nytBadgeText: { fontSize: 10, fontFamily: FONTS.extraBold, color: '#FFF', letterSpacing: 0.5 },
    rowTitle: { flex: 1, fontSize: 16, fontFamily: FONTS.bold, color: c.text1 },
    rowMeta: { fontSize: 13, fontFamily: FONTS.bold, color: c.text3 },
    modePill: { borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3 },
    modePillText: { fontSize: 11, fontFamily: FONTS.extraBold, color: c.text2 },
    donePill: { backgroundColor: c.green, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    donePillText: { fontSize: 12, fontFamily: FONTS.extraBold, color: '#162219' },
    curatedPill: { backgroundColor: '#E7B43A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    curatedPillText: { fontSize: 12, fontFamily: FONTS.extraBold, color: '#3A2E00' },
    loadMore: { marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: c.border },
    loadMoreText: { fontSize: 14, fontFamily: FONTS.bold, color: c.text2 },
  });
}
