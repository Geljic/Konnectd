export type GameType = 'connections' | 'word_trails';
export type GroupsRuleset = 'normal' | 'hard';
export type WordTrailsRuleset = 'classic';
export type Ruleset = GroupsRuleset | WordTrailsRuleset;

export const DEFAULT_GAME_TYPE: GameType = 'connections';
export const DEFAULT_GROUPS_RULESET: GroupsRuleset = 'normal';

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  connections: 'Groups',
  word_trails: 'Next Steps',
};

export const RULESET_LABELS: Record<Ruleset, string> = {
  normal: 'Normal',
  hard: 'Hard',
  classic: 'Classic',
};

export function normaliseGameType(value: unknown): GameType {
  return value === 'word_trails' ? 'word_trails' : DEFAULT_GAME_TYPE;
}

export function normaliseRuleset(value: unknown, gameType: GameType = DEFAULT_GAME_TYPE): Ruleset {
  if (gameType === 'word_trails') return 'classic';
  return value === 'hard' ? 'hard' : DEFAULT_GROUPS_RULESET;
}
