import type { CuratedSeed } from '@/data/connectionsPuzzles';

/**
 * Dedicated DAILY puzzle pool for Groups/Connections — separate from the
 * free-play set in connectionsPuzzles.ts. scripts/import_daily_puzzles.ts assigns
 * each a sequential daily_date (one per day) so there is a real scheduled daily;
 * once a date passes, that puzzle stays playable in Free Play's Daily archive
 * (daily_date <= today). Imported with source 'daily', tags ['daily'].
 *
 * Same CuratedSeed shape + rules as connectionsPuzzles.ts; validate with
 * `python3 scripts/validate_curated.py src/data/dailyPuzzles.ts`.
 */
export const DAILY_PUZZLE_SEEDS: CuratedSeed[] = [
  {
    id: 'dp-001', title: 'Creature Comforts', difficulty: 'yellow', tags: ['daily'],
    categories: [
      { name: 'Pets', colour: 'yellow', words: ['DOG', 'CAT', 'FISH', 'HAMSTER'], explanation: 'Common household pets.' },
      { name: 'Footwear', colour: 'green', words: ['BOOT', 'SANDAL', 'SNEAKER', 'LOAFER'], explanation: 'On your feet.' },
      { name: 'Bedroom', colour: 'blue', words: ['PILLOW', 'BLANKET', 'MATTRESS', 'LAMP'], explanation: 'Where you sleep.' },
      { name: 'Things that ring', colour: 'purple', words: ['BELL', 'PHONE', 'ALARM', 'DOORBELL'], explanation: 'They make a sound.' },
    ],
  },
  {
    id: 'dp-002', title: 'Lunchbox', difficulty: 'yellow', tags: ['daily'],
    categories: [
      { name: 'Vegetables', colour: 'yellow', words: ['CARROT', 'POTATO', 'CELERY', 'PEA'], explanation: 'From the garden.' },
      { name: 'Zoo animals', colour: 'green', words: ['LION', 'ZEBRA', 'GIRAFFE', 'HIPPO'], explanation: 'Behind the enclosure.' },
      { name: 'Drinks', colour: 'blue', words: ['WATER', 'JUICE', 'MILK', 'SODA'], explanation: 'In the glass.' },
      { name: 'In a wallet', colour: 'purple', words: ['CASH', 'CARD', 'LICENSE', 'RECEIPT'], explanation: 'Open it up.' },
    ],
  },
  {
    id: 'dp-003', title: 'Slice of Life', difficulty: 'green', tags: ['daily'],
    categories: [
      { name: 'Pizza parts', colour: 'yellow', words: ['CRUST', 'CHEESE', 'SAUCE', 'TOPPING'], explanation: 'Build a pizza.' },
      { name: 'Italian foods', colour: 'green', words: ['PASTA', 'RISOTTO', 'GELATO', 'PANINI'], explanation: 'Buon appetito.' },
      { name: '___ BOARD', colour: 'blue', words: ['KEY', 'CHESS', 'DASH', 'CLIP'], explanation: 'Each precedes BOARD: keyboard, chessboard, dashboard, clipboard.' },
      { name: 'Hidden PEA', colour: 'purple', words: ['SPEAK', 'REPEAT', 'APPEAR', 'SPEAR'], explanation: 'Each hides PEA: sPEAk, rePEAt, apPEAr, sPEAr.' },
    ],
  },
  {
    id: 'dp-004', title: 'True Colours', difficulty: 'green', tags: ['daily'],
    categories: [
      { name: 'Rainbow colours', colour: 'yellow', words: ['RED', 'ORANGE', 'YELLOW', 'INDIGO'], explanation: 'Roy G. Biv.' },
      { name: 'Emotions', colour: 'green', words: ['ANGER', 'JOY', 'SADNESS', 'FEAR'], explanation: 'How you feel.' },
      { name: 'Cheerful', colour: 'blue', words: ['GLAD', 'MERRY', 'JOLLY', 'UPBEAT'], explanation: 'Synonyms for happy.' },
      { name: 'Hidden TAN', colour: 'purple', words: ['DISTANT', 'INSTANT', 'TARTAN', 'OCTANE'], explanation: 'Each hides TAN: disTANt, insTANt, tarTAN, ocTANe.' },
    ],
  },
  {
    id: 'dp-005', title: 'Money Talks', difficulty: 'blue', tags: ['daily'],
    categories: [
      { name: 'Currencies', colour: 'yellow', words: ['DOLLAR', 'EURO', 'YEN', 'POUND'], explanation: 'Spend it abroad. (POUND tempts weight.)' },
      { name: 'Martial arts', colour: 'green', words: ['KARATE', 'JUDO', 'KUNGFU', 'TAEKWONDO'], explanation: 'On the dojo mat.' },
      { name: 'British money slang', colour: 'blue', words: ['QUID', 'FIVER', 'TENNER', 'GRAND'], explanation: 'Cash, informally.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['DOOM', 'WARDS', 'TIPS', 'NAPS'], explanation: 'Backwards: mood, draws, spit, span.' },
    ],
  },
  {
    id: 'dp-006', title: 'Breakfast Club', difficulty: 'blue', tags: ['daily'],
    categories: [
      { name: 'Breakfast', colour: 'yellow', words: ['EGGS', 'BACON', 'PANCAKE', 'CEREAL'], explanation: 'First meal of the day.' },
      { name: 'Egg styles', colour: 'green', words: ['SCRAMBLED', 'POACHED', 'FRIED', 'BOILED'], explanation: 'How you like them.' },
      { name: 'Crack a ___', colour: 'blue', words: ['CODE', 'JOKE', 'WHIP', 'SAFE'], explanation: 'Crack a code, joke, whip, safe.' },
      { name: 'Hidden HEN', colour: 'purple', words: ['WHEN', 'THEN', 'KITCHEN', 'STRENGTHEN'], explanation: 'Each hides HEN: wHEN, tHEN, kitcHEN, strengtHEN.' },
    ],
  },
  {
    id: 'dp-007', title: 'Full House', difficulty: 'purple', tags: ['daily'],
    categories: [
      { name: 'Card games', colour: 'yellow', words: ['SOLITAIRE', 'EUCHRE', 'WHIST', 'RUMMY'], explanation: 'Dealt from a deck.' },
      { name: 'Hidden ACE', colour: 'green', words: ['PLACE', 'SPACE', 'TRACE', 'PALACE'], explanation: 'Each hides ACE: plACE, spACE, trACE, palACE.' },
      { name: 'Sound like letters', colour: 'blue', words: ['TEE', 'CUE', 'PEE', 'JAY'], explanation: 'Homophones of T, Q, P, J.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['LIAR', 'SWAP', 'TONS', 'GUM'], explanation: 'Backwards: rail, paws, snot, mug.' },
    ],
  },
  {
    id: 'dp-008', title: 'Plain and Simple', difficulty: 'yellow', tags: ['daily'],
    categories: [
      { name: 'Body parts', colour: 'yellow', words: ['ARM', 'LEG', 'HEAD', 'FOOT'], explanation: 'Parts of you.' },
      { name: 'Furniture', colour: 'green', words: ['CHAIR', 'TABLE', 'SOFA', 'DESK'], explanation: 'In the living room.' },
      { name: 'Weather', colour: 'blue', words: ['SUNNY', 'RAINY', 'CLOUDY', 'WINDY'], explanation: 'The forecast.' },
      { name: 'Counting', colour: 'purple', words: ['ONE', 'TWO', 'THREE', 'FOUR'], explanation: 'First four numbers.' },
    ],
  },
  {
    id: 'dp-009', title: 'Got Milk', difficulty: 'green', tags: ['daily'],
    categories: [
      { name: 'Dairy', colour: 'yellow', words: ['MILK', 'CHEESE', 'BUTTER', 'YOGURT'], explanation: 'From the fridge.' },
      { name: 'Cow words', colour: 'green', words: ['MOO', 'UDDER', 'CALF', 'HERD'], explanation: 'Down on the farm.' },
      { name: 'Milk types', colour: 'blue', words: ['ALMOND', 'OAT', 'SOY', 'COCONUT'], explanation: 'Plant-based milks.' },
      { name: 'Hidden OAT', colour: 'purple', words: ['BOAT', 'COAT', 'THROAT', 'FLOAT'], explanation: 'Each hides OAT: bOAT, cOAT, thrOAT, flOAT.' },
    ],
  },
  {
    id: 'dp-010', title: 'Great Outdoors', difficulty: 'green', tags: ['daily'],
    categories: [
      { name: 'Power tools', colour: 'yellow', words: ['DRILL', 'SANDER', 'CHISEL', 'CLAMP'], explanation: 'In the workshop.' },
      { name: 'Camping', colour: 'green', words: ['TENT', 'CAMPFIRE', 'SLEEPINGBAG', 'LANTERN'], explanation: 'Out in the wild.' },
      { name: '___ LIGHT', colour: 'blue', words: ['DAY', 'SUN', 'LIME', 'STAR'], explanation: 'Each precedes LIGHT: daylight, sunlight, limelight, starlight.' },
      { name: 'Hidden ASH', colour: 'purple', words: ['SMASH', 'CRASH', 'STASH', 'WASHER'], explanation: 'Each hides ASH: smASH, crASH, stASH, wASHer.' },
    ],
  },
  {
    id: 'dp-011', title: 'Back of the Net', difficulty: 'blue', tags: ['daily'],
    categories: [
      { name: 'Birds', colour: 'yellow', words: ['HAWK', 'CROW', 'DOVE', 'SWAN'], explanation: 'They fly.' },
      { name: 'Soccer positions', colour: 'green', words: ['STRIKER', 'DEFENDER', 'WINGER', 'MIDFIELDER'], explanation: 'On the pitch.' },
      { name: 'GOAL ___', colour: 'blue', words: ['KEEPER', 'POST', 'LINE', 'KICK'], explanation: 'Each follows GOAL: goalkeeper, goalpost, goalline, goalkick.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['PALS', 'STOOL', 'FLOG', 'SMART'], explanation: 'Backwards: slap, loots, golf, trams.' },
    ],
  },
  {
    id: 'dp-012', title: 'Eye of the Beholder', difficulty: 'blue', tags: ['daily'],
    categories: [
      { name: 'Flowers', colour: 'yellow', words: ['ORCHID', 'PEONY', 'IRIS', 'POPPY'], explanation: 'In bloom. (IRIS tempts eye parts.)' },
      { name: 'Parts of the eye', colour: 'green', words: ['PUPIL', 'RETINA', 'CORNEA', 'LENS'], explanation: 'How you see.' },
      { name: '___ POT', colour: 'blue', words: ['JACK', 'CRACK', 'HOT', 'TEA'], explanation: 'Each precedes POT: jackpot, crackpot, hotpot, teapot.' },
      { name: 'Anagrams of PETALS', colour: 'purple', words: ['PLATES', 'PLEATS', 'STAPLE', 'PASTEL'], explanation: 'Rearrange the letters of PETALS.' },
    ],
  },
  {
    id: 'dp-013', title: 'Treasure Hunt', difficulty: 'purple', tags: ['daily'],
    categories: [
      { name: 'Pirate words', colour: 'yellow', words: ['SHIP', 'TREASURE', 'PARROT', 'PLANK'], explanation: 'Ahoy, matey.' },
      { name: 'Navigation', colour: 'green', words: ['ANCHOR', 'COMPASS', 'MAP', 'SAIL'], explanation: 'Find your way at sea.' },
      { name: 'Reverse to a new word', colour: 'blue', words: ['DRAW', 'RAW', 'SLOOP', 'DAB'], explanation: 'Backwards: ward, war, pools, bad.' },
      { name: 'Hidden SEA', colour: 'purple', words: ['DISEASE', 'NAUSEA', 'RESEARCH', 'INSEAM'], explanation: 'Each hides SEA: diSEAse, nauSEA, reSEArch, inSEAm.' },
    ],
  },
  {
    id: 'dp-014', title: 'Final Frontier', difficulty: 'purple', tags: ['daily'],
    categories: [
      { name: 'Space objects', colour: 'yellow', words: ['COMET', 'ASTEROID', 'GALAXY', 'NEBULA'], explanation: 'Out in the cosmos.' },
      { name: 'Spaceflight', colour: 'green', words: ['LAUNCH', 'ORBIT', 'LANDING', 'REENTRY'], explanation: 'Stages of a mission.' },
      { name: 'Sound like letters', colour: 'blue', words: ['EYE', 'OH', 'YOU', 'KAY'], explanation: 'Homophones of I, O, U, K.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['EVIL', 'SNUG', 'DECAL', 'DEW'], explanation: 'Backwards: live, guns, laced, wed.' },
    ],
  },
];
