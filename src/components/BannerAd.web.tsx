import React from 'react';
import { View } from 'react-native';
import { useMonetisationStore } from '@/store/monetisationStore';

// No-op on web — AdMob is native only
export function AdBanner() {
  useMonetisationStore(s => s.isSupporter());
  return <View />;
}
