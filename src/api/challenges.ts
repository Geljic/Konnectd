import pb from './pb';
import type { CategoryColour } from '@/constants/colors';
import { WEB_BASE_URL } from '@/constants/config';

export interface Challenge {
  id: string;
  challenger: string;
  challengerName: string;
  challengerMistakes: number;
  challengerDuration: number;
  challengerSolvedOrder: CategoryColour[];
  puzzleId: string;
  puzzleCollection: 'puzzles' | 'nyt_puzzles';
  puzzleLabel: string;
  recipient: string | null;
  opponent: string | null;
  opponentName: string | null;
  opponentMistakes: number | null;
  opponentDuration: number | null;
  opponentSolvedOrder: CategoryColour[] | null;
  challengerScore: number | null;
  opponentScore: number | null;
  status: 'pending' | 'complete';
  expiresAt: string;
  created: string;
}

function mapChallenge(r: Record<string, unknown>): Challenge {
  return {
    id: r.id as string,
    challenger: r.challenger as string,
    challengerName: (r.challenger_name as string) || 'Someone',
    challengerMistakes: (r.challenger_mistakes as number) ?? 0,
    challengerDuration: (r.challenger_duration as number) ?? 0,
    challengerSolvedOrder: (r.challenger_solved_order as CategoryColour[]) ?? [],
    puzzleId: r.puzzle_id as string,
    puzzleCollection: r.puzzle_collection as 'puzzles' | 'nyt_puzzles',
    puzzleLabel: (r.puzzle_label as string) || 'a puzzle',
    recipient: (r.recipient as string) || null,
    opponent: (r.opponent as string) || null,
    opponentName: (r.opponent_name as string) || null,
    opponentMistakes: r.opponent_mistakes != null ? (r.opponent_mistakes as number) : null,
    opponentDuration: r.opponent_duration != null ? (r.opponent_duration as number) : null,
    opponentSolvedOrder: (r.opponent_solved_order as CategoryColour[]) || null,
    challengerScore: r.challenger_score != null ? (r.challenger_score as number) : null,
    opponentScore: r.opponent_score != null ? (r.opponent_score as number) : null,
    status: (r.status as 'pending' | 'complete'),
    expiresAt: r.expires_at as string,
    created: r.created as string,
  };
}

export async function createChallenge(params: {
  puzzleId: string;
  puzzleCollection: 'puzzles' | 'nyt_puzzles';
  puzzleLabel: string;
  mistakes: number;
  durationSeconds: number;
  solvedOrder: CategoryColour[];
  score?: number;
  recipientId?: string;
}): Promise<Challenge | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const record = await pb.collection('challenges').create({
      challenger: pb.authStore.model?.id,
      challenger_name: pb.authStore.model?.display_name
        ? `${pb.authStore.model.display_name}#${pb.authStore.model.username_tag ?? '????'}`
        : pb.authStore.model?.name || pb.authStore.model?.email,
      challenger_mistakes: params.mistakes,
      challenger_duration: params.durationSeconds,
      challenger_solved_order: params.solvedOrder,
      challenger_score: params.score ?? null,
      puzzle_id: params.puzzleId,
      puzzle_collection: params.puzzleCollection,
      puzzle_label: params.puzzleLabel,
      recipient: params.recipientId ?? null,
      status: 'pending',
      expires_at: expiresAt,
    });
    return mapChallenge(record as unknown as Record<string, unknown>);
  } catch (e) {
    console.error('[createChallenge] error:', e);
    return null;
  }
}

export async function fetchChallenge(challengeId: string): Promise<Challenge | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const record = await pb.collection('challenges').getOne(challengeId);
    return mapChallenge(record as unknown as Record<string, unknown>);
  } catch (e) {
    console.error('[fetchChallenge] error:', e);
    return null;
  }
}

export async function submitChallengeResult(
  challengeId: string,
  result: {
    mistakes: number;
    durationSeconds: number;
    solvedOrder: CategoryColour[];
    score?: number;
  },
): Promise<Challenge | null> {
  if (!pb.authStore.isValid) return null;
  try {
    const record = await pb.collection('challenges').update(challengeId, {
      opponent: pb.authStore.model?.id,
      opponent_name: pb.authStore.model?.name || pb.authStore.model?.email,
      opponent_mistakes: result.mistakes,
      opponent_duration: result.durationSeconds,
      opponent_solved_order: result.solvedOrder,
      opponent_score: result.score ?? null,
      status: 'complete',
    });
    return mapChallenge(record as unknown as Record<string, unknown>);
  } catch (e) {
    console.error('[submitChallengeResult] error:', e);
    return null;
  }
}

export async function fetchMyChallenges(): Promise<Challenge[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id;
  try {
    const result = await pb.collection('challenges').getList(1, 50, {
      filter: `challenger = '${myId}' || opponent = '${myId}' || recipient = '${myId}'`,
      sort: '-created',
    });
    return result.items.map(r => mapChallenge(r as unknown as Record<string, unknown>));
  } catch (e) {
    console.error('[fetchMyChallenges] error:', e);
    return [];
  }
}

export async function fetchPendingChallengesForMe(): Promise<Challenge[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id;
  try {
    const result = await pb.collection('challenges').getList(1, 20, {
      filter: `recipient = '${myId}' && status = 'pending'`,
      sort: '-created',
    });
    return result.items.map(r => mapChallenge(r as unknown as Record<string, unknown>));
  } catch (e) {
    console.error('[fetchPendingChallengesForMe] error:', e);
    return [];
  }
}

export function buildChallengeLink(challengeId: string): string {
  return `${WEB_BASE_URL}/challenge/${challengeId}`;
}

export function isExpired(challenge: Challenge): boolean {
  return new Date(challenge.expiresAt) < new Date();
}

export function isMine(challenge: Challenge): boolean {
  return challenge.challenger === pb.authStore.model?.id;
}
