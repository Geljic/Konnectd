import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createChallenge, submitChallengeResult } from '@/api/challenges';
import type { CategoryColour } from '@/constants/colors';
import type { GameType, Ruleset } from '@/constants/gameModes';
import type { AppStackParamList } from '../App';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export interface ChallengeFinishParams {
  challengeId?: string;
  recipientId?: string;
  recipientName?: string;
}

export interface ChallengeFinishResult {
  gameType: GameType;
  gameMode: Ruleset;
  puzzleId: string;
  puzzleLabel: string;
  puzzleCollection?: 'puzzles' | 'nyt_puzzles';
  mistakes: number;
  durationSeconds: number;
  solvedOrder: CategoryColour[];
  score?: number;
}

/**
 * Shared end-of-game challenge handling for all game modes.
 *
 * `isChallenge` lets a screen skip its normal result UI and route to the
 * challenge result screen instead. `finishChallenge` submits an opponent's
 * result, or creates a new challenge for a recipient, then navigates to
 * `ChallengeResult`.
 */
export function useChallengeFinish(params: ChallengeFinishParams) {
  const navigation = useNavigation<Nav>();
  const isChallenge = Boolean(params.challengeId || params.recipientId);

  async function finishChallenge(result: ChallengeFinishResult): Promise<void> {
    if (params.challengeId) {
      await submitChallengeResult(params.challengeId, {
        mistakes: result.mistakes,
        durationSeconds: result.durationSeconds,
        solvedOrder: result.solvedOrder,
        score: result.score,
      });
      navigation.navigate('ChallengeResult', { challengeId: params.challengeId });
      return;
    }
    if (params.recipientId) {
      const challenge = await createChallenge({
        puzzleId: result.puzzleId,
        puzzleCollection: result.puzzleCollection ?? 'puzzles',
        puzzleLabel: result.puzzleLabel,
        mistakes: result.mistakes,
        durationSeconds: result.durationSeconds,
        solvedOrder: result.solvedOrder,
        score: result.score,
        gameType: result.gameType,
        gameMode: result.gameMode,
        recipientId: params.recipientId,
      });
      if (challenge) navigation.navigate('ChallengeResult', { challengeId: challenge.id });
      else navigation.navigate('Home');
    }
  }

  return { isChallenge, finishChallenge };
}
