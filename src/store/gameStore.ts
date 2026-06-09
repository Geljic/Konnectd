import { create } from 'zustand';
import type { Puzzle, PuzzleCategory } from '@/api/puzzles';
import type { CategoryColour } from '@/constants/colors';
import { CATEGORY_ORDER } from '@/constants/colors';
import { MAX_MISTAKES, MAX_HINTS } from '@/constants/config';
import type { ConnectionsRuleset } from '@/constants/gameModes';

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export type GameMode = ConnectionsRuleset;

export type HintTier = 'warmcold' | 'wordreveal' | 'categorypeek';
export const HINT_COSTS: Record<HintTier, number> = {
  warmcold: 100,
  wordreveal: 150,
  categorypeek: 200,
};

export type HintResult =
  | { tier: 'warmcold'; matchCount: number }
  | { tier: 'wordreveal'; word: string; colour: CategoryColour }
  | { tier: 'categorypeek'; categoryName: string };

interface GameState {
  puzzle: Puzzle | null;
  boardWords: string[];
  selectedWords: string[];
  solvedCategories: PuzzleCategory[];
  pendingCategory: PuzzleCategory | null;
  mistakes: number;
  status: GameStatus;
  toastMessage: string | null;
  solvedOrder: CategoryColour[];
  startTime: number | null;
  currentMode: 'daily' | 'freeplay' | 'nyt' | null;
  currentPuzzleId: string | null;
  currentCollection: 'puzzles' | 'nyt_puzzles' | null;
  gameMode: GameMode;
  firstSolve: boolean;
  score: number | null;
  hintsUsed: number;
  hintPenalty: number;
  rewardedHintTokens: number;

  loadPuzzle: (puzzle: Puzzle, mode?: 'daily' | 'freeplay' | 'nyt', puzzleId?: string, gameMode?: GameMode, collection?: 'puzzles' | 'nyt_puzzles', firstSolve?: boolean) => void;
  restoreProgress: (solvedCategories: PuzzleCategory[], mistakes: number, elapsedMs: number) => void;
  toggleWord: (word: string) => void;
  submitGuess: () => { result: 'correct' | 'wrong' | 'oneaway'; category?: PuzzleCategory };
  commitSolve: () => void;
  shuffleBoard: () => void;
  clearSelection: () => void;
  dismissToast: () => void;
  setScore: (score: number | null) => void;
  grantRewardedHintToken: () => void;
  useHint: (tier: HintTier, isPremium?: boolean) => HintResult | null;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  boardWords: [],
  selectedWords: [],
  solvedCategories: [],
  pendingCategory: null,
  mistakes: 0,
  status: 'idle',
  toastMessage: null,
  solvedOrder: [],
  startTime: null,
  currentMode: null,
  currentPuzzleId: null,
  currentCollection: null,
  gameMode: 'normal',
  firstSolve: true,
  score: null,
  hintsUsed: 0,
  hintPenalty: 0,
  rewardedHintTokens: 0,

  loadPuzzle(puzzle, mode, puzzleId, gameMode = 'normal', collection, firstSolve = true) {
    const words = [...puzzle.words];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    set({
      puzzle,
      boardWords: words,
      selectedWords: [],
      solvedCategories: [],
      pendingCategory: null,
      mistakes: 0,
      status: 'playing',
      toastMessage: null,
      solvedOrder: [],
      startTime: Date.now(),
      currentMode: mode ?? null,
      currentPuzzleId: puzzleId ?? puzzle.id ?? null,
      currentCollection: collection ?? null,
      gameMode,
      firstSolve,
      score: null,
      hintsUsed: 0,
      hintPenalty: 0,
      rewardedHintTokens: 0,
    });
  },

  restoreProgress(solvedCategories, mistakes, elapsedMs) {
    const { puzzle } = get();
    if (!puzzle) return;
    const solvedWords = new Set(solvedCategories.flatMap(c => c.words));
    const remaining = puzzle.words.filter(w => !solvedWords.has(w));
    const solvedOrder = solvedCategories.map(c => c.colour);
    set({
      solvedCategories,
      boardWords: remaining,
      mistakes,
      solvedOrder,
      startTime: Date.now() - elapsedMs,
    });
  },

  toggleWord(word) {
    const { selectedWords, status, pendingCategory } = get();
    if (status !== 'playing' || pendingCategory !== null) return;
    if (selectedWords.includes(word)) {
      set({ selectedWords: selectedWords.filter(w => w !== word) });
    } else if (selectedWords.length < 4) {
      set({ selectedWords: [...selectedWords, word] });
    }
  },

  submitGuess() {
    const { selectedWords, puzzle, solvedCategories, mistakes, gameMode } = get();
    if (!puzzle || selectedWords.length !== 4) return { result: 'wrong' };

    const matchedCategory = puzzle.categories.find(cat =>
      cat.words.every(w => selectedWords.includes(w)) &&
      selectedWords.every(w => cat.words.includes(w))
    );

    if (matchedCategory) {
      // Hard mode: must solve categories hardest-first (purple → blue → green → yellow)
      if (gameMode === 'hard') {
        const unsolvedColours = puzzle.categories
          .filter(c => !solvedCategories.some(s => s.name === c.name))
          .map(c => c.colour);
        const hardestUnsolved = unsolvedColours.reduce((max, c) =>
          CATEGORY_ORDER.indexOf(c) > CATEGORY_ORDER.indexOf(max) ? c : max
        );
        if (matchedCategory.colour !== hardestUnsolved) {
          const newMistakes = mistakes + 1;
          const lost = newMistakes >= MAX_MISTAKES;
          set({
            mistakes: newMistakes,
            status: lost ? 'lost' : 'playing',
            toastMessage: 'Solve the harder ones first!',
            selectedWords: [],
          });
          return { result: 'wrong' };
        }
      }

      set({
        pendingCategory: matchedCategory,
        selectedWords: [],
        solvedOrder: [...get().solvedOrder, matchedCategory.colour],
      });
      return { result: 'correct', category: matchedCategory };
    }

    // Check one-away: any category has exactly 3 of 4 selected
    const isOneAway = puzzle.categories.some(cat => {
      const overlap = selectedWords.filter(w => cat.words.includes(w)).length;
      return overlap === 3;
    });

    const newMistakes = mistakes + 1;
    const lost = newMistakes >= MAX_MISTAKES;
    set({
      mistakes: newMistakes,
      status: lost ? 'lost' : 'playing',
      toastMessage: isOneAway && !lost ? 'One away…' : null,
      selectedWords: [],
    });
    return { result: isOneAway ? 'oneaway' : 'wrong' };
  },

  commitSolve() {
    const { pendingCategory, solvedCategories, boardWords } = get();
    if (!pendingCategory) return;
    const newSolved = [...solvedCategories, pendingCategory];
    const won = newSolved.length === 4;
    set({
      solvedCategories: newSolved,
      boardWords: boardWords.filter(w => !pendingCategory.words.includes(w)),
      pendingCategory: null,
      status: won ? 'won' : 'playing',
    });
  },

  shuffleBoard() {
    const { boardWords } = get();
    const shuffled = [...boardWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    set({ boardWords: shuffled });
  },

  clearSelection() {
    set({ selectedWords: [] });
  },

  dismissToast() {
    set({ toastMessage: null });
  },

  setScore(score) {
    set({ score });
  },

  grantRewardedHintToken() {
    set({ rewardedHintTokens: get().rewardedHintTokens + 1 });
  },

  useHint(tier, isPremium = false) {
    const { puzzle, solvedCategories, selectedWords, hintsUsed, status, rewardedHintTokens } = get();
    if (!puzzle || status !== 'playing') return null;
    const usingRewardedToken = !isPremium && hintsUsed >= MAX_HINTS && rewardedHintTokens > 0;
    if (!isPremium && hintsUsed >= MAX_HINTS && !usingRewardedToken) return null;

    const cost = HINT_COSTS[tier];
    const unsolved = puzzle.categories.filter(
      c => !solvedCategories.some(s => s.name === c.name)
    );
    if (unsolved.length === 0) return null;

    set({
      hintsUsed: hintsUsed + 1,
      rewardedHintTokens: usingRewardedToken ? rewardedHintTokens - 1 : rewardedHintTokens,
      hintPenalty: get().hintPenalty + cost,
    });

    if (tier === 'warmcold') {
      const matchCount = unsolved.reduce((best, cat) => {
        const overlap = selectedWords.filter(w => cat.words.includes(w)).length;
        return Math.max(best, overlap);
      }, 0);
      return { tier: 'warmcold', matchCount };
    }

    if (tier === 'wordreveal') {
      const target = unsolved[Math.floor(Math.random() * unsolved.length)];
      const unrevealedWords = target.words.filter(w => !selectedWords.includes(w));
      const word = unrevealedWords[Math.floor(Math.random() * unrevealedWords.length)] ?? target.words[0];
      return { tier: 'wordreveal', word, colour: target.colour };
    }

    // categorypeek
    const target = unsolved[Math.floor(Math.random() * unsolved.length)];
    return { tier: 'categorypeek', categoryName: target.name };
  },

  reset() {
    set({
      puzzle: null,
      boardWords: [],
      selectedWords: [],
      solvedCategories: [],
      pendingCategory: null,
      mistakes: 0,
      status: 'idle',
      toastMessage: null,
      solvedOrder: [],
      startTime: null,
      currentMode: null,
      currentPuzzleId: null,
      currentCollection: null,
      gameMode: 'normal',
      firstSolve: true,
      score: null,
      hintsUsed: 0,
      hintPenalty: 0,
      rewardedHintTokens: 0,
    });
  },
}));
