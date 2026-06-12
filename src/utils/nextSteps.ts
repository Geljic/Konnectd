import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NextStepsTrail, NextStepsPuzzle } from '@/data/nextStepsPuzzles';
import { addDailyDays, getDailyDate, getDailyIndexFrom } from '@/utils/dailyDate';

const NEXT_STEPS_RESULTS_KEY = 'word_trails_results';

export interface NextStepsValidationResult {
  valid: boolean;
  errors: string[];
}

export interface NextStepsResult {
  completed: boolean;
  mistakes: number;
  durationSeconds: number;
  solvedTrailLabels: string[];
  completedAt: string;
}

export function createNextStepsPuzzle(params: {
  id: string;
  title: string;
  difficulty: NextStepsPuzzle['difficulty'];
  trails: NextStepsPuzzle['trails'];
}): NextStepsPuzzle {
  return {
    id: params.id,
    title: params.title,
    difficulty: params.difficulty,
    trails: params.trails,
  };
}

export function getNextStepsBoard(puzzle: NextStepsPuzzle): string[] {
  return puzzle.trails.flatMap(trail => trail.words);
}

export function validateNextStepsPuzzle(puzzle: NextStepsPuzzle): NextStepsValidationResult {
  const errors: string[] = [];
  if (!puzzle.id.trim()) errors.push('Puzzle id is required.');
  if (!puzzle.title.trim()) errors.push(`Puzzle ${puzzle.id} needs a title.`);
  if (puzzle.trails.length !== 4) errors.push(`Puzzle ${puzzle.id} must have exactly 4 trails.`);

  const seen = new Set<string>();
  puzzle.trails.forEach((trail: NextStepsTrail, trailIndex: number) => {
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

export function validateNextStepsPuzzles(puzzles: NextStepsPuzzle[]): NextStepsValidationResult {
  const ids = new Set<string>();
  const errors: string[] = [];

  puzzles.forEach(puzzle => {
    if (ids.has(puzzle.id)) errors.push(`Duplicate puzzle id ${puzzle.id}.`);
    ids.add(puzzle.id);
    errors.push(...validateNextStepsPuzzle(puzzle).errors);
  });

  return { valid: errors.length === 0, errors };
}

export function getDailyNextStepsPuzzle(puzzles: NextStepsPuzzle[], now = new Date()): NextStepsPuzzle {
  const dayIndex = getDailyIndexFrom('2026-06-09T00:00:00Z', now);
  return puzzles[dayIndex % puzzles.length];
}

export function getRandomNextStepsPuzzle(puzzles: NextStepsPuzzle[]): NextStepsPuzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

export async function markNextStepsCompleted(
  puzzleId: string,
  result: Omit<NextStepsResult, 'completedAt'>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(NEXT_STEPS_RESULTS_KEY);
    const map: Record<string, NextStepsResult> = raw ? JSON.parse(raw) : {};
    map[puzzleId] = { ...result, completedAt: new Date().toISOString() };
    await AsyncStorage.setItem(NEXT_STEPS_RESULTS_KEY, JSON.stringify(map));
  } catch {}
}

export async function getCompletedNextStepsIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NEXT_STEPS_RESULTS_KEY);
    if (!raw) return new Set();
    const map: Record<string, NextStepsResult> = JSON.parse(raw);
    return new Set(Object.entries(map).filter(([, result]) => result.completed).map(([id]) => id));
  } catch {
    return new Set();
  }
}

export async function getNextStepsResult(puzzleId: string): Promise<NextStepsResult | null> {
  try {
    const raw = await AsyncStorage.getItem(NEXT_STEPS_RESULTS_KEY);
    if (!raw) return null;
    const map: Record<string, NextStepsResult> = JSON.parse(raw);
    return map[puzzleId] ?? null;
  } catch {
    return null;
  }
}

export interface NextStepsSessionItem {
  id: string;
  puzzle: string;
  completed: boolean;
  mistakes: number;
  durationSeconds: number;
  created: string;
}

export async function fetchLocalNextStepsSessions(): Promise<NextStepsSessionItem[]> {
  try {
    const raw = await AsyncStorage.getItem(NEXT_STEPS_RESULTS_KEY);
    if (!raw) return [];
    const map: Record<string, NextStepsResult> = JSON.parse(raw);
    return Object.entries(map)
      .map(([puzzleId, result]) => ({
        id: puzzleId,
        puzzle: puzzleId,
        completed: result.completed,
        mistakes: result.mistakes,
        durationSeconds: result.durationSeconds,
        created: result.completedAt,
      }))
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  } catch {
    return [];
  }
}

export function computeNextStepsStreak(sessions: NextStepsSessionItem[]): { current: number; best: number } {
  const completedDays = Array.from(
    new Set(sessions.filter(s => s.completed).map(s => s.created.split('T')[0]))
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

  // If today wasn't played, also allow yesterday to start streak
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

  // Compute best streak
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
  best = Math.max(best, run, current);

  return { current, best };
}
