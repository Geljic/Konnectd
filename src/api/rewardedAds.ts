import { Platform } from 'react-native';

export async function showRewardedHintAd(): Promise<boolean> {
  const { RewardedAd, RewardedAdEventType, AdEventType } = await import('react-native-google-mobile-ads');
  const { ADMOB_IDS } = await import('@/constants/config');
  const unitId = Platform.OS === 'ios' ? ADMOB_IDS.ios.rewarded : ADMOB_IDS.android.rewarded;
  const rewarded = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise(resolve => {
    let settled = false;
    let earnedReward = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeLoaded = () => {};
    let unsubscribeEarned = () => {};
    let unsubscribeClosed = () => {};
    let unsubscribeError = () => {};

    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      resolve(value);
    };

    unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded.show().catch(() => settle(false));
    });
    unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedReward = true;
    });
    unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => settle(earnedReward));
    unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => settle(false));

    rewarded.load();
    timeout = setTimeout(() => settle(false), 20000);
  });
}
