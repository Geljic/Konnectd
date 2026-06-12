import AsyncStorage from '@react-native-async-storage/async-storage';
import pb from './pb';
import type { CategoryColour } from '@/constants/colors';
import { DAILY_PUZZLE_LAUNCH_DATE } from '@/constants/config';
import {
  DEFAULT_GAME_TYPE,
  normaliseGameType,
  normaliseRuleset,
  type GameType,
  type Ruleset,
} from '@/constants/gameModes';

export interface PuzzleCategory {
  name: string;
  colour: CategoryColour;
  words: [string, string, string, string];
  explanation?: string;
}

export interface Puzzle {
  id: string;
  title?: string;
  words: string[];
  categories: PuzzleCategory[];
  difficulty_min: CategoryColour;
  daily_date: string | null;
  play_count: number;
}

export type PuzzleSource = 'curated' | 'generated';

export interface PuzzleListItem {
  id: string;
  title?: string;
  difficulty_min: CategoryColour;
  play_count: number;
  thumbs_up_count?: number;
  daily_date?: string;
  source?: string;
}

export interface DailyPuzzleListItem extends PuzzleListItem {
  daily_date: string;
}

export interface NytPuzzleListItem {
  id: string;
  nyt_id: number;
  nyt_date: string;
}

export interface PageResult<T> {
  items: T[];
  totalPages: number;
  totalItems: number;
}

export async function fetchDailyPuzzle(): Promise<Puzzle | null> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    // Any puzzle with today's daily_date — no status filter so admin can set up
    // puzzles in advance without needing to also flip status to 'published'
    const record = await pb.collection('puzzles').getFirstListItem(
      `daily_date = '${today}'`,
      { requestKey: null }
    );
    return record as unknown as Puzzle;
  } catch {
    // Fall back: deterministically pick a published puzzle by day index so
    // all users get the same puzzle each day without explicit scheduling
    try {
      const allPuzzles = await pb.collection('puzzles').getFullList({
        filter: `status = 'published'`,
        sort: 'id',
        fields: 'id,words,categories,difficulty_min,daily_date,play_count',
        requestKey: null,
      });
      if (allPuzzles.length === 0) return null;
      const dayIndex = Math.floor(Date.now() / 86400000) % allPuzzles.length;
      return allPuzzles[dayIndex] as unknown as Puzzle;
    } catch (e) {
      console.error('[fetchDailyPuzzle] fallback error:', e);
      return null;
    }
  }
}

export type PuzzleSortMode = 'date_asc' | 'date_desc' | 'diff_asc' | 'diff_desc' | 'top_rated';

export async function fetchPuzzlesPage(
  page: number,
  difficulty?: CategoryColour,
  sortMode: PuzzleSortMode = 'date_desc',
  source?: PuzzleSource,
): Promise<PageResult<PuzzleListItem>> {
  const today = new Date().toISOString().slice(0, 10);
  // Include published puzzles plus any past daily puzzles (regardless of status)
  const clauses = [`(status = 'published' || (daily_date != '' && daily_date <= '${today}'))`];
  if (difficulty) clauses.push(`difficulty_min = '${difficulty}'`);
  if (source) clauses.push(`source = '${source}'`);
  const filter = clauses.join(' && ');
  const sortField =
    sortMode === 'date_asc' ? 'id' :
    sortMode === 'date_desc' ? '-id' :
    sortMode === 'diff_asc' ? 'difficulty_order,id' :
    sortMode === 'top_rated' ? '-thumbs_up_count,-id' :
    '-difficulty_order,-id';
  try {
    const result = await pb.collection('puzzles').getList(page, 10, {
      filter,
      sort: sortField,
      fields: 'id,title,difficulty_min,play_count,thumbs_up_count,daily_date,source',
      requestKey: null,
    });
    return {
      items: result.items as unknown as PuzzleListItem[],
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch {
    return { items: [], totalPages: 0, totalItems: 0 };
  }
}

export async function fetchDailyPuzzlesPage(
  page: number,
  sortAsc = false,
  search = '',
): Promise<PageResult<DailyPuzzleListItem>> {
  const today = new Date().toISOString().slice(0, 10);
  // No status filter — any puzzle with a daily_date is a valid past daily puzzle
  const filters = [
    `daily_date != ''`,
    `daily_date >= '${DAILY_PUZZLE_LAUNCH_DATE}'`,
    `daily_date <= '${today}'`,
  ];
  if (search.trim()) {
    const q = search.trim();
    filters.push(`(daily_date ~ '${q}' || title ~ '${q}')`);
  }

  try {
    const result = await pb.collection('puzzles').getList(page, 10, {
      filter: filters.join(' && '),
      sort: sortAsc ? 'daily_date' : '-daily_date',
      fields: 'id,title,difficulty_min,play_count,daily_date',
      requestKey: null,
    });
    return {
      items: result.items as unknown as DailyPuzzleListItem[],
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (e) {
    console.error('[fetchDailyPuzzlesPage] error:', e);
    return { items: [], totalPages: 0, totalItems: 0 };
  }
}

export async function fetchNytPuzzlesPage(
  page: number,
  sortAsc = true,
  search = '',
): Promise<PageResult<NytPuzzleListItem>> {
  const num = parseInt(search);
  const filter = search
    ? isNaN(num)
      ? `nyt_date ~ '${search}'`
      : `nyt_id = ${num}`
    : '';
  try {
    const result = await pb.collection('nyt_puzzles').getList(page, 10, {
      ...(filter ? { filter } : {}),
      sort: sortAsc ? 'nyt_id' : '-nyt_id',
      fields: 'id,nyt_id,nyt_date',
      requestKey: null,
    });
    return {
      items: result.items as unknown as NytPuzzleListItem[],
      totalPages: result.totalPages,
      totalItems: result.totalItems,
    };
  } catch (e) {
    console.error('[fetchNytPuzzlesPage] error:', e);
    return { items: [], totalPages: 0, totalItems: 0 };
  }
}

export async function fetchPuzzleById(id: string): Promise<Puzzle | null> {
  try {
    const record = await pb.collection('puzzles').getOne(id);
    return record as unknown as Puzzle;
  } catch {
    return null;
  }
}

export async function fetchNytPuzzleById(id: string): Promise<Puzzle | null> {
  try {
    const r = await pb.collection('nyt_puzzles').getOne(id);
    return {
      id: r.id,
      words: r.words,
      categories: r.categories,
      difficulty_min: 'yellow',
      daily_date: r.nyt_date ?? null,
      play_count: r.play_count,
    } as Puzzle;
  } catch (e) {
    console.error('[fetchNytPuzzleById] error:', e);
    return null;
  }
}

export async function fetchRandomNytPuzzle(): Promise<Puzzle | null> {
  try {
    const total = await pb.collection('nyt_puzzles').getList(1, 1);
    if (total.totalItems === 0) return null;
    const randomPage = Math.floor(Math.random() * total.totalItems) + 1;
    const result = await pb.collection('nyt_puzzles').getList(randomPage, 1, { sort: 'nyt_id' });
    if (result.items.length === 0) return null;
    const r = result.items[0];
    return {
      id: r.id,
      words: r.words,
      categories: r.categories,
      difficulty_min: 'yellow',
      daily_date: r.nyt_date ?? null,
      play_count: r.play_count,
    } as Puzzle;
  } catch (e) {
    console.error('[fetchRandomNytPuzzle] error:', e);
    return null;
  }
}

export interface PlaySessionItem {
  id: string;
  puzzle: string;
  completed: boolean;
  mistakes: number;
  durationSeconds: number;
  gameType: GameType;
  gameMode: Ruleset;
  score?: number;
  created: string;
}

export async function fetchRecentSessions(limit = 15): Promise<PlaySessionItem[]> {
  if (!pb.authStore.isValid) return [];
  try {
    const result = await pb.collection('play_sessions').getList(1, limit, {
      filter: `user = '${pb.authStore.model?.id}'`,
      sort: '-created',
      fields: 'id,puzzle,completed,mistakes,duration_seconds,game_type,game_mode,score,created',
    });
    return result.items.map((r: any) => {
      const gameType = normaliseGameType(r.game_type);
      return {
        id: r.id,
        puzzle: r.puzzle,
        completed: r.completed,
        mistakes: r.mistakes,
        durationSeconds: r.duration_seconds,
        gameType,
        gameMode: normaliseRuleset(r.game_mode, gameType),
        score: r.score != null ? (r.score as number) : undefined,
        created: r.created,
      };
    });
  } catch {
    return [];
  }
}

export async function recordPlaySession(params: {
  puzzleId: string;
  collection?: 'puzzles' | 'nyt_puzzles';
  completed: boolean;
  mistakes: number;
  durationSeconds: number;
  solvedOrder: CategoryColour[];
  gameType?: GameType;
  gameMode?: Ruleset;
  score?: number;
}): Promise<void> {
  if (!pb.authStore.isValid) return;
  const gameType = params.gameType ?? DEFAULT_GAME_TYPE;
  const gameMode = normaliseRuleset(params.gameMode, gameType);

  // Don't record a repeat play of an already-completed puzzle
  try {
    const existing = await pb.collection('play_sessions').getFirstListItem(
      `user = '${pb.authStore.model?.id}' && puzzle = '${params.puzzleId}' && game_type = '${gameType}' && completed = true`,
      { fields: 'id' },
    );
    if (existing) return;
  } catch {
    // getFirstListItem throws when no record found — that's the normal path, continue
  }

  await pb.collection('play_sessions').create({
    user: pb.authStore.model?.id,
    puzzle: params.puzzleId,
    completed: params.completed,
    mistakes: params.mistakes,
    duration_seconds: params.durationSeconds,
    solved_order: params.solvedOrder,
    game_type: gameType,
    game_mode: gameMode,
    score: params.score ?? null,
  });

  if (gameType !== 'connections') return;

  // Increment play count on the puzzle (best-effort, not critical)
  try {
    const collection = params.collection ?? 'puzzles';
    const p = await pb.collection(collection).getOne(params.puzzleId, { fields: 'id,play_count' });
    await pb.collection(collection).update(params.puzzleId, {
      play_count: ((p['play_count'] as number) || 0) + 1,
    });
  } catch { /* non-critical */ }
}

export async function getUserRatingForPuzzle(
  puzzleId: string,
  gameType: 'connections' | 'word_trails' | 'crossed_signals' = 'connections',
): Promise<1 | -1 | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const session = await pb.collection('play_sessions').getFirstListItem(
      `user = '${pb.authStore.model?.id}' && puzzle = '${puzzleId}' && game_type = '${gameType}'`,
      { fields: 'rating' },
    );
    const r = session['rating'];
    return r === 1 ? 1 : r === -1 ? -1 : null;
  } catch {
    return null;
  }
}

export async function ratePuzzle(
  puzzleId: string,
  rating: 1 | -1,
  _collection: 'puzzles' | 'nyt_puzzles' = 'puzzles',
  gameType: 'connections' | 'word_trails' | 'crossed_signals' = 'connections',
): Promise<void> {
  if (!pb.authStore.isValid) return;
  try {
    const session = await pb.collection('play_sessions').getFirstListItem(
      `user = '${pb.authStore.model?.id}' && puzzle = '${puzzleId}' && game_type = '${gameType}'`,
      { fields: 'id' },
    );
    await pb.collection('play_sessions').update(session.id, { rating });
  } catch { /* session may not exist for guest */ }
}

export interface UserStats {
  played: number;
  won: number;
  losses: number;
  winRate: number;
  avgTimeSecs: number | null;
  streakCurrent: number;
  streakBest: number;
}

export async function fetchUserStats(): Promise<UserStats | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const userId = pb.authStore.model?.id;

    // Aggregate from play_sessions (source of truth for played/won)
    const [sessions, userRecord] = await Promise.all([
      pb.collection('play_sessions').getFullList({
        filter: `user = '${userId}' && game_type = 'connections'`,
        sort: 'created',
        fields: 'completed,duration_seconds,created',
      }),
      pb.collection('users').getOne(userId!).catch(() => null),
    ]);

    const played = sessions.length;
    const wonCount = sessions.filter((s: any) => s.completed).length;
    const losses = played - wonCount;
    const winRate = played > 0 ? Math.round((wonCount / played) * 100) : 0;

    const wonWithTime = sessions.filter((s: any) => s.completed && s.duration_seconds > 0);
    const avgTimeSecs = wonWithTime.length > 0
      ? Math.round(wonWithTime.reduce((a: number, s: any) => a + s.duration_seconds, 0) / wonWithTime.length)
      : null;

    // Streak: computed from consecutive daily wins
    const streakCurrent = (userRecord?.['streak_current'] as number) || 0;
    const streakBest = (userRecord?.['streak_best'] as number) || 0;

    return { played, won: wonCount, losses, winRate, avgTimeSecs, streakCurrent, streakBest };
  } catch (e) {
    console.error('[fetchUserStats] error:', e);
    return null;
  }
}

export async function updateUserStats(won: boolean): Promise<void> {
  if (!pb.authStore.isValid) return;
  const userId = pb.authStore.model?.id;
  if (!userId) return;
  try {
    const [user, sessions] = await Promise.all([
      pb.collection('users').getOne(userId),
      pb.collection('play_sessions').getFullList({
        filter: `user = '${userId}' && game_type = 'connections'`,
        fields: 'completed,created',
        requestKey: null,
      }),
    ]);

    const played = sessions.length;
    const wonCount = sessions.filter((s: any) => s.completed).length;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastWinDate = (user['last_win_date'] as string) ?? '';

    let streakCurrent = (user['streak_current'] as number) || 0;
    let streakBest = (user['streak_best'] as number) || 0;

    if (won) {
      if (lastWinDate === today) {
        // already counted today
      } else if (lastWinDate === yesterday) {
        streakCurrent += 1;
      } else {
        streakCurrent = 1;
      }
      streakBest = Math.max(streakBest, streakCurrent);
    } else if (lastWinDate !== today) {
      streakCurrent = 0;
    }

    await pb.collection('users').update(userId, {
      puzzles_played: played,
      puzzles_won: wonCount,
      streak_current: streakCurrent,
      streak_best: streakBest,
      last_win_date: won ? today : lastWinDate,
    });
  } catch (e) {
    console.error('[updateUserStats] error:', e);
  }
}

const RESULTS_KEY = 'puzzle_results';

export interface PuzzleResult {
  durationSeconds: number;
  mistakes: number;
  solvedOrder: CategoryColour[];
  completedAt: string; // ISO date string
}

export async function markPuzzleCompleted(
  puzzleId: string,
  result: Omit<PuzzleResult, 'completedAt'>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RESULTS_KEY);
    const map: Record<string, PuzzleResult> = raw ? JSON.parse(raw) : {};
    if (!map[puzzleId]) {
      map[puzzleId] = { ...result, completedAt: new Date().toISOString() };
      await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(map));
    }
  } catch {}
}

export async function getPuzzleResult(puzzleId: string): Promise<PuzzleResult | null> {
  try {
    const raw = await AsyncStorage.getItem(RESULTS_KEY);
    if (!raw) return null;
    const map: Record<string, PuzzleResult> = JSON.parse(raw);
    return map[puzzleId] ?? null;
  } catch {
    return null;
  }
}

export async function getCompletedPuzzleIds(): Promise<Set<string>> {
  // Merge local results with PocketBase play_sessions (if logged in)
  const local = await getLocalCompletedIds();
  const remote = await getRemoteCompletedIds();
  return new Set([...local, ...remote]);
}

async function getLocalCompletedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(RESULTS_KEY);
    if (!raw) return new Set();
    return new Set(Object.keys(JSON.parse(raw)));
  } catch {
    return new Set();
  }
}

async function getRemoteCompletedIds(): Promise<Set<string>> {
  if (!pb.authStore.isValid) return new Set();
  try {
    const sessions = await pb.collection('play_sessions').getFullList({
      filter: `user = '${pb.authStore.model?.id}' && game_type = 'connections' && completed = true`,
      fields: 'puzzle',
    });
    return new Set(sessions.map((s: any) => s.puzzle as string));
  } catch {
    return new Set();
  }
}

export async function getRemotePuzzleResult(puzzleId: string): Promise<PuzzleResult | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const result = await pb.collection('play_sessions').getFirstListItem(
      `user = '${pb.authStore.model?.id}' && puzzle = '${puzzleId}' && game_type = 'connections' && completed = true`,
      { fields: 'duration_seconds,mistakes,solved_order,created' },
    );
    return {
      durationSeconds: result['duration_seconds'] as number,
      mistakes: result['mistakes'] as number,
      solvedOrder: (result['solved_order'] as CategoryColour[]) ?? [],
      completedAt: result['created'] as string,
    };
  } catch {
    return null;
  }
}

// ── Next-puzzle navigation ─────────────────────────────────────────────────────

export async function fetchNextPuzzleId(
  currentId: string,
  collection: 'puzzles' | 'nyt_puzzles',
): Promise<string | null> {
  try {
    if (collection === 'nyt_puzzles') {
      const current = await pb.collection('nyt_puzzles').getOne(currentId, { fields: 'nyt_id' });
      const next = await pb.collection('nyt_puzzles').getFirstListItem(
        `nyt_id > ${current['nyt_id']}`,
        { sort: 'nyt_id', fields: 'id' },
      );
      return next.id;
    } else {
      // The Curated list is sorted by -id, so "Next" should follow that order:
      // the next lower id. PocketBase ids are random strings, so ordering by id
      // is arbitrary but stable — this keeps Next moving through the list instead
      // of jumping randomly. Wrap back to the top once we hit the end.
      try {
        const next = await pb.collection('puzzles').getFirstListItem(
          `status = 'published' && id < '${currentId}'`,
          { sort: '-id', fields: 'id' },
        );
        return next.id;
      } catch {
        const top = await pb.collection('puzzles').getFirstListItem(
          `status = 'published'`,
          { sort: '-id', fields: 'id' },
        );
        return top.id !== currentId ? top.id : null;
      }
    }
  } catch {
    return null;
  }
}

// ── In-progress game persistence ───────────────────────────────────────────────

const PROGRESS_KEY = 'game_in_progress';

export interface SavedProgress {
  puzzleId: string;
  collection: 'puzzles' | 'nyt_puzzles';
  solvedCategoryNames: string[];
  mistakes: number;
  elapsedSeconds: number;
}

export async function saveGameProgress(progress: SavedProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {}
}

export async function loadGameProgress(puzzleId: string): Promise<SavedProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const saved: SavedProgress = JSON.parse(raw);
    return saved.puzzleId === puzzleId ? saved : null;
  } catch {
    return null;
  }
}

export async function clearGameProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROGRESS_KEY);
  } catch {}
}
