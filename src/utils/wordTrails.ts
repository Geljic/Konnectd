import type { WordTrail, WordTrailsPuzzle } from '@/data/wordTrailsPuzzles';

export interface WordTrailsValidationResult {
  valid: boolean;
  errors: string[];
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
