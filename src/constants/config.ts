// Empty string = same origin (nginx proxy in Docker)
// Set EXPO_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8094 for local dev
export const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL ?? '';

// AdMob IDs — replace with real IDs before production build
export const ADMOB_IDS = {
  android: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'  // test ID
      : 'ca-app-pub-REPLACE/REPLACE',
  },
  ios: {
    banner: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'  // test ID
      : 'ca-app-pub-REPLACE/REPLACE',
  },
};

// Web base URL for shareable links — update when domain changes
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://konnectd.xyz';

export const MAX_MISTAKES = 4;
export const MAX_HINTS = 3;
export const GRID_SIZE = 16;
export const GROUP_SIZE = 4;
