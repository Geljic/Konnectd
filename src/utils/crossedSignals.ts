import AsyncStorage from '@react-native-async-storage/async-storage';
import { CROSSED_SIGNALS_PUZZLES, type CrossedSignalsPuzzle } from '@/data/crossedSignalsPuzzles';
import { addDailyDays, getDailyDate, getDailyIndexFrom } from '@/utils/dailyDate';

const CROSSED_SIGNALS_RESULTS_KEY = 'crossed_signals_results';
const DAILY_START = '2026-06-11T00:00:00Z';

export type ScanFeedback = 'locked' | 'row' | 'column' | 'static';

export interface CrossedSignalsResult {
  completed: boolean;
  noise: number;
  scansUsed: number;
  durationSeconds: number;
  score: number;
  completedAt: string;
}

export interface CrossedSignalsSessionItem {
  id: string;
  puzzle: string;
  completed: boolean;
  mistakes: number;
  scansUsed: number;
  durationSeconds: number;
  score: number;
  created: string;
}

export function getCrossedSignalsPuzzles(): CrossedSignalsPuzzle[] {
  return CROSSED_SIGNALS_PUZZLES;
}

export function getSolvedBoard(puzzle: CrossedSignalsPuzzle): string[] {
  return puzzle.rows.flatMap(row =>
    puzzle.columns.map(column => {
      const cell = puzzle.cells.find(c => c.rowId === row.id && c.columnId === column.id);
      return cell?.word ?? '';
    }),
  );
}

export function getDailyCrossedSignalsPuzzle(puzzles = CROSSED_SIGNALS_PUZZLES, now = new Date()): CrossedSignalsPuzzle {
  const dayIndex = getDailyIndexFrom(DAILY_START, now);
  return puzzles[dayIndex % puzzles.length];
}

export function getRandomCrossedSignalsPuzzle(puzzles = CROSSED_SIGNALS_PUZZLES): CrossedSignalsPuzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

export function createInitialBoard(puzzle: CrossedSignalsPuzzle): string[] {
  return seededShuffle(getSolvedBoard(puzzle), puzzle.id);
}

export function isSolved(puzzle: CrossedSignalsPuzzle, board: string[]): boolean {
  const solved = getSolvedBoard(puzzle);
  return solved.every((word, index) => board[index] === word);
}

export function countCorrect(puzzle: CrossedSignalsPuzzle, board: string[]): number {
  const solved = getSolvedBoard(puzzle);
  return solved.filter((word, index) => board[index] === word).length;
}

export function getScanFeedback(puzzle: CrossedSignalsPuzzle, board: string[], index: number): ScanFeedback {
  const word = board[index];
  const solved = getSolvedBoard(puzzle);
  const correctIndex = solved.indexOf(word);
  if (correctIndex === -1) return 'static';
  if (correctIndex === index) return 'locked';
  const rowOk = Math.floor(correctIndex / 4) === Math.floor(index / 4);
  const columnOk = correctIndex % 4 === index % 4;
  if (rowOk && columnOk) return 'locked';
  if (rowOk) return 'row';
  if (columnOk) return 'column';
  return 'static';
}

export function calculateCrossedSignalsScore(params: {
  completed: boolean;
  noise: number;
  scansUsed: number;
  durationSeconds: number;
}): number {
  if (!params.completed) return 0;
  const timeBonus = Math.max(50, 400 - Math.floor(params.durationSeconds / 8));
  const perfectBonus = params.noise === 0 && params.scansUsed === 0 ? 250 : 0;
  return Math.max(0, 1600 + timeBonus + perfectBonus - params.noise * 150 - params.scansUsed * 100);
}

export async function markCrossedSignalsCompleted(
  puzzleId: string,
  result: Omit<CrossedSignalsResult, 'completedAt'>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CROSSED_SIGNALS_RESULTS_KEY);
    const map: Record<string, CrossedSignalsResult> = raw ? JSON.parse(raw) : {};
    map[puzzleId] = { ...result, completedAt: new Date().toISOString() };
    await AsyncStorage.setItem(CROSSED_SIGNALS_RESULTS_KEY, JSON.stringify(map));
  } catch {}
}

export async function getCrossedSignalsResult(puzzleId: string): Promise<CrossedSignalsResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CROSSED_SIGNALS_RESULTS_KEY);
    if (!raw) return null;
    const map: Record<string, CrossedSignalsResult> = JSON.parse(raw);
    return map[puzzleId] ?? null;
  } catch {
    return null;
  }
}

export async function getCompletedCrossedSignalsIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(CROSSED_SIGNALS_RESULTS_KEY);
    if (!raw) return new Set();
    const map: Record<string, CrossedSignalsResult> = JSON.parse(raw);
    return new Set(Object.entries(map).filter(([, result]) => result.completed).map(([id]) => id));
  } catch {
    return new Set();
  }
}

export async function fetchLocalCrossedSignalsSessions(): Promise<CrossedSignalsSessionItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CROSSED_SIGNALS_RESULTS_KEY);
    if (!raw) return [];
    const map: Record<string, CrossedSignalsResult> = JSON.parse(raw);
    return Object.entries(map)
      .map(([puzzleId, result]) => ({
        id: puzzleId,
        puzzle: puzzleId,
        completed: result.completed,
        mistakes: result.noise,
        scansUsed: result.scansUsed,
        durationSeconds: result.durationSeconds,
        score: result.score,
        created: result.completedAt,
      }))
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  } catch {
    return [];
  }
}

export function computeCrossedSignalsStreak(sessions: CrossedSignalsSessionItem[]): { current: number; best: number } {
  const completedDays = Array.from(
    new Set(sessions.filter(s => s.completed).map(s => s.created.split('T')[0])),
  ).sort().reverse();

  if (completedDays.length === 0) return { current: 0, best: 0 };

  let current = 0;
  const today = getDailyDate();
  let checking = today;
  for (const day of completedDays) {
    if (day === checking) {
      current++;
      checking = addDailyDays(checking, -1);
    } else if (day < checking) {
      break;
    }
  }

  if (current === 0 && completedDays[0]) {
    checking = addDailyDays(today, -1);
    for (const day of completedDays) {
      if (day === checking) {
        current++;
        checking = addDailyDays(checking, -1);
      } else if (day < checking) {
        break;
      }
    }
  }

  let best = 0;
  let run = 1;
  for (let i = 1; i < completedDays.length; i++) {
    if (addDailyDays(completedDays[i - 1], -1) === completedDays[i]) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }

  return { current, best: Math.max(best, run, current) };
}

export function validateCrossedSignalsPuzzle(puzzle: CrossedSignalsPuzzle): string[] {
  const errors: string[] = [];
  if (puzzle.rows.length !== 4) errors.push(`${puzzle.id} must have 4 row signals.`);
  if (puzzle.columns.length !== 4) errors.push(`${puzzle.id} must have 4 column signals.`);
  if (puzzle.cells.length !== 16) errors.push(`${puzzle.id} must have 16 cells.`);

  const seenWords = new Set<string>();
  puzzle.cells.forEach(cell => {
    const key = cell.word.trim().toUpperCase();
    if (!key) errors.push(`${puzzle.id} has an empty word.`);
    if (seenWords.has(key)) errors.push(`${puzzle.id} repeats word ${key}.`);
    seenWords.add(key);
  });

  puzzle.rows.forEach(row => {
    puzzle.columns.forEach(column => {
      const matches = puzzle.cells.filter(cell => cell.rowId === row.id && cell.columnId === column.id);
      if (matches.length !== 1) errors.push(`${puzzle.id} needs exactly one answer for ${row.id}/${column.id}.`);
    });
  });

  return errors;
}

function seededShuffle(values: string[], seed: string): string[] {
  const next = [...values];
  let state = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 1;
  for (let i = next.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
