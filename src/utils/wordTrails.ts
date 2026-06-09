import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WordTrail, WordTrailsPuzzle } from '@/data/wordTrailsPuzzles';

const WORD_TRAILS_RESULTS_KEY = 'word_trails_results';

export interface WordTrailsValidationResult {
  valid: boolean;
  errors: string[];
}

export interface WordTrailsResult {
  completed: boolean;
  mistakes: number;
  durationSeconds: number;
  solvedTrailLabels: string[];
  completedAt: string;
}

export function createWordTrailsPuzzle(params: {
  id: string;
  title: string;
  difficulty: WordTrailsPuzzle['difficulty'];
  trails: WordTrailsPuzzle['trails'];
}): WordTrailsPuzzle {
  return {
    id: params.id,
    title: params.title,
    difficulty: params.difficulty,
    trails: params.trails,
  };
}

export function getWordTrailsBoard(puzzle: WordTrailsPuzzle): string[] {
  return puzzle.trails.flatMap(trail => trail.words);
}

export function validateWordTrailsPuzzle(puzzle: WordTrailsPuzzle): WordTrailsValidationResult {
  const errors: string[] = [];
  if (!puzzle.id.trim()) errors.push('Puzzle id is required.');
  if (!puzzle.title.trim()) errors.push(`Puzzle ${puzzle.id} needs a title.`);
  if (puzzle.trails.length !== 4) errors.push(`Puzzle ${puzzle.id} must have exactly 4 trails.`);

  const seen = new Set<string>();
  puzzle.trails.forEach((trail: WordTrail, trailIndex: number) => {
    if (trail.words.length !== 4) {
      errors.push(`Puzzle ${puzzle.id} trail ${trailIndex + 1} must have exactly 4 words.`);
    }
    if (!trail.label.trim()) {
      errors.push(`Puzzle ${puzzle.id} trail ${trailIndex + 1} needs a reveal label.`);
    }
    trail.words.forEach(word => {
      const normalised = word.trim().toUpperCase();
      if (!normalised) {
        errors.push(`Puzzle ${puzzle.id} trail ${trailIndex + 1} has an empty word.`);
      } else if (seen.has(normalised)) {
        errors.push(`Puzzle ${puzzle.id} repeats visible word ${normalised}.`);
      }
      seen.add(normalised);
    });
  });

  if (seen.size !== 16) errors.push(`Puzzle ${puzzle.id} must produce 16 unique visible words.`);
  return { valid: errors.length === 0, errors };
}

export function validateWordTrailsPuzzles(puzzles: WordTrailsPuzzle[]): WordTrailsValidationResult {
  const ids = new Set<string>();
  const errors: string[] = [];

  puzzles.forEach(puzzle => {
    if (ids.has(puzzle.id)) errors.push(`Duplicate puzzle id ${puzzle.id}.`);
    ids.add(puzzle.id);
    errors.push(...validateWordTrailsPuzzle(puzzle).errors);
  });

  return { valid: errors.length === 0, errors };
}

export function getDailyWordTrailsPuzzle(puzzles: WordTrailsPuzzle[], now = new Date()): WordTrailsPuzzle {
  const start = new Date('2026-06-09T00:00:00Z').getTime();
  const dayIndex = Math.max(0, Math.floor((now.getTime() - start) / 86400000));
  return puzzles[dayIndex % puzzles.length];
}

export function getRandomWordTrailsPuzzle(puzzles: WordTrailsPuzzle[]): WordTrailsPuzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

export async function markWordTrailsCompleted(
  puzzleId: string,
  result: Omit<WordTrailsResult, 'completedAt'>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(WORD_TRAILS_RESULTS_KEY);
    const map: Record<string, WordTrailsResult> = raw ? JSON.parse(raw) : {};
    map[puzzleId] = { ...result, completedAt: new Date().toISOString() };
    await AsyncStorage.setItem(WORD_TRAILS_RESULTS_KEY, JSON.stringify(map));
  } catch {}
}

export async function getCompletedWordTrailsIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(WORD_TRAILS_RESULTS_KEY);
    if (!raw) return new Set();
    const map: Record<string, WordTrailsResult> = JSON.parse(raw);
    return new Set(Object.entries(map).filter(([, result]) => result.completed).map(([id]) => id));
  } catch {
    return new Set();
  }
}
