import * as Clipboard from 'expo-clipboard';
import type { CategoryColour } from '@/constants/colors';
import { WEB_BASE_URL } from '@/constants/config';

const EMOJI: Record<CategoryColour, string> = {
  yellow: '🟨',
  green:  '🟩',
  blue:   '🟦',
  purple: '🟪',
};

export function buildShareText(
  _puzzleNumber: number | undefined,
  solvedOrder: CategoryColour[],
  mistakes: number,
  won: boolean,
  score?: number | null,
  challengeLink?: string,
): string {
  const scoreStr = won && score != null ? ` · ⭐ ${score} pts` : '';
  const result = won
    ? mistakes === 0 ? `Perfect! 🎉${scoreStr}` : `${mistakes} mistake${mistakes > 1 ? 's' : ''}${scoreStr}`
    : 'Lost 💀';

  const rows = solvedOrder.map(c => Array(4).fill(EMOJI[c]).join('')).join('\n');

  const cta = challengeLink
    ? `⚡ Think you can beat me?\n${challengeLink}`
    : `Play KonnectD 👇\n${WEB_BASE_URL}`;

  return `KonnectD\n${result}\n\n${rows}\n\n${cta}`;
}

export async function copyShareText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
