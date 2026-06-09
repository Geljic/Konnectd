import type { Puzzle } from '@/api/puzzles';
import { shuffle } from '@/utils/shuffle';

const categories = [
  {
    name: 'Things in a kitchen',
    colour: 'yellow' as const,
    words: ['KNIFE', 'SPATULA', 'WHISK', 'COLANDER'] as [string, string, string, string],
  },
  {
    name: 'Types of pasta',
    colour: 'green' as const,
    words: ['PENNE', 'FUSILLI', 'RIGATONI', 'ORZO'] as [string, string, string, string],
  },
  {
    name: '___ BALL',
    colour: 'blue' as const,
    words: ['SNOW', 'FIRE', 'ODD', 'CANNON'] as [string, string, string, string],
  },
  {
    name: 'Sounds like a number',
    colour: 'purple' as const,
    words: ['WON', 'TOO', 'FOR', 'ATE'] as [string, string, string, string],
  },
];

const allWords = categories.flatMap(c => c.words);

export const DEV_PUZZLE: Puzzle = {
  id: 'dev-puzzle-1',
  words: shuffle(allWords),
  categories,
  difficulty_min: 'yellow',
  daily_date: null,
  play_count: 0,
};
