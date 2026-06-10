// Empty string = same origin (nginx proxy in Docker)
// Set EXPO_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8094 for local dev
export const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ?? '';

// AdMob IDs — replace with real IDs before production build
export const ADMOB_IDS = {
  android: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'  // test ID
      : 'ca-app-pub-3782046166009217/9915761889',
    rewarded: __DEV__
      ? 'ca-app-pub-3940256099942544/5224354917'  // test ID
      : 'ca-app-pub-3782046166009217/4670837357',
  },
  ios: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'  // test ID
      : 'ca-app-pub-3782046166009217/3548493229',
    rewarded: __DEV__
      ? 'ca-app-pub-3940256099942544/1712485313'  // test ID
      : 'ca-app-pub-3782046166009217/3513129350',
  },
};

export const MONETISATION_PRODUCTS = {
  cosmeticsPack: {
    id: 'konnectd_cosmetics_garden_pop',
    label: 'Garden Pop Cosmetic Pack',
    priceLabel: '$1.99',
  },
  supportPass: {
    id: 'konnectd_support_pass',
    label: 'Supporter Pass',
    priceLabel: '$4.99',
  },
} as const;

// Web base URL for shareable links — update when domain changes
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://konnectd.xyz';
export const IAP_ENABLED = process.env.EXPO_PUBLIC_IAP_ENABLED === 'true';
export const LEGAL_URLS = {
  privacy: `${WEB_BASE_URL}/privacy`,
  terms: `${WEB_BASE_URL}/terms`,
  support: `${WEB_BASE_URL}/support`,
} as const;
export const DAILY_PUZZLE_LAUNCH_DATE = process.env.EXPO_PUBLIC_DAILY_PUZZLE_LAUNCH_DATE ?? '2026-06-09';

export const MAX_MISTAKES = 4;
export const MAX_HINTS = 3;
export const GRID_SIZE = 16;
export const GROUP_SIZE = 4;
