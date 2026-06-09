import { useSettingsStore } from '@/store/settingsStore';
import { LIGHT_COLORS, DARK_COLORS, type ColorTheme } from '@/constants/colors';

export function useColors(): ColorTheme {
  const darkMode = useSettingsStore(s => s.darkMode);
  return darkMode ? DARK_COLORS : LIGHT_COLORS;
}
