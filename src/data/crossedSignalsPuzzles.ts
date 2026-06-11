import { CROSSED_SIGNALS_GENERATED_PUZZLES } from './crossedSignalsGeneratedPuzzles';

export type CrossedSignalsDifficulty = 1 | 2 | 3 | 4 | 5;

export interface SignalAxis {
  id: string;
  label: string;
}

export interface CrossedSignalsCell {
  rowId: string;
  columnId: string;
  word: string;
  explanation?: string;
}

export interface CrossedSignalsPuzzle {
  id: string;
  title: string;
  difficulty: CrossedSignalsDifficulty;
  rows: SignalAxis[];
  columns: SignalAxis[];
  cells: CrossedSignalsCell[];
}

export const CROSSED_SIGNALS_SEED_PUZZLES: CrossedSignalsPuzzle[] = [
  {
    id: 'cs_001_double_meanings',
    title: 'Double Meanings',
    difficulty: 1,
    rows: [
      { id: 'cracked', label: 'Can be cracked' },
      { id: 'court', label: 'Found in court' },
      { id: 'shell', label: 'Has a shell' },
      { id: 'streamed', label: 'Can be streamed' },
    ],
    columns: [
      { id: 'food', label: 'Food' },
      { id: 'tech', label: 'Technology' },
      { id: 'sport', label: 'Sport' },
      { id: 'nature', label: 'Nature' },
    ],
    cells: [
      { rowId: 'cracked', columnId: 'food', word: 'EGG' },
      { rowId: 'cracked', columnId: 'tech', word: 'PASSWORD' },
      { rowId: 'cracked', columnId: 'sport', word: 'BAT' },
      { rowId: 'cracked', columnId: 'nature', word: 'ICE' },
      { rowId: 'court', columnId: 'food', word: 'DATES' },
      { rowId: 'court', columnId: 'tech', word: 'CASE' },
      { rowId: 'court', columnId: 'sport', word: 'TENNIS' },
      { rowId: 'court', columnId: 'nature', word: 'YARD' },
      { rowId: 'shell', columnId: 'food', word: 'TACO' },
      { rowId: 'shell', columnId: 'tech', word: 'TERMINAL' },
      { rowId: 'shell', columnId: 'sport', word: 'HELMET' },
      { rowId: 'shell', columnId: 'nature', word: 'TURTLE' },
      { rowId: 'streamed', columnId: 'food', word: 'SAUCE' },
      { rowId: 'streamed', columnId: 'tech', word: 'VIDEO' },
      { rowId: 'streamed', columnId: 'sport', word: 'MATCH' },
      { rowId: 'streamed', columnId: 'nature', word: 'RIVER' },
    ],
  },
  {
    id: 'cs_002_city_grid',
    title: 'City Grid',
    difficulty: 2,
    rows: [
      { id: 'runs', label: 'Can run' },
      { id: 'charged', label: 'Can be charged' },
      { id: 'opened', label: 'Can be opened' },
      { id: 'lines', label: 'Has lines' },
    ],
    columns: [
      { id: 'transport', label: 'Transport' },
      { id: 'money', label: 'Money' },
      { id: 'building', label: 'Building' },
      { id: 'communication', label: 'Communication' },
    ],
    cells: [
      { rowId: 'runs', columnId: 'transport', word: 'TRAIN' },
      { rowId: 'runs', columnId: 'money', word: 'TAB' },
      { rowId: 'runs', columnId: 'building', word: 'ELEVATOR' },
      { rowId: 'runs', columnId: 'communication', word: 'STORY' },
      { rowId: 'charged', columnId: 'transport', word: 'CARD' },
      { rowId: 'charged', columnId: 'money', word: 'FEE' },
      { rowId: 'charged', columnId: 'building', word: 'RENT' },
      { rowId: 'charged', columnId: 'communication', word: 'PHONE' },
      { rowId: 'opened', columnId: 'transport', word: 'ROUTE' },
      { rowId: 'opened', columnId: 'money', word: 'ACCOUNT' },
      { rowId: 'opened', columnId: 'building', word: 'DOOR' },
      { rowId: 'opened', columnId: 'communication', word: 'EMAIL' },
      { rowId: 'lines', columnId: 'transport', word: 'TRACKS' },
      { rowId: 'lines', columnId: 'money', word: 'QUEUE' },
      { rowId: 'lines', columnId: 'building', word: 'BLUEPRINT' },
      { rowId: 'lines', columnId: 'communication', word: 'SCRIPT' },
    ],
  },
  {
    id: 'cs_003_night_shift',
    title: 'Night Shift',
    difficulty: 2,
    rows: [
      { id: 'rings', label: 'Rings' },
      { id: 'falls', label: 'Falls' },
      { id: 'breaks', label: 'Breaks' },
      { id: 'watches', label: 'Watches' },
    ],
    columns: [
      { id: 'time', label: 'Time' },
      { id: 'weather', label: 'Weather' },
      { id: 'body', label: 'Body' },
      { id: 'security', label: 'Security' },
    ],
    cells: [
      { rowId: 'rings', columnId: 'time', word: 'ALARM' },
      { rowId: 'rings', columnId: 'weather', word: 'HALO' },
      { rowId: 'rings', columnId: 'body', word: 'EAR' },
      { rowId: 'rings', columnId: 'security', word: 'BELL' },
      { rowId: 'falls', columnId: 'time', word: 'NIGHT' },
      { rowId: 'falls', columnId: 'weather', word: 'RAIN' },
      { rowId: 'falls', columnId: 'body', word: 'HAIR' },
      { rowId: 'falls', columnId: 'security', word: 'CURTAIN' },
      { rowId: 'breaks', columnId: 'time', word: 'DAWN' },
      { rowId: 'breaks', columnId: 'weather', word: 'CLOUD' },
      { rowId: 'breaks', columnId: 'body', word: 'BONE' },
      { rowId: 'breaks', columnId: 'security', word: 'LOCK' },
      { rowId: 'watches', columnId: 'time', word: 'CLOCK' },
      { rowId: 'watches', columnId: 'weather', word: 'RADAR' },
      { rowId: 'watches', columnId: 'body', word: 'EYE' },
      { rowId: 'watches', columnId: 'security', word: 'GUARD' },
    ],
  },
  {
    id: 'cs_004_stage_fright',
    title: 'Stage Fright',
    difficulty: 3,
    rows: [
      { id: 'takes', label: 'Takes one' },
      { id: 'casts', label: 'Casts' },
      { id: 'plays', label: 'Plays' },
      { id: 'draws', label: 'Draws' },
    ],
    columns: [
      { id: 'theatre', label: 'Theatre' },
      { id: 'magic', label: 'Magic' },
      { id: 'games', label: 'Games' },
      { id: 'art', label: 'Art' },
    ],
    cells: [
      { rowId: 'takes', columnId: 'theatre', word: 'BOW' },
      { rowId: 'takes', columnId: 'magic', word: 'TRICK' },
      { rowId: 'takes', columnId: 'games', word: 'TURN' },
      { rowId: 'takes', columnId: 'art', word: 'PHOTO' },
      { rowId: 'casts', columnId: 'theatre', word: 'ACTOR' },
      { rowId: 'casts', columnId: 'magic', word: 'SPELL' },
      { rowId: 'casts', columnId: 'games', word: 'DICE' },
      { rowId: 'casts', columnId: 'art', word: 'SHADOW' },
      { rowId: 'plays', columnId: 'theatre', word: 'ROLE' },
      { rowId: 'plays', columnId: 'magic', word: 'CARD' },
      { rowId: 'plays', columnId: 'games', word: 'BOARD' },
      { rowId: 'plays', columnId: 'art', word: 'MUSIC' },
      { rowId: 'draws', columnId: 'theatre', word: 'CROWD' },
      { rowId: 'draws', columnId: 'magic', word: 'RABBIT' },
      { rowId: 'draws', columnId: 'games', word: 'LOT' },
      { rowId: 'draws', columnId: 'art', word: 'SKETCH' },
    ],
  },
  {
    id: 'cs_005_pressure_points',
    title: 'Pressure Points',
    difficulty: 4,
    rows: [
      { id: 'under', label: 'Under pressure' },
      { id: 'can_pop', label: 'Can pop' },
      { id: 'has_point', label: 'Has a point' },
      { id: 'keeps_score', label: 'Keeps score' },
    ],
    columns: [
      { id: 'kitchen', label: 'Kitchen' },
      { id: 'school', label: 'School' },
      { id: 'sport', label: 'Sport' },
      { id: 'space', label: 'Space' },
    ],
    cells: [
      { rowId: 'under', columnId: 'kitchen', word: 'COOKER' },
      { rowId: 'under', columnId: 'school', word: 'EXAM' },
      { rowId: 'under', columnId: 'sport', word: 'PENALTY' },
      { rowId: 'under', columnId: 'space', word: 'CABIN' },
      { rowId: 'can_pop', columnId: 'kitchen', word: 'CORN' },
      { rowId: 'can_pop', columnId: 'school', word: 'QUIZ' },
      { rowId: 'can_pop', columnId: 'sport', word: 'BALL' },
      { rowId: 'can_pop', columnId: 'space', word: 'STAR' },
      { rowId: 'has_point', columnId: 'kitchen', word: 'KNIFE' },
      { rowId: 'has_point', columnId: 'school', word: 'PENCIL' },
      { rowId: 'has_point', columnId: 'sport', word: 'ARROW' },
      { rowId: 'has_point', columnId: 'space', word: 'COMET' },
      { rowId: 'keeps_score', columnId: 'kitchen', word: 'TIMER' },
      { rowId: 'keeps_score', columnId: 'school', word: 'GRADE' },
      { rowId: 'keeps_score', columnId: 'sport', word: 'BOARD' },
      { rowId: 'keeps_score', columnId: 'space', word: 'MISSION' },
    ],
  },
];

export const CROSSED_SIGNALS_PUZZLES: CrossedSignalsPuzzle[] = [
  ...CROSSED_SIGNALS_SEED_PUZZLES,
  ...CROSSED_SIGNALS_GENERATED_PUZZLES,
];
