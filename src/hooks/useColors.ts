import { useSettingsStore } from '@/store/settingsStore';
import { LIGHT_COLORS, DARK_COLORS, type ColorTheme } from '@/constants/colors';
import { useMonetisationStore } from '@/store/monetisationStore';

const GARDEN_POP_LIGHT: ColorTheme = {
  ...LIGHT_COLORS,
  bgBase: '#DDE6FF',
  bgScreen: '#F5F7FF',
  bgSurface: '#FFFFFF',
  tileDefault: '#FFFFFF',
  tileSelected: '#FAEAF0',  // pale pink blush — matches strip hue
  tileStrip: '#F0A1B7',
  tileFoot: '#B8D4FF',
  text1: '#18223C',
  text2: '#495E88',
  text3: '#7D8BAA',
  border: 'rgba(24,34,60,0.10)',
  shadow: 'rgba(24,34,60,0.13)',
};

const GARDEN_POP_DARK: ColorTheme = {
  ...DARK_COLORS,
  bgBase: '#202A44',
  bgScreen: '#101521',
  bgSurface: '#1B2235',
  tileDefault: '#232D44',
  tileSelected: '#2D1525',  // deep plum — matches strip hue
  tileStrip: '#D8789A',
  tileFoot: '#314365',
  text1: '#F3F6FF',
  text2: '#BAC7E6',
  text3: '#7886AA',
  border: 'rgba(220,230,255,0.11)',
  shadow: 'rgba(0,0,0,0.45)',
};

export function useColors(): ColorTheme {
  const darkMode = useSettingsStore(s => s.darkMode);
  const cosmeticTheme = useSettingsStore(s => s.cosmeticTheme);
  const cosmeticPackOwned = useMonetisationStore(s => s.isCosmeticPackOwned());
  if (cosmeticTheme === 'gardenPop' && cosmeticPackOwned) {
    return darkMode ? GARDEN_POP_DARK : GARDEN_POP_LIGHT;
  }
  return darkMode ? DARK_COLORS : LIGHT_COLORS;
}
