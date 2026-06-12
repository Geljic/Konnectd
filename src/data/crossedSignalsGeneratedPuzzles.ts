import type { CrossedSignalsDifficulty, CrossedSignalsPuzzle } from './crossedSignalsPuzzles';

interface GeneratedPuzzleDef {
  id: string;
  title: string;
  difficulty: CrossedSignalsDifficulty;
  rows: [string, string, string, string];
  columns: [string, string, string, string];
  grid: [
    [string, string, string, string],
    [string, string, string, string],
    [string, string, string, string],
    [string, string, string, string],
  ];
}

const GENERATED_DEFS: GeneratedPuzzleDef[] = [
  {
    id: 'cs_gen_001_color_signals',
    title: 'Color Signals',
    difficulty: 1,
    rows: ['Red', 'Green', 'Black', 'White'],
    columns: ['Food', 'Animal', 'Object', 'Nature'],
    grid: [
      ['CHERRY', 'CARDINAL', 'LIPSTICK', 'SUNSET'],
      ['APPLE', 'FROG', 'EMERALD', 'MOSS'],
      ['OLIVE', 'PANTHER', 'UMBRELLA', 'NIGHT'],
      ['RICE', 'SWAN', 'PAPER', 'SNOW'],
    ],
  },
  {
    id: 'cs_gen_002_bright_signals',
    title: 'Bright Signals',
    difficulty: 1,
    rows: ['Yellow', 'Blue', 'Brown', 'Orange'],
    columns: ['Food', 'Animal', 'Object', 'Nature'],
    grid: [
      ['BANANA', 'CANARY', 'TAXI', 'SUNFLOWER'],
      ['BLUEBERRY', 'WHALE', 'JEANS', 'SKY'],
      ['BREAD', 'BEAR', 'WALLET', 'MUD'],
      ['ORANGE', 'TIGER', 'CONE', 'SUNSET'],
    ],
  },
  {
    id: 'cs_gen_003_shape_signals',
    title: 'Shape Signals',
    difficulty: 1,
    rows: ['Round', 'Square', 'Sharp', 'Soft'],
    columns: ['Food', 'Object', 'Game', 'Nature'],
    grid: [
      ['DONUT', 'COIN', 'BALL', 'MOON'],
      ['CRACKER', 'TILE', 'BOARD', 'FIELD'],
      ['PEPPER', 'KNIFE', 'DART', 'THORN'],
      ['BREAD', 'PILLOW', 'PLUSH', 'MOSS'],
    ],
  },
  {
    id: 'cs_gen_004_temperature',
    title: 'Temperature',
    difficulty: 1,
    rows: ['Hot', 'Cold', 'Wet', 'Dry'],
    columns: ['Food', 'Weather', 'Object', 'Place'],
    grid: [
      ['SOUP', 'HEAT', 'IRON', 'DESERT'],
      ['GELATO', 'SNOW', 'FREEZER', 'ARCTIC'],
      ['SAUCE', 'RAIN', 'TOWEL', 'BEACH'],
      ['CRACKER', 'DROUGHT', 'POWDER', 'ATTIC'],
    ],
  },
  {
    id: 'cs_gen_005_motion_sound',
    title: 'Motion Sound',
    difficulty: 1,
    rows: ['Fast', 'Slow', 'Loud', 'Quiet'],
    columns: ['Animal', 'Vehicle', 'Music', 'Person'],
    grid: [
      ['CHEETAH', 'JET', 'DRUMMER', 'SPRINTER'],
      ['TURTLE', 'CART', 'DIRGE', 'WALKER'],
      ['PARROT', 'TRAIN', 'TRUMPET', 'SHOUTER'],
      ['MOUSE', 'GLIDER', 'LULLABY', 'LIBRARIAN'],
    ],
  },
  {
    id: 'cs_gen_006_surface_feel',
    title: 'Surface Feel',
    difficulty: 1,
    rows: ['Smooth', 'Rough', 'Sticky', 'Slippery'],
    columns: ['Food', 'Object', 'Animal', 'Nature'],
    grid: [
      ['YOGURT', 'GLASS', 'SEAL', 'PEBBLE'],
      ['GRANOLA', 'SANDPAPER', 'TOAD', 'BARK'],
      ['HONEY', 'TAPE', 'SLUG', 'SAP'],
      ['BUTTER', 'ICE', 'EEL', 'ALGAE'],
    ],
  },
  {
    id: 'cs_gen_007_public_places',
    title: 'Public Places',
    difficulty: 1,
    rows: ['School', 'Hospital', 'Court', 'Theater'],
    columns: ['Person', 'Object', 'Room', 'Event'],
    grid: [
      ['TEACHER', 'PENCIL', 'CLASSROOM', 'EXAM'],
      ['DOCTOR', 'BANDAGE', 'WARD', 'SURGERY'],
      ['JUDGE', 'GAVEL', 'CHAMBER', 'TRIAL'],
      ['ACTOR', 'MASK', 'STAGE', 'PLAY'],
    ],
  },
  {
    id: 'cs_gen_008_working_day',
    title: 'Working Day',
    difficulty: 1,
    rows: ['Airport', 'Farm', 'Beach', 'Office'],
    columns: ['Person', 'Object', 'Place', 'Sound'],
    grid: [
      ['PILOT', 'LUGGAGE', 'TERMINAL', 'ANNOUNCEMENT'],
      ['FARMER', 'PLOW', 'BARN', 'ROOSTER'],
      ['LIFEGUARD', 'TOWEL', 'PIER', 'WAVES'],
      ['MANAGER', 'DESK', 'CUBICLE', 'PRINTER'],
    ],
  },
  {
    id: 'cs_gen_009_tool_rooms',
    title: 'Tool Rooms',
    difficulty: 1,
    rows: ['Kitchen', 'Garden', 'Garage', 'Studio'],
    columns: ['Tool', 'Container', 'Surface', 'Action'],
    grid: [
      ['KNIFE', 'BOWL', 'COUNTER', 'COOKING'],
      ['RAKE', 'POT', 'SOIL', 'PLANTING'],
      ['WRENCH', 'BUCKET', 'FLOOR', 'REPAIR'],
      ['BRUSH', 'JAR', 'CANVAS', 'PAINTING'],
    ],
  },
  {
    id: 'cs_gen_010_wild_places',
    title: 'Wild Places',
    difficulty: 1,
    rows: ['Forest', 'Ocean', 'Desert', 'Mountain'],
    columns: ['Animal', 'Plant', 'Feature', 'Danger'],
    grid: [
      ['DEER', 'PINE', 'TRAIL', 'FIRE'],
      ['SHARK', 'KELP', 'REEF', 'RIPTIDE'],
      ['CAMEL', 'CACTUS', 'DUNE', 'HEAT'],
      ['GOAT', 'EDELWEISS', 'PEAK', 'AVALANCHE'],
    ],
  },
  {
    id: 'cs_gen_011_story_places',
    title: 'Story Places',
    difficulty: 1,
    rows: ['City', 'Circus', 'Castle', 'Space'],
    columns: ['Person', 'Object', 'Place', 'Hazard'],
    grid: [
      ['MAYOR', 'TAXI', 'STREET', 'TRAFFIC'],
      ['CLOWN', 'RING', 'TENT', 'FIRE'],
      ['KING', 'CROWN', 'TOWER', 'SIEGE'],
      ['ASTRONAUT', 'ROCKET', 'ORBIT', 'VACUUM'],
    ],
  },
  {
    id: 'cs_gen_012_day_out',
    title: 'Day Out',
    difficulty: 1,
    rows: ['Library', 'Museum', 'Zoo', 'Stadium'],
    columns: ['Person', 'Object', 'Area', 'Event'],
    grid: [
      ['LIBRARIAN', 'BOOK', 'STACKS', 'READING'],
      ['CURATOR', 'PAINTING', 'GALLERY', 'EXHIBIT'],
      ['KEEPER', 'CAGE', 'HABITAT', 'FEEDING'],
      ['REFEREE', 'BALL', 'BLEACHERS', 'GAME'],
    ],
  },
  {
    id: 'cs_gen_013_service_counter',
    title: 'Service Counter',
    difficulty: 1,
    rows: ['Restaurant', 'Hotel', 'Theater', 'Bank'],
    columns: ['Staff', 'Object', 'Area', 'Transaction'],
    grid: [
      ['WAITER', 'MENU', 'KITCHEN', 'ORDER'],
      ['CLERK', 'KEY', 'LOBBY', 'BOOKING'],
      ['USHER', 'TICKET', 'STAGE', 'PERFORMANCE'],
      ['TELLER', 'CARD', 'VAULT', 'DEPOSIT'],
    ],
  },
  {
    id: 'cs_gen_014_transport_signals',
    title: 'Transport Signals',
    difficulty: 1,
    rows: ['Train', 'Ship', 'Plane', 'Bicycle'],
    columns: ['Operator', 'Part', 'Stop', 'Signal'],
    grid: [
      ['CONDUCTOR', 'WHEEL', 'STATION', 'WHISTLE'],
      ['CAPTAIN', 'ANCHOR', 'PORT', 'HORN'],
      ['PILOT', 'WING', 'GATE', 'BEACON'],
      ['RIDER', 'PEDAL', 'RACK', 'BELL'],
    ],
  },
  {
    id: 'cs_gen_015_game_table',
    title: 'Game Table',
    difficulty: 1,
    rows: ['Chess', 'Poker', 'Soccer', 'Tennis'],
    columns: ['Person', 'Piece', 'Place', 'Move'],
    grid: [
      ['PLAYER', 'KING', 'BOARD', 'CASTLE'],
      ['DEALER', 'CHIP', 'TABLE', 'BLUFF'],
      ['REFEREE', 'BALL', 'FIELD', 'PASS'],
      ['UMPIRE', 'RACKET', 'COURT', 'SERVE'],
    ],
  },
  {
    id: 'cs_gen_016_art_forms',
    title: 'Art Forms',
    difficulty: 1,
    rows: ['Painting', 'Music', 'Dance', 'Film'],
    columns: ['Person', 'Tool', 'Place', 'Output'],
    grid: [
      ['ARTIST', 'BRUSH', 'CANVAS', 'PORTRAIT'],
      ['MUSICIAN', 'INSTRUMENT', 'STAGE', 'SONG'],
      ['DANCER', 'SHOE', 'FLOOR', 'ROUTINE'],
      ['DIRECTOR', 'CAMERA', 'SET', 'SCENE'],
    ],
  },
  {
    id: 'cs_gen_017_season_signals',
    title: 'Season Signals',
    difficulty: 1,
    rows: ['Spring', 'Summer', 'Autumn', 'Winter'],
    columns: ['Food', 'Weather', 'Event', 'Nature'],
    grid: [
      ['ASPARAGUS', 'RAIN', 'PICNIC', 'BLOSSOM'],
      ['MELON', 'HEAT', 'BEACH', 'SUNFLOWER'],
      ['PUMPKIN', 'WIND', 'HARVEST', 'LEAF'],
      ['STEW', 'SNOW', 'HOLIDAY', 'FROST'],
    ],
  },
  {
    id: 'cs_gen_018_case_files',
    title: 'Case Files',
    difficulty: 2,
    rows: ['Police', 'Firehouse', 'Clinic', 'Workshop'],
    columns: ['Person', 'Tool', 'Place', 'Problem'],
    grid: [
      ['DETECTIVE', 'BADGE', 'STATION', 'CRIME'],
      ['FIREFIGHTER', 'HOSE', 'ENGINE', 'SMOKE'],
      ['NURSE', 'CHART', 'WARD', 'FEVER'],
      ['MECHANIC', 'WRENCH', 'GARAGE', 'LEAK'],
    ],
  },
  {
    id: 'cs_gen_019_natural_forces',
    title: 'Natural Forces',
    difficulty: 2,
    rows: ['Weather', 'Ocean', 'Forest', 'Space'],
    columns: ['Movement', 'Object', 'Power', 'Danger'],
    grid: [
      ['WIND', 'CLOUD', 'LIGHTNING', 'TORNADO'],
      ['TIDE', 'ANCHOR', 'CURRENT', 'SHARK'],
      ['TRAIL', 'LOG', 'ROOT', 'FIRE'],
      ['ORBIT', 'COMET', 'GRAVITY', 'VACUUM'],
    ],
  },
  {
    id: 'cs_gen_020_food_counters',
    title: 'Food Counters',
    difficulty: 2,
    rows: ['Bakery', 'Cafe', 'Deli', 'Sushi'],
    columns: ['Worker', 'Item', 'Tool', 'Order'],
    grid: [
      ['BAKER', 'BREAD', 'OVEN', 'LOAF'],
      ['BARISTA', 'COFFEE', 'GRINDER', 'LATTE'],
      ['CLERK', 'SANDWICH', 'SLICER', 'PICKLE'],
      ['CHEF', 'RICE', 'KNIFE', 'ROLL'],
    ],
  },
  {
    id: 'cs_gen_021_weather_moods',
    title: 'Weather Moods',
    difficulty: 2,
    rows: ['Soft', 'Heavy', 'Bright', 'Dark'],
    columns: ['Weather', 'Emotion', 'Music', 'Light'],
    grid: [
      ['MIST', 'CALM', 'LULLABY', 'GLOW'],
      ['STORM', 'GRIEF', 'BASS', 'SHADOW'],
      ['SUNSHINE', 'JOY', 'FANFARE', 'BEAM'],
      ['NIGHT', 'DREAD', 'DIRGE', 'ECLIPSE'],
    ],
  },
  {
    id: 'cs_gen_022_made_to_hold',
    title: 'Work Benches',
    difficulty: 2,
    rows: ['Kitchen', 'Garden', 'Workshop', 'Studio'],
    columns: ['Worker', 'Tool', 'Container', 'Material'],
    grid: [
      ['CHEF', 'KNIFE', 'BOWL', 'FLOUR'],
      ['GARDENER', 'RAKE', 'POT', 'SOIL'],
      ['MECHANIC', 'WRENCH', 'TOOLBOX', 'OIL'],
      ['ARTIST', 'BRUSH', 'JAR', 'PAINT'],
    ],
  },
  {
    id: 'cs_gen_023_crack_open_charge',
    title: 'Game Night',
    difficulty: 2,
    rows: ['Chess', 'Poker', 'Billiards', 'Bowling'],
    columns: ['Person', 'Piece', 'Place', 'Move'],
    grid: [
      ['MASTER', 'KING', 'BOARD', 'CASTLE'],
      ['DEALER', 'CHIP', 'TABLE', 'BLUFF'],
      ['SHARK', 'CUE', 'HALL', 'BREAK'],
      ['BOWLER', 'PIN', 'LANE', 'STRIKE'],
    ],
  },
  {
    id: 'cs_gen_024_run_fall_break',
    title: 'Run Fall Break',
    difficulty: 2,
    rows: ['Can run', 'Can fall', 'Can break', 'Can ring'],
    columns: ['Time', 'Body', 'Tech', 'Nature'],
    grid: [
      ['CLOCK', 'NOSE', 'PROGRAM', 'RIVER'],
      ['NIGHT', 'HAIR', 'SYSTEM', 'RAIN'],
      ['DAWN', 'BONE', 'CODE', 'WAVE'],
      ['ALARM', 'EAR', 'PHONE', 'TREE'],
    ],
  },
  {
    id: 'cs_gen_026_ring_watch_break',
    title: 'Ring Watch Break',
    difficulty: 2,
    rows: ['Rings', 'Watches', 'Breaks', 'Falls'],
    columns: ['Time', 'Body', 'Security', 'Nature'],
    grid: [
      ['CLOCK', 'EAR', 'ALARM', 'HALO'],
      ['TIMER', 'EYE', 'GUARD', 'HAWK'],
      ['DAWN', 'BONE', 'LOCK', 'STORM'],
      ['NIGHT', 'HAIR', 'PATROL', 'RAIN'],
    ],
  },
  {
    id: 'cs_gen_027_lines_and_keys',
    title: 'Travel Hubs',
    difficulty: 2,
    rows: ['Airport', 'Hotel', 'Station', 'Harbor'],
    columns: ['Staff', 'Object', 'Place', 'Signal'],
    grid: [
      ['PILOT', 'LUGGAGE', 'GATE', 'BEACON'],
      ['CLERK', 'KEY', 'LOBBY', 'BELL'],
      ['CONDUCTOR', 'TICKET', 'PLATFORM', 'WHISTLE'],
      ['CAPTAIN', 'ANCHOR', 'DOCK', 'HORN'],
    ],
  },
  {
    id: 'cs_gen_030_work_words',
    title: 'Mail Room',
    difficulty: 2,
    rows: ['Office', 'Court', 'Post Office', 'Stadium'],
    columns: ['Person', 'Object', 'Place', 'Action'],
    grid: [
      ['CLERK', 'MEMO', 'DESK', 'FILE'],
      ['LAWYER', 'CLAIM', 'CHAMBER', 'APPEAL'],
      ['COURIER', 'PARCEL', 'DEPOT', 'SORT'],
      ['REFEREE', 'CARD', 'FIELD', 'WHISTLE'],
    ],
  },
  {
    id: 'cs_gen_031_hidden_handles',
    title: 'Gear Shed',
    difficulty: 2,
    rows: ['Kitchen', 'Sport', 'Weapon', 'Garden'],
    columns: ['Tool', 'Holder', 'Place', 'Action'],
    grid: [
      ['KNIFE', 'BOWL', 'COUNTER', 'CHOP'],
      ['RACKET', 'BAG', 'COURT', 'SERVE'],
      ['SWORD', 'SHEATH', 'ARENA', 'PARRY'],
      ['HOE', 'POT', 'SOIL', 'PLANT'],
    ],
  },
  {
    id: 'cs_gen_032_letters_without_letters',
    title: 'Return Desk',
    difficulty: 2,
    rows: ['Mail', 'School', 'Shopping', 'Tech'],
    columns: ['Object', 'Place', 'Action', 'Problem'],
    grid: [
      ['LETTER', 'DEPOT', 'SEND', 'DELAY'],
      ['BOOK', 'CLASSROOM', 'STUDY', 'ABSENCE'],
      ['ITEM', 'STORE', 'REFUND', 'DEFECT'],
      ['FILE', 'SERVER', 'UPLOAD', 'ERROR'],
    ],
  },
  {
    id: 'cs_gen_033_market_motion',
    title: 'Market Street',
    difficulty: 2,
    rows: ['Bank', 'Weather', 'Body', 'Business'],
    columns: ['Indicator', 'Event', 'Place', 'Risk'],
    grid: [
      ['ACCOUNT', 'DEPOSIT', 'VAULT', 'DEBT'],
      ['BAROMETER', 'STORM', 'SKY', 'FLOOD'],
      ['PULSE', 'FEVER', 'CHEST', 'INJURY'],
      ['PRICE', 'MERGER', 'OFFICE', 'LOSS'],
    ],
  },
  {
    id: 'cs_gen_039_current_words',
    title: 'Current Words',
    difficulty: 3,
    rows: ['Has current', 'Has charge', 'Has flow', 'Has resistance'],
    columns: ['Electricity', 'River', 'Money', 'Crowd'],
    grid: [
      ['WIRE', 'STREAM', 'ACCOUNT', 'TREND'],
      ['BATTERY', 'RAPIDS', 'FEE', 'CROWD'],
      ['CIRCUIT', 'WATER', 'CASH', 'TRAFFIC'],
      ['RESISTOR', 'BANK', 'DEBT', 'PROTEST'],
    ],
  },
  {
    id: 'cs_gen_043_cap_words',
    title: 'Summit Shelf',
    difficulty: 3,
    rows: ['Clothing', 'Mountain', 'Dentist', 'Bottle'],
    columns: ['Object', 'Part', 'Tool', 'Problem'],
    grid: [
      ['HAT', 'BRIM', 'NEEDLE', 'TEAR'],
      ['PEAK', 'RIDGE', 'ROPE', 'AVALANCHE'],
      ['MOLAR', 'ENAMEL', 'DRILL', 'CAVITY'],
      ['CAP', 'NECK', 'OPENER', 'LEAK'],
    ],
  },
  {
    id: 'cs_gen_045_line_words',
    title: 'Line Words',
    difficulty: 3,
    rows: ['Can draw', 'Can cut', 'Can cast', 'Can trace'],
    columns: ['Art', 'Fishing', 'Film', 'Math'],
    grid: [
      ['LINE', 'HOOK', 'SCENE', 'GRAPH'],
      ['PAPER', 'BAIT', 'EDIT', 'ANGLE'],
      ['SHADOW', 'NET', 'ACTOR', 'RAY'],
      ['SKETCH', 'LURE', 'FRAME', 'CURVE'],
    ],
  },
  {
    id: 'cs_gen_048_shadow_words',
    title: 'Shadow Words',
    difficulty: 4,
    rows: ['Can follow', 'Can cast', 'Can hide', 'Can reveal'],
    columns: ['Light', 'Spy', 'Theater', 'Data'],
    grid: [
      ['SHADOW', 'TARGET', 'CUE', 'TREND'],
      ['BEAM', 'AGENT', 'ROLE', 'TYPE'],
      ['ECLIPSE', 'MOLE', 'MASK', 'FIELD'],
      ['FLASH', 'SOURCE', 'SCENE', 'PATTERN'],
    ],
  },
  {
    id: 'cs_gen_050_final_signal',
    title: 'Final Signal',
    difficulty: 4,
    rows: ['Can resolve', 'Can match', 'Can split', 'Can collapse'],
    columns: ['Puzzle', 'Software', 'Science', 'Finance'],
    grid: [
      ['RIDDLE', 'BUG', 'IMAGE', 'DEBT'],
      ['PAIR', 'PATTERN', 'SAMPLE', 'TRADE'],
      ['GROUP', 'STRING', 'ATOM', 'SHARE'],
      ['GRID', 'TREE', 'WAVE', 'MARKET'],
    ],
  },
  {
    id: 'cs_gen_051_night_shift',
    title: 'Night Shift',
    difficulty: 2,
    rows: ['Casino', 'Airport', 'Theater', 'Harbor'],
    columns: ['Worker', 'Object', 'Place', 'Action'],
    grid: [
      ['DEALER', 'CHIP', 'FLOOR', 'BET'],
      ['PILOT', 'LUGGAGE', 'GATE', 'BOARDING'],
      ['USHER', 'PROGRAM', 'STAGE', 'ENCORE'],
      ['SAILOR', 'ROPE', 'DOCK', 'MOORING'],
    ],
  },
  {
    id: 'cs_gen_052_far_places',
    title: 'Far Places',
    difficulty: 2,
    rows: ['Jungle', 'Tundra', 'Savanna', 'Swamp'],
    columns: ['Animal', 'Plant', 'Feature', 'Danger'],
    grid: [
      ['JAGUAR', 'VINE', 'CANOPY', 'SNAKE'],
      ['REINDEER', 'LICHEN', 'PERMAFROST', 'FROSTBITE'],
      ['LION', 'ACACIA', 'GRASSLAND', 'DROUGHT'],
      ['ALLIGATOR', 'REED', 'BOG', 'QUICKSAND'],
    ],
  },
  {
    id: 'cs_gen_053_pro_shop',
    title: 'Pro Shop',
    difficulty: 3,
    rows: ['Boxing', 'Golf', 'Archery', 'Fencing'],
    columns: ['Gear', 'Arena', 'Target', 'Move'],
    grid: [
      ['GLOVES', 'RING', 'JAW', 'JAB'],
      ['CLUB', 'GREEN', 'HOLE', 'SWING'],
      ['BOW', 'RANGE', 'BULLSEYE', 'RELEASE'],
      ['FOIL', 'PISTE', 'TORSO', 'LUNGE'],
    ],
  },
];

function slug(value: string, fallback: string): string {
  const clean = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return clean || fallback;
}

function makePuzzle(def: GeneratedPuzzleDef): CrossedSignalsPuzzle {
  const rows = def.rows.map((label, index) => ({
    id: `r_${slug(label, `row_${index + 1}`)}`,
    label,
  }));

  const columns = def.columns.map((label, index) => ({
    id: `c_${slug(label, `column_${index + 1}`)}`,
    label,
  }));

  return {
    id: def.id,
    title: def.title,
    difficulty: def.difficulty,
    rows,
    columns,
    cells: def.grid.flatMap((rowWords, rowIndex) =>
      rowWords.map((word, columnIndex) => ({
        rowId: rows[rowIndex].id,
        columnId: columns[columnIndex].id,
        word,
        explanation: `${word} fits "${rows[rowIndex].label}" and "${columns[columnIndex].label}".`,
      })),
    ),
  };
}

export const CROSSED_SIGNALS_GENERATED_PUZZLES: CrossedSignalsPuzzle[] = GENERATED_DEFS.map(makePuzzle);
