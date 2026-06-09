import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STRIP_CONFIG = {
  tiny: { height: 10, viewBox: '0 0 80 40' },
  tall: { height: 22, viewBox: '0 0 80 40' },
  peek: { height: 18, viewBox: '0 5 80 20' },
  big:  { height: 28, viewBox: '0 0 80 40' },
} as const;

export type TileStripStyle = keyof typeof STRIP_CONFIG;
export type CosmeticTheme = 'classic' | 'gardenPop';

interface SettingsState {
  hardMode: boolean;
  notificationsEnabled: boolean;
  challengeNotificationsEnabled: boolean;
  darkMode: boolean;
  tileStripStyle: TileStripStyle;
  cosmeticTheme: CosmeticTheme;
  loaded: boolean;

  load: () => Promise<void>;
  setHardMode: (val: boolean) => Promise<void>;
  setNotificationsEnabled: (val: boolean) => Promise<void>;
  setChallengeNotificationsEnabled: (val: boolean) => Promise<void>;
  setDarkMode: (val: boolean) => Promise<void>;
  setTileStripStyle: (val: TileStripStyle) => Promise<void>;
  setCosmeticTheme: (val: CosmeticTheme) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hardMode: false,
  notificationsEnabled: false,
  challengeNotificationsEnabled: true,
  darkMode: false,
  tileStripStyle: 'big',
  cosmeticTheme: 'gardenPop',
  loaded: false,

  async load() {
    try {
      const [hard, notif, challengeNotif, dark, strip, cosmeticTheme] = await Promise.all([
        AsyncStorage.getItem('setting_hard_mode'),
        AsyncStorage.getItem('setting_notifications'),
        AsyncStorage.getItem('setting_challenge_notifications'),
        AsyncStorage.getItem('setting_dark_mode'),
        AsyncStorage.getItem('setting_tile_strip'),
        AsyncStorage.getItem('setting_cosmetic_theme'),
      ]);
      set({
        hardMode: hard === 'true',
        notificationsEnabled: notif === 'true',
        // default true — new installs get challenge notifications on
        challengeNotificationsEnabled: challengeNotif === null ? true : challengeNotif === 'true',
        darkMode: dark === 'true',
        tileStripStyle: (strip as TileStripStyle) ?? 'big',
        cosmeticTheme: cosmeticTheme === 'classic' ? 'classic' : 'gardenPop',
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  async setHardMode(val) {
    set({ hardMode: val });
    await AsyncStorage.setItem('setting_hard_mode', String(val));
  },

  async setNotificationsEnabled(val) {
    set({ notificationsEnabled: val });
    await AsyncStorage.setItem('setting_notifications', String(val));
  },

  async setChallengeNotificationsEnabled(val) {
    set({ challengeNotificationsEnabled: val });
    await AsyncStorage.setItem('setting_challenge_notifications', String(val));
  },

  async setDarkMode(val) {
    set({ darkMode: val });
    await AsyncStorage.setItem('setting_dark_mode', String(val));
  },

  async setTileStripStyle(val) {
    set({ tileStripStyle: val });
    await AsyncStorage.setItem('setting_tile_strip', val);
  },

  async setCosmeticTheme(val) {
    set({ cosmeticTheme: val });
    await AsyncStorage.setItem('setting_cosmetic_theme', val);
  },
}));
