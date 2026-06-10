import pb from './pb';

export type ReportTargetType = 'user' | 'puzzle';

export async function createReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  targetUserId?: string;
}): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  try {
    await pb.collection('reports').create({
      reporter: pb.authStore.model?.id,
      target_type: params.targetType,
      target_id: params.targetId,
      target_user: params.targetUserId ?? null,
      reason: params.reason,
      details: params.details ?? '',
      status: 'open',
    });
    return true;
  } catch (e) {
    console.error('[createReport] error:', e);
    return false;
  }
}

export async function blockUser(blockedUserId: string): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  try {
    await pb.collection('user_blocks').create({
      blocker: pb.authStore.model?.id,
      blocked: blockedUserId,
    });
    return true;
  } catch (e) {
    console.error('[blockUser] error:', e);
    return false;
  }
}

export async function hasBlockBetween(userId: string): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  const myId = pb.authStore.model?.id;
  try {
    await pb.collection('user_blocks').getFirstListItem(
      `(blocker = '${myId}' && blocked = '${userId}') || (blocker = '${userId}' && blocked = '${myId}')`,
      { requestKey: null },
    );
    return true;
  } catch {
    return false;
  }
}
