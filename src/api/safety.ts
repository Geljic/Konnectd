import pb from './pb';

export type ReportTargetType = 'user' | 'puzzle';

export interface SafetyActionResult {
  ok: boolean;
  error?: string;
}

export async function createReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  targetUserId?: string;
}): Promise<SafetyActionResult> {
  if (!pb.authStore.isValid) return { ok: false, error: 'Sign in to send reports.' };
  try {
    const report: Record<string, unknown> = {
      reporter: pb.authStore.model?.id,
      target_type: params.targetType,
      target_id: params.targetId,
      reason: params.reason,
      details: params.details ?? '',
      status: 'open',
    };
    if (params.targetUserId) report.target_user = params.targetUserId;

    await pb.collection('reports').create(report);
    return { ok: true };
  } catch (e) {
    console.error('[createReport] error:', e);
    return { ok: false, error: getPocketBaseError(e) };
  }
}

export async function blockUser(blockedUserId: string): Promise<SafetyActionResult> {
  if (!pb.authStore.isValid) return { ok: false, error: 'Sign in to block players.' };
  try {
    await pb.collection('user_blocks').create({
      blocker: pb.authStore.model?.id,
      blocked: blockedUserId,
    });
    return { ok: true };
  } catch (e) {
    console.error('[blockUser] error:', e);
    return { ok: false, error: getPocketBaseError(e) };
  }
}

export async function hasBlockBetween(userId: string): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  const myId = pb.authStore.model?.id;
  try {
    await pb.collection('user_blocks').getFirstListItem(
      pb.filter(
        '(blocker = {:myId} && blocked = {:userId}) || (blocker = {:userId} && blocked = {:myId})',
        { myId, userId },
      ),
      { requestKey: null },
    );
    return true;
  } catch {
    return false;
  }
}

function getPocketBaseError(e: unknown): string {
  const err = e as { message?: string; response?: { message?: string; data?: Record<string, { message?: string }> } };
  const fieldError = err.response?.data
    ? Object.values(err.response.data).map(value => value?.message).find(Boolean)
    : undefined;
  return fieldError || err.response?.message || err.message || 'Please try again in a moment.';
}
