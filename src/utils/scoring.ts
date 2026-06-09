import type { CategoryColour } from '@/constants/colors';

const DIFFICULTY_POINTS: Record<CategoryColour, number> = {
  purple: 400,
  blue:   300,
  green:  200,
  yellow: 100,
};

// Hard-first order for the order bonus
const HARD_FIRST: CategoryColour[] = ['purple', 'blue', 'green', 'yellow'];

export function calculateScore(
  solvedOrder: CategoryColour[],
  mistakes: number,
  durationSeconds: number,
  hintPenalty = 0,
): number {
  const base = solvedOrder.reduce((sum, c) => sum + (DIFFICULTY_POINTS[c] ?? 0), 0);

  // +50 per category that continues the hard-first chain unbroken from the start
  let orderBonus = 0;
  let chainIdx = -1;
  let chainBroken = false;
  for (const colour of solvedOrder) {
    if (chainBroken) break;
    const idx = HARD_FIRST.indexOf(colour);
    if (idx === chainIdx + 1) {
      orderBonus += 50;
      chainIdx = idx;
    } else {
      chainBroken = true;
    }
  }

  const misPenalty = mistakes * 75;

  // 2 pts/second decay — fast solves earn meaningfully more than slow ones
  const timeBonus = Math.max(0, 400 - durationSeconds * 2);

  return Math.max(0, base + orderBonus - misPenalty - hintPenalty + timeBonus);
}
