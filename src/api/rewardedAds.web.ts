export async function showRewardedHintAd(): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 600));
  return true;
}
