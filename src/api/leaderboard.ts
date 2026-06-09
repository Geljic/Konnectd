import pb from './pb';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  handle: string;
  rank: number;
  winRate: number;
  puzzlesWon: number;
  puzzlesPlayed: number;
  streakCurrent: number;
  streakBest: number;
  isMe: boolean;
}

export interface HeadToHead {
  myWins: number;
  theirWins: number;
  totalGames: number;
  myCurrentStreak: number;   // consecutive challenge wins for me right now
  iAmNemesis: boolean;       // they beat me more than I beat them
  theyAreNemesis: boolean;   // I beat them more
}

function mapEntry(r: Record<string, unknown>, myId: string, rank: number): LeaderboardEntry {
  const displayName = (r['display_name'] as string) || (r['name'] as string) || 'Unknown';
  const tag = (r['username_tag'] as number) || null;
  const played = (r['puzzles_played'] as number) || 0;
  const won = (r['puzzles_won'] as number) || 0;
  return {
    userId: r['id'] as string,
    displayName,
    handle: tag ? `${displayName}#${tag}` : displayName,
    rank,
    winRate: played > 0 ? Math.round((won / played) * 100) : 0,
    puzzlesWon: won,
    puzzlesPlayed: played,
    streakCurrent: (r['streak_current'] as number) || 0,
    streakBest: (r['streak_best'] as number) || 0,
    isMe: r['id'] === myId,
  };
}

export async function fetchFriendsLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id!;
  try {
    // Get all accepted friendships to collect friend IDs
    const friendships = await pb.collection('friendships').getFullList({
      filter: `(requester = '${myId}' || addressee = '${myId}') && status = 'accepted'`,
      fields: 'requester,addressee',
      requestKey: null,
    });
    const friendIds = friendships.map(f =>
      f['requester'] === myId ? f['addressee'] as string : f['requester'] as string
    );
    // Include myself in the leaderboard
    const allIds = [myId, ...friendIds];
    if (allIds.length === 0) return [];
    // Fetch all user records in one query
    const idFilter = allIds.map(id => `id = '${id}'`).join(' || ');
    const users = await pb.collection('users').getFullList({
      filter: idFilter,
      fields: 'id,display_name,name,username_tag,puzzles_played,puzzles_won,streak_current,streak_best',
      requestKey: null,
    });
    // Sort by win rate desc, then total wins, then streak
    const sorted = users
      .map(u => mapEntry(u as unknown as Record<string, unknown>, myId, 0))
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.puzzlesWon !== a.puzzlesWon) return b.puzzlesWon - a.puzzlesWon;
        return b.streakCurrent - a.streakCurrent;
      });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  } catch (e) {
    console.error('[fetchFriendsLeaderboard] error:', e);
    return [];
  }
}

export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id!;
  try {
    // Fetch top 100 by wins with min 10 played — sort client-side by win rate
    const result = await pb.collection('users').getList(1, 100, {
      filter: 'puzzles_played >= 10',
      sort: '-puzzles_won',
      fields: 'id,display_name,name,username_tag,puzzles_played,puzzles_won,streak_current,streak_best',
      requestKey: null,
    });
    const sorted = result.items
      .map(u => mapEntry(u as unknown as Record<string, unknown>, myId, 0))
      .sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.puzzlesWon !== a.puzzlesWon) return b.puzzlesWon - a.puzzlesWon;
        return b.streakCurrent - a.streakCurrent;
      });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  } catch (e) {
    console.error('[fetchGlobalLeaderboard] error:', e);
    return [];
  }
}

export async function fetchHeadToHead(friendId: string): Promise<HeadToHead | null> {
  if (!pb.authStore.isValid) return null;
  const myId = pb.authStore.model?.id!;
  try {
    const challenges = await pb.collection('challenges').getFullList({
      filter: `((challenger = '${myId}' && opponent = '${friendId}') || (challenger = '${friendId}' && opponent = '${myId}')) && game_type = 'connections' && status = 'complete'`,
      sort: '-created',
      requestKey: null,
    });
    let myWins = 0;
    let theirWins = 0;
    let myCurrentStreak = 0;
    let streakBroken = false;

    for (const c of challenges) {
      const iAmChallenger = c['challenger'] === myId;
      const myMistakes = iAmChallenger ? (c['challenger_mistakes'] as number) : (c['opponent_mistakes'] as number ?? 99);
      const myTime = iAmChallenger ? (c['challenger_duration'] as number) : (c['opponent_duration'] as number ?? 99999);
      const theirMistakes = iAmChallenger ? (c['opponent_mistakes'] as number ?? 99) : (c['challenger_mistakes'] as number);
      const theirTime = iAmChallenger ? (c['opponent_duration'] as number ?? 99999) : (c['challenger_duration'] as number);

      const iWon = myMistakes < theirMistakes || (myMistakes === theirMistakes && myTime < theirTime);
      if (iWon) {
        myWins++;
        if (!streakBroken) myCurrentStreak++;
      } else {
        theirWins++;
        streakBroken = true;
      }
    }

    const total = challenges.length;
    return {
      myWins,
      theirWins,
      totalGames: total,
      myCurrentStreak,
      iAmNemesis: total >= 3 && theirWins > myWins,
      theyAreNemesis: total >= 3 && myWins > theirWins,
    };
  } catch (e) {
    console.error('[fetchHeadToHead] error:', e);
    return null;
  }
}
