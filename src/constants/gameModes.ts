export type GameType = 'connections' | 'word_trails';
export type ConnectionsRuleset = 'normal' | 'hard';
export type WordTrailsRuleset = 'classic';
export type Ruleset = ConnectionsRuleset | WordTrailsRuleset;

export const DEFAULT_GAME_TYPE: GameType = 'connections';
export const DEFAULT_CONNECTIONS_RULESET: ConnectionsRuleset = 'normal';

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  connections: 'Connections',
  word_trails: 'Wordlines',
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
  return value === 'hard' ? 'hard' : DEFAULT_CONNECTIONS_RULESET;
}
