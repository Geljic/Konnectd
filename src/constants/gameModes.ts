export type GameType = 'connections' | 'word_trails' | 'crossed_signals';
export type GroupsRuleset = 'normal' | 'hard';
export type WordTrailsRuleset = 'classic';
export type CrossedSignalsRuleset = 'classic';
export type Ruleset = GroupsRuleset | WordTrailsRuleset | CrossedSignalsRuleset;

export const DEFAULT_GAME_TYPE: GameType = 'connections';
export const DEFAULT_GROUPS_RULESET: GroupsRuleset = 'normal';

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  connections: 'Groups',
  word_trails: 'Next Steps',
  crossed_signals: 'Crossed Signals',
};

export const RULESET_LABELS: Record<Ruleset, string> = {
  normal: 'Normal',
  hard: 'Hard',
  classic: 'Classic',
};

export function normaliseGameType(value: unknown): GameType {
  if (value === 'crossed_signals') return 'crossed_signals';
  return value === 'word_trails' ? 'word_trails' : DEFAULT_GAME_TYPE;
}

export function normaliseRuleset(value: unknown, gameType: GameType = DEFAULT_GAME_TYPE): Ruleset {
  if (gameType === 'crossed_signals') return 'classic';
  if (gameType === 'word_trails') return 'classic';
  return value === 'hard' ? 'hard' : DEFAULT_GROUPS_RULESET;
}
