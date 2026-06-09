export const LIGHT_COLORS = {
  // Backgrounds
  bgBase:    '#CAE0D5',
  bgScreen:  '#EBF4EE',
  bgSurface: '#F6FBF8',

  // Tile states
  tileDefault:  '#F6FBF8',
  tileSelected: '#A8CFBA',

  // Category colours (same in both themes)
  yellow: '#F5C842',
  green:  '#3DBE8A',
  blue:   '#4AAEC8',
  purple: '#9D6EC8',

  categoryText: '#162219',

  // Typography
  text1: '#162219',
  text2: '#3D5C49',
  text3: '#7A9E8A',

  // Tile face
  tileEye:   '#162219',
  tileStrip: '#8EC4AA',
  tileFoot:  '#B8D4C4',

  // UI chrome
  border:  'rgba(20,60,35,0.08)',
  shadow:  'rgba(20,60,35,0.12)',

  // Feedback
  errorFlash: '#C84A4A',
  correct:    '#72B896',
};

export const DARK_COLORS = {
  bgBase:    '#1D2B25',
  bgScreen:  '#121A16',
  bgSurface: '#253029',

  tileDefault:  '#253029',
  tileSelected: '#2E4A3A',

  yellow: '#F5C842',
  green:  '#3DBE8A',
  blue:   '#4AAEC8',
  purple: '#9D6EC8',

  categoryText: '#162219',

  text1: '#E4F0EB',
  text2: '#8BB09C',
  text3: '#526E5E',

  tileEye:   '#E4F0EB',
  tileStrip: '#2E4A3A',
  tileFoot:  '#1D2B25',

  border:  'rgba(200,240,215,0.09)',
  shadow:  'rgba(0,0,0,0.4)',

  errorFlash: '#E05555',
  correct:    '#3DBE8A',
};

export type ColorTheme = typeof LIGHT_COLORS;

// Default export for components that don't yet use the theme hook
export const COLORS = LIGHT_COLORS;

export type CategoryColour = 'yellow' | 'green' | 'blue' | 'purple';

export const CATEGORY_COLOURS: Record<CategoryColour, string> = {
  yellow: COLORS.yellow,
  green:  COLORS.green,
  blue:   COLORS.blue,
  purple: COLORS.purple,
};

// Order from easiest to hardest — used for reveal sequence
export const CATEGORY_ORDER: CategoryColour[] = ['yellow', 'green', 'blue', 'purple'];
