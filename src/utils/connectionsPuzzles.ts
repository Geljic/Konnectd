import type { Puzzle } from '@/api/puzzles';
import type { CategoryColour } from '@/constants/colors';
import { CONNECTIONS_PUZZLE_SEEDS, type CuratedSeed } from '@/data/connectionsPuzzles';
import { shuffle } from '@/utils/shuffle';

const REQUIRED_COLOURS: CategoryColour[] = ['yellow', 'green', 'blue', 'purple'];

export interface CuratedValidationResult {
  valid: boolean;
  errors: string[];
}

/** Turn a static seed into a playable Puzzle (board shuffled). */
export function buildCuratedPuzzle(seed: CuratedSeed): Puzzle {
  const words = seed.categories.flatMap(c => c.words);
  return {
    id: seed.id,
    words: shuffle(words),
    categories: seed.categories,
    // difficulty_min carries the OVERALL rating (Easy→Expert), not the easiest row.
    difficulty_min: seed.difficulty,
    daily_date: null,
    play_count: 0,
  };
}

export const CONNECTIONS_PUZZLES: Puzzle[] = CONNECTIONS_PUZZLE_SEEDS.map(buildCuratedPuzzle);

export function validateCuratedSeed(seed: CuratedSeed): CuratedValidationResult {
  const errors: string[] = [];
  if (!seed.id.trim()) errors.push('Seed is missing an id.');
  if (!seed.title.trim()) errors.push(`Seed ${seed.id} needs a title.`);
  if (seed.categories.length !== 4) errors.push(`Seed ${seed.id} must have exactly 4 categories.`);
  if (!REQUIRED_COLOURS.includes(seed.difficulty)) errors.push(`Seed ${seed.id} has an invalid difficulty "${seed.difficulty}".`);

  const colours = seed.categories.map(c => c.colour);
  for (const required of REQUIRED_COLOURS) {
    if (!colours.includes(required)) errors.push(`Seed ${seed.id} is missing the ${required} category.`);
  }

  const seen = new Set<string>();
  seed.categories.forEach((cat, i) => {
    if (cat.words.length !== 4) errors.push(`Seed ${seed.id} category ${i + 1} ("${cat.name}") must have 4 words.`);
    if (!cat.name.trim()) errors.push(`Seed ${seed.id} category ${i + 1} needs a name.`);
    cat.words.forEach(word => {
      const norm = word.trim().toUpperCase();
      if (!norm) errors.push(`Seed ${seed.id} has an empty word in "${cat.name}".`);
      else if (seen.has(norm)) errors.push(`Seed ${seed.id} repeats the word ${norm}.`);
      seen.add(norm);
    });
  });

  if (seen.size !== 16) errors.push(`Seed ${seed.id} must produce 16 unique words (got ${seen.size}).`);
  return { valid: errors.length === 0, errors };
}

export function validateCuratedSeeds(seeds: CuratedSeed[] = CONNECTIONS_PUZZLE_SEEDS): CuratedValidationResult {
  const ids = new Set<string>();
  const errors: string[] = [];
  seeds.forEach(seed => {
    if (ids.has(seed.id)) errors.push(`Duplicate seed id ${seed.id}.`);
    ids.add(seed.id);
    errors.push(...validateCuratedSeed(seed).errors);
  });
  return { valid: errors.length === 0, errors };
}
