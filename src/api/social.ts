import pb from './pb';
import { fetchMyChallenges, type Challenge } from './challenges';
import type { Friendship } from './friends';
import { normaliseGameType, normaliseRuleset, type GameType, type Ruleset } from '@/constants/gameModes';

export interface ChallengeMatch {
  id: string;
  puzzleLabel: string;
  gameType: GameType;
  gameMode: Ruleset;
  myMistakes: number;
  myDuration: number;
  myScore: number | null;
  theirMistakes: number;
  theirDuration: number;
  theirScore: number | null;
  iWon: boolean | null; // null = tie
  created: string;
}

export interface FriendSummary {
  friendshipId: string;
  friendId: string;
  friendHandle: string;
  friendDisplayName: string;
  friendStreakCurrent: number;
  friendPuzzlesWon: number;
  totalGames: number;
  myWins: number;
  theirWins: number;
  openChallengeId: string | null;
  lastPlayedAt: string | null;
  relationshipLabel: string;
  coStreak: number;
}

export function computeRelationshipLabel(
  myWins: number,
  theirWins: number,
  totalGames: number,
  isBestFrenemy: boolean,
): string {
  if (isBestFrenemy && totalGames >= 3) return 'Best Frenemy';
  if (totalGames === 0) return 'Friend';
  if (totalGames < 3) return 'New Rival';
  const myRate = myWins / totalGames;
  if (myRate > 0.7) return 'Their Nemesis';
  if (myRate < 0.3) return 'Your Nemesis';
  return 'Frenemy';
}

/** Determine the winner of a single challenge. Returns true if myId won, false if they lost, null for tie. */
function determineWinner(
  challenge: Challenge,
  myId: string,
): boolean | null {
  const amChallenger = challenge.challenger === myId;
  const myScore = amChallenger ? challenge.challengerScore : challenge.opponentScore;
  const theirScore = amChallenger ? challenge.opponentScore : challenge.challengerScore;
  const myMistakes = amChallenger ? challenge.challengerMistakes : (challenge.opponentMistakes ?? 0);
  const theirMistakes = amChallenger ? (challenge.opponentMistakes ?? 0) : challenge.challengerMistakes;
  const myDuration = amChallenger ? challenge.challengerDuration : (challenge.opponentDuration ?? 0);
  const theirDuration = amChallenger ? (challenge.opponentDuration ?? 0) : challenge.challengerDuration;

  // Primary: score comparison
  if (myScore !== null && theirScore !== null) {
    if (myScore > theirScore) return true;
    if (myScore < theirScore) return false;
    return null;
  }
  // Fallback: fewer mistakes wins
  if (myMistakes !== theirMistakes) return myMistakes < theirMistakes;
  // Fallback: shorter duration wins
  if (myDuration !== theirDuration) return myDuration < theirDuration;
  return null;
}

function computeCoStreak(myDates: Set<string>, friendDates: string[]): number {
  const shared = new Set(friendDates.filter(d => myDates.has(d)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // If neither of us played today yet, start checking from yesterday
  const today = cursor.toISOString().slice(0, 10);
  if (!shared.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const d = cursor.toISOString().slice(0, 10);
    if (!shared.has(d)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function fetchFriendSummaries(friends: Friendship[]): Promise<FriendSummary[]> {
  if (friends.length === 0) return [];

  const myId = pb.authStore.model?.id as string;

  // Fetch my session dates + all friends' session dates in two queries (not N+1)
  const friendIds = friends.map(f => f.friend.id);
  const allUserIds = [myId, ...friendIds];
  const idFilter = allUserIds.map(id => `user = '${id}'`).join(' || ');

  const [allChallenges, allSessions] = await Promise.all([
    fetchMyChallenges(),
    pb.collection('play_sessions').getFullList({
      filter: `(${idFilter}) && game_type = 'connections' && completed = true`,
      fields: 'user,created',
      requestKey: null,
    }).catch(() => [] as { user: string; created: string }[]),
  ]);

  // Build per-user date sets
  const sessionsByUser = new Map<string, string[]>();
  for (const s of allSessions as { user: string; created: string }[]) {
    const date = s.created.slice(0, 10);
    if (!sessionsByUser.has(s.user)) sessionsByUser.set(s.user, []);
    sessionsByUser.get(s.user)!.push(date);
  }
  const myDates = new Set(sessionsByUser.get(myId) ?? []);

  type FriendStats = {
    friendshipId: string;
    friendId: string;
    friendHandle: string;
    friendDisplayName: string;
    friendStreakCurrent: number;
    friendPuzzlesWon: number;
    totalGames: number;
    myWins: number;
    theirWins: number;
    openChallengeId: string | null;
    lastPlayedAt: string | null;
    coStreak: number;
  };

  const statsMap: FriendStats[] = friends.map(friendship => {
    const friendId = friendship.friend.id;

    // Challenges involving this friend (includes directed challenges via recipient)
    const relevant = allChallenges.filter(c => {
      const involves =
        (c.challenger === myId && (c.opponent === friendId || c.recipient === friendId)) ||
        (c.challenger === friendId && (c.opponent === myId || c.recipient === myId));
      return involves && c.gameType === 'connections';
    });

    const completed = relevant.filter(c => c.status === 'complete');
    const open = relevant.find(c => c.status !== 'complete') ?? null;

    let myWins = 0;
    let theirWins = 0;
    let lastPlayedAt: string | null = null;

    for (const c of completed) {
      const result = determineWinner(c, myId);
      if (result === true) myWins++;
      else if (result === false) theirWins++;
      // Track most recent
      if (!lastPlayedAt || c.created > lastPlayedAt) {
        lastPlayedAt = c.created;
      }
    }

    const coStreak = computeCoStreak(myDates, sessionsByUser.get(friendId) ?? []);

    return {
      friendshipId: friendship.id,
      friendId,
      friendHandle: friendship.friend.handle,
      friendDisplayName: friendship.friend.displayName,
      friendStreakCurrent: friendship.friend.streakCurrent,
      friendPuzzlesWon: friendship.friend.puzzlesWon,
      totalGames: completed.length,
      myWins,
      theirWins,
      openChallengeId: open ? open.id : null,
      lastPlayedAt,
      coStreak,
    };
  });

  // Find the friend with the highest totalGames (the "Best Frenemy")
  const maxGames = Math.max(...statsMap.map(s => s.totalGames));
  const bestFrenemyId = maxGames >= 3
    ? statsMap.find(s => s.totalGames === maxGames)?.friendId ?? null
    : null;

  const summaries: FriendSummary[] = statsMap.map(s => ({
    ...s,
    coStreak: s.coStreak,
    relationshipLabel: computeRelationshipLabel(
      s.myWins,
      s.theirWins,
      s.totalGames,
      s.friendId === bestFrenemyId,
    ),
  }));

  // Sort: open challenge first, then lastPlayedAt desc, then alpha by friendHandle
  summaries.sort((a, b) => {
    const aHasOpen = a.openChallengeId !== null ? 0 : 1;
    const bHasOpen = b.openChallengeId !== null ? 0 : 1;
    if (aHasOpen !== bHasOpen) return aHasOpen - bHasOpen;
    if (a.lastPlayedAt && b.lastPlayedAt) {
      return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
    }
    if (a.lastPlayedAt) return -1;
    if (b.lastPlayedAt) return 1;
    return a.friendHandle.localeCompare(b.friendHandle);
  });

  return summaries;
}

export async function fetchMatchHistory(friendId: string): Promise<ChallengeMatch[]> {
  const myId = pb.authStore.model?.id as string;
  if (!myId) return [];

  try {
    const result = await pb.collection('challenges').getFullList({
      filter: `((challenger = '${myId}' && opponent = '${friendId}') || (challenger = '${friendId}' && opponent = '${myId}')) && status = 'complete'`,
      sort: '-created',
      requestKey: `match-history-${friendId}`,
    });

    return result.map(r => {
      const rec = r as unknown as Record<string, unknown>;
      const amChallenger = (rec['challenger'] as string) === myId;

      const myMistakes = amChallenger
        ? ((rec['challenger_mistakes'] as number) ?? 0)
        : ((rec['opponent_mistakes'] as number) ?? 0);
      const myDuration = amChallenger
        ? ((rec['challenger_duration'] as number) ?? 0)
        : ((rec['opponent_duration'] as number) ?? 0);
      const myScore = amChallenger
        ? (rec['challenger_score'] != null ? (rec['challenger_score'] as number) : null)
        : (rec['opponent_score'] != null ? (rec['opponent_score'] as number) : null);

      const theirMistakes = amChallenger
        ? ((rec['opponent_mistakes'] as number) ?? 0)
        : ((rec['challenger_mistakes'] as number) ?? 0);
      const theirDuration = amChallenger
        ? ((rec['opponent_duration'] as number) ?? 0)
        : ((rec['challenger_duration'] as number) ?? 0);
      const theirScore = amChallenger
        ? (rec['opponent_score'] != null ? (rec['opponent_score'] as number) : null)
        : (rec['challenger_score'] != null ? (rec['challenger_score'] as number) : null);

      let iWon: boolean | null = null;
      if (myScore !== null && theirScore !== null) {
        if (myScore > theirScore) iWon = true;
        else if (myScore < theirScore) iWon = false;
        else iWon = null;
      } else if (myMistakes !== theirMistakes) {
        iWon = myMistakes < theirMistakes;
      } else if (myDuration !== theirDuration) {
        iWon = myDuration < theirDuration;
      }

      const gameType = normaliseGameType(rec['game_type']);
      return {
        id: rec['id'] as string,
        puzzleLabel: (rec['puzzle_label'] as string) || 'a puzzle',
        gameType,
        gameMode: normaliseRuleset(rec['game_mode'], gameType),
        myMistakes,
        myDuration,
        myScore,
        theirMistakes,
        theirDuration,
        theirScore,
        iWon,
        created: rec['created'] as string,
      };
    });
  } catch (e) {
    console.error('[fetchMatchHistory] error:', e);
    return [];
  }
}
