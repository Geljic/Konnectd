import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_IDS } from '@/constants/config';
import { useMonetisationStore } from '@/store/monetisationStore';

export function AdBanner() {
  const supporter = useMonetisationStore(s => s.isSupporter());
  if (supporter) return null;

  const adUnitId = Platform.OS === 'ios'
    ? ADMOB_IDS.ios.banner
    : ADMOB_IDS.android.banner;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
