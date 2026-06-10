import pb from './pb';
import { hasBlockBetween } from './safety';

export interface FriendUser {
  id: string;
  displayName: string;
  handle: string;
  streakCurrent: number;
  puzzlesWon: number;
}

export interface Friendship {
  id: string;
  requester: string;
  addressee: string;
  status: 'pending' | 'accepted';
  friend: FriendUser;
  isMine: boolean; // true = I sent this request
  created: string;
}

function mapUser(r: Record<string, unknown>): FriendUser {
  const displayName = (r['display_name'] as string) || (r['name'] as string) || 'Unknown';
  const tag = (r['username_tag'] as number) || null;
  return {
    id: r['id'] as string,
    displayName,
    handle: tag ? `${displayName}#${tag}` : displayName,
    streakCurrent: (r['streak_current'] as number) || 0,
    puzzlesWon: (r['puzzles_won'] as number) || 0,
  };
}

function mapFriendship(r: Record<string, unknown>, myId: string): Friendship {
  const isRequester = r['requester'] === myId;
  const expand = r['expand'] as Record<string, unknown> | undefined;
  const friendRecord = isRequester
    ? (expand?.['addressee'] as Record<string, unknown> | undefined)
    : (expand?.['requester'] as Record<string, unknown> | undefined);
  const friend = friendRecord
    ? mapUser(friendRecord)
    : { id: isRequester ? r['addressee'] as string : r['requester'] as string, displayName: '?', handle: '?', streakCurrent: 0, puzzlesWon: 0 };
  return {
    id: r['id'] as string,
    requester: r['requester'] as string,
    addressee: r['addressee'] as string,
    status: r['status'] as 'pending' | 'accepted',
    friend,
    isMine: isRequester,
    created: r['created'] as string,
  };
}

export async function searchUsers(query: string): Promise<FriendUser[]> {
  if (!pb.authStore.isValid || !query.trim()) return [];
  const myId = pb.authStore.model?.id;
  const hashIdx = query.lastIndexOf('#');
  let filter: string;
  if (hashIdx > 0) {
    const name = query.slice(0, hashIdx).replace(/'/g, "''");
    const tag = parseInt(query.slice(hashIdx + 1));
    filter = isNaN(tag)
      ? `display_name ~ '${name}' && id != '${myId}'`
      : `display_name ~ '${name}' && username_tag = ${tag} && id != '${myId}'`;
  } else {
    const q = query.replace(/'/g, "''");
    filter = `display_name ~ '${q}' && id != '${myId}'`;
  }
  try {
    const result = await pb.collection('users').getList(1, 20, {
      filter,
      fields: 'id,display_name,name,username_tag,streak_current,puzzles_won',
      requestKey: null,
    });
    return result.items.map(r => mapUser(r as unknown as Record<string, unknown>));
  } catch (e) {
    console.error('[searchUsers] error:', e);
    return [];
  }
}

async function fetchUserMap(ids: string[]): Promise<Map<string, FriendUser>> {
  if (ids.length === 0) return new Map();
  const idFilter = ids.map(id => `id = '${id}'`).join(' || ');
  const users = await pb.collection('users').getFullList({
    filter: idFilter,
    fields: 'id,display_name,name,username_tag,streak_current,puzzles_won',
    requestKey: null,
  });
  return new Map(users.map(u => [u['id'] as string, mapUser(u as unknown as Record<string, unknown>)]));
}

export async function fetchFriends(): Promise<Friendship[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id!;
  try {
    const result = await pb.collection('friendships').getFullList({
      filter: `(requester = '${myId}' || addressee = '${myId}') && status = 'accepted'`,
      fields: 'id,requester,addressee,status,created',
      requestKey: null,
    });
    if (result.length === 0) return [];
    const friendIds = result.map(r =>
      r['requester'] === myId ? r['addressee'] as string : r['requester'] as string
    );
    const userMap = await fetchUserMap(friendIds);
    return result.map(r => {
      const friendId = r['requester'] === myId ? r['addressee'] as string : r['requester'] as string;
      const friend = userMap.get(friendId) ?? { id: friendId, displayName: '?', handle: '?', streakCurrent: 0, puzzlesWon: 0 };
      return {
        id: r['id'] as string,
        requester: r['requester'] as string,
        addressee: r['addressee'] as string,
        status: r['status'] as 'pending' | 'accepted',
        friend,
        isMine: r['requester'] === myId,
        created: r['created'] as string,
      };
    });
  } catch (e) {
    console.error('[fetchFriends] error:', e);
    return [];
  }
}

export async function fetchPendingRequests(): Promise<Friendship[]> {
  if (!pb.authStore.isValid) return [];
  const myId = pb.authStore.model?.id!;
  try {
    const result = await pb.collection('friendships').getFullList({
      filter: `addressee = '${myId}' && status = 'pending'`,
      fields: 'id,requester,addressee,status,created',
      requestKey: null,
    });
    if (result.length === 0) return [];
    const requesterIds = result.map(r => r['requester'] as string);
    const userMap = await fetchUserMap(requesterIds);
    return result.map(r => {
      const friendId = r['requester'] as string;
      const friend = userMap.get(friendId) ?? { id: friendId, displayName: '?', handle: '?', streakCurrent: 0, puzzlesWon: 0 };
      return {
        id: r['id'] as string,
        requester: r['requester'] as string,
        addressee: r['addressee'] as string,
        status: r['status'] as 'pending' | 'accepted',
        friend,
        isMine: false,
        created: r['created'] as string,
      };
    });
  } catch (e) {
    console.error('[fetchPendingRequests] error:', e);
    return [];
  }
}

export async function sendFriendRequest(userId: string): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  try {
    if (await hasBlockBetween(userId)) return false;
    await pb.collection('friendships').create({
      requester: pb.authStore.model?.id,
      addressee: userId,
      status: 'pending',
    });
    return true;
  } catch (e) {
    console.error('[sendFriendRequest] error:', e);
    return false;
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<boolean> {
  try {
    await pb.collection('friendships').update(friendshipId, { status: 'accepted' });
    return true;
  } catch (e) {
    console.error('[acceptFriendRequest] error:', e);
    return false;
  }
}

export async function removeFriendship(friendshipId: string): Promise<boolean> {
  try {
    await pb.collection('friendships').delete(friendshipId);
    return true;
  } catch (e) {
    console.error('[removeFriendship] error:', e);
    return false;
  }
}

// Check if a friendship (any status) already exists with a user
export async function getFriendshipWith(userId: string): Promise<Friendship | null> {
  if (!pb.authStore.isValid) return null;
  const myId = pb.authStore.model?.id!;
  try {
    const r = await pb.collection('friendships').getFirstListItem(
      `(requester = '${myId}' && addressee = '${userId}') || (requester = '${userId}' && addressee = '${myId}')`,
      { requestKey: null }
    );
    return mapFriendship(r as unknown as Record<string, unknown>, myId);
  } catch {
    return null;
  }
}
