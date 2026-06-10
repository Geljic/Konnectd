import type { PuzzleCategory } from '@/api/puzzles';
import type { CategoryColour } from '@/constants/colors';

/**
 * Hand-authored ORIGINAL Connections puzzles — our own content, not NYT boards.
 * Static source of truth (the Connections analogue of wordTrailsPuzzles.ts).
 * Build into playable `Puzzle`s with src/utils/connectionsPuzzles.ts; push to
 * PocketBase with scripts/import_curated_puzzles.ts.
 *
 * `difficulty` is the OVERALL puzzle rating, mapped to the Easy/Medium/Hard/Expert
 * filter via difficulty_min: yellow=Easy, green=Medium, blue=Hard, purple=Expert.
 * (The four category rows still use their own yellow→purple colours regardless.)
 *
 * Authoring rules (validated by validateCuratedSeeds / validate_curated.py):
 *  - exactly 4 categories, one of each colour; 4 words each; 16 UNIQUE words
 *  - every word belongs to exactly ONE category (no genuine ambiguity)
 *  - traps encouraged: a word that LOOKS like it fits another category
 *
 * Only types are imported (erased at runtime) so plain node scripts can load this.
 */
export interface CuratedSeed {
  id: string;
  title: string;
  /** Overall difficulty: yellow=Easy, green=Medium, blue=Hard, purple=Expert. */
  difficulty: CategoryColour;
  /** Theme tags for filtering / themed packs (e.g. ['australian']). Optional. */
  tags?: string[];
  categories: [PuzzleCategory, PuzzleCategory, PuzzleCategory, PuzzleCategory];
}

export const CONNECTIONS_PUZZLE_SEEDS: CuratedSeed[] = [
  {
    id: 'cn-001',
    title: 'Alphabet Soup',
    difficulty: 'yellow',
    categories: [
      { name: 'Breakfast foods', colour: 'yellow', words: ['TOAST', 'CEREAL', 'BACON', 'OMELET'], explanation: 'Classic morning plates.' },
      { name: 'Card games', colour: 'green', words: ['POKER', 'BRIDGE', 'HEARTS', 'RUMMY'], explanation: 'Games played with a deck.' },
      { name: '___ STORM', colour: 'blue', words: ['BRAIN', 'THUNDER', 'SAND', 'SNOW'], explanation: 'Each precedes STORM: brainstorm, thunderstorm, sandstorm, snowstorm.' },
      { name: 'Sound like letters', colour: 'purple', words: ['BEE', 'SEA', 'JAY', 'ARE'], explanation: 'Homophones of B, C, J, R.' },
    ],
  },
  {
    id: 'cn-002',
    title: 'Hidden Menagerie',
    difficulty: 'green',
    categories: [
      { name: 'Citrus fruits', colour: 'yellow', words: ['LEMON', 'LIME', 'ORANGE', 'GRAPEFRUIT'], explanation: 'Tart, segmented fruits. (ORANGE is the colour trap.)' },
      { name: 'Shades of blue', colour: 'green', words: ['NAVY', 'TEAL', 'AZURE', 'COBALT'], explanation: 'Variations of blue.' },
      { name: 'Things with teeth', colour: 'blue', words: ['COMB', 'SAW', 'ZIPPER', 'GEAR'], explanation: 'All have teeth.' },
      { name: 'Hidden animals (start)', colour: 'purple', words: ['CATALOG', 'COWARD', 'RAMBLE', 'DOGMA'], explanation: 'Begin with an animal: CAT, COW, RAM, DOG.' },
    ],
  },
  {
    id: 'cn-003',
    title: 'Count On It',
    difficulty: 'blue',
    categories: [
      { name: 'Pizza toppings', colour: 'yellow', words: ['PEPPERONI', 'MUSHROOM', 'OLIVE', 'ONION'], explanation: 'Things you order on a pizza.' },
      { name: 'Ballroom dances', colour: 'green', words: ['SALSA', 'TANGO', 'WALTZ', 'FOXTROT'], explanation: 'Partner dances. (SALSA is the sauce trap.)' },
      { name: 'Playground equipment', colour: 'blue', words: ['SLIDE', 'SWING', 'SEESAW', 'SANDBOX'], explanation: 'Found at a playground.' },
      { name: 'Hidden numbers', colour: 'purple', words: ['ATONE', 'CANINE', 'KITTEN', 'WEIGHT'], explanation: 'Contain a number: atONE, caNINE, kitTEN, wEIGHT.' },
    ],
  },
  {
    id: 'cn-004',
    title: 'There and Back',
    difficulty: 'yellow',
    categories: [
      { name: 'Planets', colour: 'yellow', words: ['SATURN', 'NEPTUNE', 'JUPITER', 'URANUS'], explanation: 'Worlds in our solar system.' },
      { name: 'Greek letters', colour: 'green', words: ['ALPHA', 'BETA', 'DELTA', 'OMEGA'], explanation: 'Letters of the Greek alphabet. (DELTA tempts rivers.)' },
      { name: 'Rivers', colour: 'blue', words: ['NILE', 'AMAZON', 'THAMES', 'VOLGA'], explanation: 'Major rivers. (AMAZON is the brand trap.)' },
      { name: 'Palindromes', colour: 'purple', words: ['LEVEL', 'RADAR', 'KAYAK', 'CIVIC'], explanation: 'Read the same backwards.' },
    ],
  },
  {
    id: 'cn-005',
    title: 'Body of Work',
    difficulty: 'blue',
    categories: [
      { name: 'Dog breeds', colour: 'yellow', words: ['POODLE', 'BEAGLE', 'HUSKY', 'CORGI'], explanation: 'Breeds of dog.' },
      { name: 'Types of bread', colour: 'green', words: ['RYE', 'NAAN', 'PITA', 'BAGEL'], explanation: 'Baked goods you slice or fill.' },
      { name: '___ HOUSE', colour: 'blue', words: ['DOG', 'GREEN', 'LIGHT', 'WARE'], explanation: 'Each precedes HOUSE. (DOG tempts breeds.)' },
      { name: 'Hidden body parts', colour: 'purple', words: ['HEART', 'CHARM', 'FLIP', 'CRIB'], explanation: 'Hide a body part: hEARt, chARM, fLIP, cRIB.' },
    ],
  },
  {
    id: 'cn-006',
    title: 'Say It Twice',
    difficulty: 'blue',
    categories: [
      { name: 'Gym equipment', colour: 'yellow', words: ['TREADMILL', 'DUMBBELL', 'MAT', 'LOCKER'], explanation: 'Found at the gym.' },
      { name: 'Units of measurement', colour: 'green', words: ['OUNCE', 'METER', 'GALLON', 'ACRE'], explanation: 'Ways to measure.' },
      { name: 'OVER ___', colour: 'blue', words: ['BOARD', 'TIME', 'COAT', 'HEAD'], explanation: 'Each follows OVER: overboard, overtime, overcoat, overhead.' },
      { name: 'Sound like two words', colour: 'purple', words: ['NITRATE', 'DEPEND', 'ATTACK', 'NOTABLE'], explanation: 'Night rate, deep end, a tack, no table.' },
    ],
  },
  {
    id: 'cn-007',
    title: 'Mirror Mirror',
    difficulty: 'purple',
    categories: [
      { name: 'Shades of red', colour: 'yellow', words: ['CRIMSON', 'SCARLET', 'MAROON', 'VERMILION'], explanation: 'Variations of red.' },
      { name: 'Pasta shapes', colour: 'green', words: ['PENNE', 'FUSILLI', 'ZITI', 'ORZO'], explanation: 'Types of pasta.' },
      { name: '___ WORK', colour: 'blue', words: ['NET', 'HOME', 'ART', 'FIRE'], explanation: 'Each precedes WORK: network, homework, artwork, firework.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['STRESSED', 'DRAWER', 'LIVED', 'STRAW'], explanation: 'Backwards: desserts, reward, devil, warts.' },
    ],
  },
  {
    id: 'cn-008',
    title: 'Sounds Familiar',
    difficulty: 'blue',
    categories: [
      { name: 'Office supplies', colour: 'yellow', words: ['STAPLER', 'PAPERCLIP', 'FOLDER', 'TAPE'], explanation: 'Desk-drawer staples.' },
      { name: 'Measuring tools', colour: 'green', words: ['RULER', 'SCALE', 'COMPASS', 'PROTRACTOR'], explanation: 'Instruments that measure. (RULER/SCALE have double meanings.)' },
      { name: '___ BOARD', colour: 'blue', words: ['KEY', 'CARD', 'SURF', 'CHALK'], explanation: 'Each precedes BOARD: keyboard, cardboard, surfboard, chalkboard.' },
      { name: 'Hidden instruments', colour: 'purple', words: ['CONUNDRUM', 'SHARP', 'ABSOLUTE', 'THORN'], explanation: 'Hide an instrument: conunDRUM, sHARP, absoLUTE, tHORN.' },
    ],
  },
  {
    id: 'cn-009',
    title: 'Out of the Woods',
    difficulty: 'blue',
    categories: [
      { name: 'Sandwiches', colour: 'yellow', words: ['PANINI', 'REUBEN', 'HOAGIE', 'BLT'], explanation: 'Things between two slices.' },
      { name: 'Yoga poses', colour: 'green', words: ['COBRA', 'TREE', 'EAGLE', 'CHILD'], explanation: 'Named yoga positions.' },
      { name: 'Constellations', colour: 'blue', words: ['ORION', 'LYRA', 'DRACO', 'CYGNUS'], explanation: 'Patterns of stars.' },
      { name: 'Hidden trees', colour: 'purple', words: ['CLOAK', 'CASH', 'FIRST', 'SPINE'], explanation: 'Hide a tree: clOAK, cASH, FIRst, sPINE.' },
    ],
  },
  {
    id: 'cn-010',
    title: 'Spot of Tea',
    difficulty: 'green',
    categories: [
      { name: 'Coffee drinks', colour: 'yellow', words: ['LATTE', 'MOCHA', 'ESPRESSO', 'AMERICANO'], explanation: 'Orders at a cafe.' },
      { name: 'Bee-related', colour: 'green', words: ['HIVE', 'HONEY', 'STING', 'SWARM'], explanation: 'All about bees.' },
      { name: '___ CAKE', colour: 'blue', words: ['CUP', 'PAN', 'BEEF', 'FRUIT'], explanation: 'Each precedes CAKE: cupcake, pancake, beefcake, fruitcake.' },
      { name: 'Hidden TEA', colour: 'purple', words: ['STEAK', 'INSTEAD', 'PLATEAU', 'STEALTH'], explanation: 'Each hides TEA: sTEAk, insTEAd, plaTEAu, sTEAlth.' },
    ],
  },
  {
    id: 'cn-011',
    title: 'Crooked Moves',
    difficulty: 'green',
    categories: [
      { name: 'Chess pieces', colour: 'yellow', words: ['KNIGHT', 'BISHOP', 'ROOK', 'PAWN'], explanation: 'Pieces on the board. (ROOK tempts "swindle".)' },
      { name: 'Swindle', colour: 'green', words: ['FLEECE', 'CON', 'HUSTLE', 'SCAM'], explanation: 'Ways to cheat someone.' },
      { name: '___ PRINT', colour: 'blue', words: ['FOOT', 'BLUE', 'FINGER', 'NEWS'], explanation: 'Each precedes PRINT: footprint, blueprint, fingerprint, newsprint.' },
      { name: 'Hidden ANT', colour: 'purple', words: ['GIANT', 'PLANT', 'VACANT', 'ELEGANT'], explanation: 'Each hides ANT: giANT, plANT, vacANT, elegANT.' },
    ],
  },
  {
    id: 'cn-012',
    title: 'Around the World',
    difficulty: 'green',
    categories: [
      { name: 'Wet weather', colour: 'yellow', words: ['RAIN', 'SNOW', 'HAIL', 'SLEET'], explanation: 'It is falling from the sky.' },
      { name: 'Taxi ride', colour: 'green', words: ['FARE', 'METER', 'CAB', 'TIP'], explanation: 'Parts of catching a cab.' },
      { name: '___ FALL', colour: 'blue', words: ['WATER', 'NIGHT', 'PIT', 'WIND'], explanation: 'Each precedes FALL: waterfall, nightfall, pitfall, windfall. (WIND tempts weather.)' },
      { name: 'World capitals', colour: 'purple', words: ['PARIS', 'CAIRO', 'OSLO', 'LIMA'], explanation: 'Capitals of France, Egypt, Norway and Peru.' },
    ],
  },
  {
    id: 'cn-013',
    title: 'Down on the Farm',
    difficulty: 'yellow',
    categories: [
      { name: 'Farm animals', colour: 'yellow', words: ['COW', 'PIG', 'SHEEP', 'GOAT'], explanation: 'Live in the barnyard.' },
      { name: 'Colours', colour: 'green', words: ['RED', 'BLUE', 'GREEN', 'PINK'], explanation: 'Basic colours.' },
      { name: 'In the sky', colour: 'blue', words: ['SUN', 'MOON', 'STAR', 'CLOUD'], explanation: 'Look up to see them.' },
      { name: 'Fast food', colour: 'purple', words: ['FRIES', 'BURGER', 'NUGGET', 'SHAKE'], explanation: 'A drive-thru order.' },
    ],
  },
  {
    id: 'cn-014',
    title: 'Simple Things',
    difficulty: 'yellow',
    categories: [
      { name: 'Parts of the face', colour: 'yellow', words: ['EYE', 'NOSE', 'CHIN', 'CHEEK'], explanation: 'Above the neck.' },
      { name: 'Days of the week', colour: 'green', words: ['MONDAY', 'FRIDAY', 'SUNDAY', 'TUESDAY'], explanation: 'Days on the calendar.' },
      { name: 'Fruits', colour: 'blue', words: ['APPLE', 'BANANA', 'CHERRY', 'MANGO'], explanation: 'Found in the fruit bowl.' },
      { name: 'Round things', colour: 'purple', words: ['BALL', 'WHEEL', 'COIN', 'PLATE'], explanation: 'All are circular.' },
    ],
  },
  {
    id: 'cn-015',
    title: 'Hot and Cold',
    difficulty: 'green',
    categories: [
      { name: 'Ice cream flavours', colour: 'yellow', words: ['VANILLA', 'CHOCOLATE', 'STRAWBERRY', 'MINT'], explanation: 'Scoops in a cone.' },
      { name: 'Winter gear', colour: 'green', words: ['SCARF', 'MITTEN', 'SLED', 'IGLOO'], explanation: 'Cold-weather things.' },
      { name: '___ CREAM', colour: 'blue', words: ['ICE', 'SUN', 'SOUR', 'WHIPPED'], explanation: 'Each precedes CREAM: ice, sun, sour, whipped. (ICE tempts winter.)' },
      { name: 'Hidden RED', colour: 'purple', words: ['SACRED', 'HUNDRED', 'HATRED', 'CREDIT'], explanation: 'Each hides RED: sacRED, hundRED, hatRED, cREDit.' },
    ],
  },
  {
    id: 'cn-016',
    title: 'Game Night',
    difficulty: 'green',
    categories: [
      { name: 'Board games', colour: 'yellow', words: ['MONOPOLY', 'CLUE', 'SORRY', 'RISK'], explanation: 'Pulled off the games shelf.' },
      { name: 'Feelings', colour: 'green', words: ['JOY', 'FEAR', 'PRIDE', 'GUILT'], explanation: 'Emotions.' },
      { name: 'Playing cards', colour: 'blue', words: ['ACE', 'KING', 'QUEEN', 'JACK'], explanation: 'Face values in a deck.' },
      { name: 'Anagrams of STOP', colour: 'purple', words: ['POTS', 'TOPS', 'SPOT', 'POST'], explanation: 'Rearrange the letters of STOP.' },
    ],
  },
  {
    id: 'cn-017',
    title: 'Crossed Wires',
    difficulty: 'blue',
    categories: [
      { name: 'Trees', colour: 'yellow', words: ['OAK', 'PINE', 'MAPLE', 'BIRCH'], explanation: 'Types of tree.' },
      { name: 'Beers', colour: 'green', words: ['LAGER', 'STOUT', 'CIDER', 'ALE'], explanation: 'On tap at the pub.' },
      { name: 'Boxing moves', colour: 'blue', words: ['JAB', 'HOOK', 'CROSS', 'CLINCH'], explanation: 'In the ring.' },
      { name: 'Hidden vegetables', colour: 'purple', words: ['CORNER', 'PEASANT', 'BEETLE', 'SLEEK'], explanation: 'Hide a veg: CORNer, PEAsant, BEETle, sLEEK.' },
    ],
  },
  {
    id: 'cn-018',
    title: 'In Plain Sight',
    difficulty: 'blue',
    categories: [
      { name: 'Units of time', colour: 'yellow', words: ['SECOND', 'MINUTE', 'HOUR', 'WEEK'], explanation: 'Measured on a clock or calendar.' },
      { name: 'Track events', colour: 'green', words: ['SPRINT', 'HURDLES', 'JAVELIN', 'SHOTPUT'], explanation: 'At the athletics meet.' },
      { name: '___ LIGHT', colour: 'blue', words: ['MOON', 'SPOT', 'FLASH', 'HIGH'], explanation: 'Each precedes LIGHT: moonlight, spotlight, flashlight, highlight.' },
      { name: 'Hidden CAT', colour: 'purple', words: ['EDUCATE', 'LOCATE', 'SCATTER', 'DELICATE'], explanation: 'Each hides CAT: eduCATe, loCATe, sCATter, deliCATe.' },
    ],
  },
  {
    id: 'cn-019',
    title: 'Backwards Day',
    difficulty: 'purple',
    categories: [
      { name: 'Small animals', colour: 'yellow', words: ['BAT', 'RAT', 'OWL', 'CAT'], explanation: 'Three-letter critters.' },
      { name: 'Cooking verbs', colour: 'green', words: ['BOIL', 'FRY', 'GRILL', 'ROAST'], explanation: 'Ways to cook.' },
      { name: 'Reverse to a new word', colour: 'blue', words: ['STAR', 'GULP', 'TIME', 'LOOT'], explanation: 'Backwards: rats, plug, emit, tool.' },
      { name: 'Hidden countries', colour: 'purple', words: ['INCUBATE', 'PIRANHA', 'SOMALIA', 'ROMANIA'], explanation: 'Hide a country: inCUBAte, pIRANha, soMALIa, rOMANia.' },
    ],
  },
  {
    id: 'cn-020',
    title: 'Sleight of Word',
    difficulty: 'blue',
    categories: [
      { name: 'Cheeses', colour: 'yellow', words: ['BRIE', 'GOUDA', 'FETA', 'EDAM'], explanation: 'On the cheese board.' },
      { name: 'Spices', colour: 'green', words: ['CUMIN', 'BASIL', 'THYME', 'SAGE'], explanation: 'In the spice rack. (THYME/SAGE have double meanings.)' },
      { name: 'Sound like numbers', colour: 'blue', words: ['WON', 'TOO', 'FOR', 'ATE'], explanation: 'Homophones of one, two, four, eight.' },
      { name: 'Hidden ICE', colour: 'purple', words: ['JUICE', 'PRICE', 'NOTICE', 'DEVICE'], explanation: 'Each hides ICE: juICE, prICE, notICE, devICE.' },
    ],
  },

  // ── Batch 2: cn-021 … cn-050 ──────────────────────────────────────────────
  {
    id: 'cn-021', title: 'Jungle Book', difficulty: 'yellow',
    categories: [
      { name: 'Jungle animals', colour: 'yellow', words: ['TIGER', 'MONKEY', 'PARROT', 'SNAKE'], explanation: 'Live in the rainforest.' },
      { name: 'Bodies of water', colour: 'green', words: ['LAKE', 'RIVER', 'POND', 'OCEAN'], explanation: 'Wet and wide.' },
      { name: 'Shapes', colour: 'blue', words: ['CIRCLE', 'SQUARE', 'TRIANGLE', 'OVAL'], explanation: 'Basic geometry.' },
      { name: 'Cold things', colour: 'purple', words: ['ICE', 'SNOW', 'FROST', 'HAIL'], explanation: 'Brrr.' },
    ],
  },
  {
    id: 'cn-022', title: 'Kitchen Counter', difficulty: 'yellow',
    categories: [
      { name: 'Kitchen appliances', colour: 'yellow', words: ['TOASTER', 'BLENDER', 'KETTLE', 'OVEN'], explanation: 'Plug them in.' },
      { name: 'Utensils', colour: 'green', words: ['FORK', 'SPOON', 'KNIFE', 'LADLE'], explanation: 'Eat or serve with them.' },
      { name: 'Herbs', colour: 'blue', words: ['PARSLEY', 'BASIL', 'MINT', 'DILL'], explanation: 'Fresh green flavour.' },
      { name: 'Citrus fruits', colour: 'purple', words: ['LEMON', 'LIME', 'ORANGE', 'TANGERINE'], explanation: 'Tart and zesty.' },
    ],
  },
  {
    id: 'cn-023', title: 'Schoolyard', difficulty: 'yellow',
    categories: [
      { name: 'School subjects', colour: 'yellow', words: ['MATH', 'SCIENCE', 'HISTORY', 'ART'], explanation: 'On the timetable.' },
      { name: 'Writing tools', colour: 'green', words: ['PEN', 'PENCIL', 'MARKER', 'CRAYON'], explanation: 'For colouring and writing.' },
      { name: 'Playground games', colour: 'blue', words: ['TAG', 'HOPSCOTCH', 'MARBLES', 'JACKS'], explanation: 'Recess favourites.' },
      { name: 'Things with a point', colour: 'purple', words: ['ARROW', 'NEEDLE', 'PIN', 'DART'], explanation: 'Sharp tips.' },
    ],
  },
  {
    id: 'cn-024', title: 'Beach Day', difficulty: 'yellow',
    categories: [
      { name: 'At the beach', colour: 'yellow', words: ['SAND', 'WAVE', 'SHELL', 'TOWEL'], explanation: 'By the shore.' },
      { name: 'Swimming gear', colour: 'green', words: ['TRUNKS', 'GOGGLES', 'FLIPPERS', 'SNORKEL'], explanation: 'For the water.' },
      { name: 'Ice cream', colour: 'blue', words: ['CONE', 'SCOOP', 'SPRINKLES', 'SUNDAE'], explanation: 'A frozen treat.' },
      { name: 'Sea creatures', colour: 'purple', words: ['CRAB', 'SQUID', 'EEL', 'RAY'], explanation: 'Under the sea.' },
    ],
  },
  {
    id: 'cn-025', title: 'Toolbox', difficulty: 'yellow',
    categories: [
      { name: 'Tools', colour: 'yellow', words: ['HAMMER', 'WRENCH', 'SCREWDRIVER', 'PLIERS'], explanation: 'In the shed.' },
      { name: 'Fasteners', colour: 'green', words: ['NAIL', 'SCREW', 'BOLT', 'STAPLE'], explanation: 'Hold things together.' },
      { name: 'Metals', colour: 'blue', words: ['IRON', 'COPPER', 'STEEL', 'BRASS'], explanation: 'Forged and cast.' },
      { name: 'Units of weight', colour: 'purple', words: ['GRAM', 'OUNCE', 'POUND', 'TON'], explanation: 'How heavy.' },
    ],
  },
  {
    id: 'cn-026', title: 'Green Thumb', difficulty: 'yellow',
    categories: [
      { name: 'Flowers', colour: 'yellow', words: ['ROSE', 'TULIP', 'DAISY', 'LILY'], explanation: 'In the flowerbed.' },
      { name: 'Garden tools', colour: 'green', words: ['RAKE', 'HOE', 'SPADE', 'TROWEL'], explanation: 'For digging and tidying.' },
      { name: 'Insects', colour: 'blue', words: ['ANT', 'BEE', 'WASP', 'BEETLE'], explanation: 'Six-legged.' },
      { name: 'Parts of a tree', colour: 'purple', words: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'], explanation: 'From ground to canopy.' },
    ],
  },
  {
    id: 'cn-027', title: 'Music Class', difficulty: 'yellow',
    categories: [
      { name: 'Instruments', colour: 'yellow', words: ['PIANO', 'GUITAR', 'VIOLIN', 'FLUTE'], explanation: 'Played in an orchestra or band.' },
      { name: 'Brass', colour: 'green', words: ['TRUMPET', 'TUBA', 'TROMBONE', 'HORN'], explanation: 'Blow into the metal.' },
      { name: 'Music genres', colour: 'blue', words: ['JAZZ', 'ROCK', 'BLUES', 'POP'], explanation: 'Styles of music.' },
      { name: 'Parts of a song', colour: 'purple', words: ['VERSE', 'CHORUS', 'BRIDGE', 'HOOK'], explanation: 'Song structure.' },
    ],
  },
  {
    id: 'cn-028', title: 'Weather Report', difficulty: 'yellow',
    categories: [
      { name: 'Sunny day', colour: 'yellow', words: ['SUN', 'WARM', 'CLEAR', 'BRIGHT'], explanation: 'Fair weather.' },
      { name: 'Storm', colour: 'green', words: ['THUNDER', 'LIGHTNING', 'GUST', 'DOWNPOUR'], explanation: 'Rough weather.' },
      { name: 'Seasons', colour: 'blue', words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'], explanation: 'Times of year.' },
      { name: 'Cloud types', colour: 'purple', words: ['CIRRUS', 'CUMULUS', 'STRATUS', 'NIMBUS'], explanation: 'Named clouds.' },
    ],
  },
  {
    id: 'cn-029', title: 'Double Take', difficulty: 'green',
    categories: [
      { name: 'Cat breeds', colour: 'yellow', words: ['SIAMESE', 'PERSIAN', 'TABBY', 'BENGAL'], explanation: 'Breeds of cat.' },
      { name: 'Card suits', colour: 'green', words: ['HEART', 'SPADE', 'CLUB', 'DIAMOND'], explanation: 'In a deck. (DIAMOND tempts baseball.)' },
      { name: 'Baseball terms', colour: 'blue', words: ['PITCH', 'BASE', 'STRIKE', 'BUNT'], explanation: 'On the diamond.' },
      { name: 'Hidden CAR', colour: 'purple', words: ['OSCAR', 'SCARE', 'VICAR', 'MASCARA'], explanation: 'Each hides CAR: osCAR, sCARe, viCAR, masCARa.' },
    ],
  },
  {
    id: 'cn-030', title: 'Pub Night', difficulty: 'green',
    categories: [
      { name: 'Cocktails', colour: 'yellow', words: ['MOJITO', 'MARTINI', 'MARGARITA', 'NEGRONI'], explanation: 'At the bar.' },
      { name: 'Pub games', colour: 'green', words: ['DARTS', 'POOL', 'SNOOKER', 'TRIVIA'], explanation: 'Played at the pub.' },
      { name: '___ BALL', colour: 'blue', words: ['BASE', 'BASKET', 'FOOT', 'EYE'], explanation: 'Each precedes BALL: baseball, basketball, football, eyeball.' },
      { name: 'Hidden PEN', colour: 'purple', words: ['OPEN', 'SPEND', 'HAPPEN', 'EXPENSE'], explanation: 'Each hides PEN: oPEN, sPENd, hapPEN, exPENse.' },
    ],
  },
  {
    id: 'cn-031', title: 'Clockwork', difficulty: 'green',
    categories: [
      { name: 'Clock parts', colour: 'yellow', words: ['HAND', 'FACE', 'DIAL', 'ALARM'], explanation: 'On a clock. (HAND/FACE tempt body parts.)' },
      { name: 'Months', colour: 'green', words: ['APRIL', 'JUNE', 'MARCH', 'MAY'], explanation: 'On the calendar.' },
      { name: 'Fast', colour: 'blue', words: ['QUICK', 'RAPID', 'SWIFT', 'BRISK'], explanation: 'Synonyms for speedy.' },
      { name: 'Hidden EAR', colour: 'purple', words: ['SEARCH', 'YEARN', 'PEARL', 'BEARD'], explanation: 'Each hides EAR: sEARch, yEARn, pEARl, bEARd.' },
    ],
  },
  {
    id: 'cn-032', title: 'Colour Wheel', difficulty: 'green',
    categories: [
      { name: 'Shades of green', colour: 'yellow', words: ['OLIVE', 'LIME', 'EMERALD', 'JADE'], explanation: 'Variations of green. (LIME tempts citrus.)' },
      { name: 'Gemstones', colour: 'green', words: ['RUBY', 'OPAL', 'TOPAZ', 'AMBER'], explanation: 'Precious stones.' },
      { name: 'Traffic words', colour: 'blue', words: ['STOP', 'GO', 'YIELD', 'MERGE'], explanation: 'On the road.' },
      { name: 'Sound like two words', colour: 'purple', words: ['CARPET', 'CARGO', 'TARGET', 'BOYCOTT'], explanation: 'Car-pet, car-go, tar-get, boy-cott.' },
    ],
  },
  {
    id: 'cn-033', title: 'On the Map', difficulty: 'green',
    categories: [
      { name: 'Continents', colour: 'yellow', words: ['ASIA', 'AFRICA', 'EUROPE', 'OCEANIA'], explanation: 'Land masses.' },
      { name: 'US states', colour: 'green', words: ['TEXAS', 'OHIO', 'MAINE', 'UTAH'], explanation: 'Stars on the flag.' },
      { name: 'Oceans', colour: 'blue', words: ['PACIFIC', 'ATLANTIC', 'ARCTIC', 'INDIAN'], explanation: 'The five seas.' },
      { name: 'World capitals', colour: 'purple', words: ['TOKYO', 'MADRID', 'ATHENS', 'BERLIN'], explanation: 'Capitals of Japan, Spain, Greece, Germany.' },
    ],
  },
  {
    id: 'cn-034', title: 'Sweet Tooth', difficulty: 'green',
    categories: [
      { name: 'Candy', colour: 'yellow', words: ['TAFFY', 'FUDGE', 'CARAMEL', 'NOUGAT'], explanation: 'Sweets.' },
      { name: 'Baked desserts', colour: 'green', words: ['CAKE', 'PIE', 'TART', 'BROWNIE'], explanation: 'Out of the oven.' },
      { name: 'Birthday party', colour: 'blue', words: ['BALLOON', 'CANDLE', 'PRESENT', 'CONFETTI'], explanation: 'Celebration kit.' },
      { name: 'Comes in a shell', colour: 'purple', words: ['EGG', 'NUT', 'TURTLE', 'OYSTER'], explanation: 'Hard outer casing.' },
    ],
  },
  {
    id: 'cn-035', title: 'Birdie', difficulty: 'blue',
    categories: [
      { name: 'Ball sports', colour: 'yellow', words: ['SOCCER', 'TENNIS', 'GOLF', 'RUGBY'], explanation: 'Played with a ball.' },
      { name: 'Olympic events', colour: 'green', words: ['ARCHERY', 'FENCING', 'ROWING', 'DIVING'], explanation: 'At the Games.' },
      { name: 'Golf scores', colour: 'blue', words: ['PAR', 'BIRDIE', 'BOGEY', 'EAGLE'], explanation: 'On the scorecard. (BIRDIE/EAGLE tempt birds.)' },
      { name: 'Birds', colour: 'purple', words: ['ROBIN', 'FINCH', 'WREN', 'SPARROW'], explanation: 'Small garden birds.' },
    ],
  },
  {
    id: 'cn-036', title: 'House Edge', difficulty: 'green',
    categories: [
      { name: 'In a casino', colour: 'yellow', words: ['DICE', 'CHIPS', 'CARDS', 'ROULETTE'], explanation: 'On the casino floor.' },
      { name: 'Gambling games', colour: 'green', words: ['POKER', 'BLACKJACK', 'CRAPS', 'KENO'], explanation: 'Games of chance.' },
      { name: '___ JACK', colour: 'blue', words: ['LUMBER', 'FLAP', 'CRACKER', 'CAR'], explanation: 'Each precedes JACK: lumberjack, flapjack, crackerjack, carjack.' },
      { name: 'Hidden OWL', colour: 'purple', words: ['BOWL', 'GROWL', 'PROWL', 'SCOWL'], explanation: 'Each hides OWL: bOWL, grOWL, prOWL, scOWL.' },
    ],
  },
  {
    id: 'cn-037', title: 'Once Upon a Time', difficulty: 'green',
    categories: [
      { name: 'Fairy-tale figures', colour: 'yellow', words: ['PRINCE', 'WITCH', 'DRAGON', 'FAIRY'], explanation: 'Storybook characters.' },
      { name: 'Castle features', colour: 'green', words: ['MOAT', 'TOWER', 'DUNGEON', 'DRAWBRIDGE'], explanation: 'Parts of a castle.' },
      { name: 'Magic words', colour: 'blue', words: ['ABRACADABRA', 'PRESTO', 'HOCUS', 'POOF'], explanation: 'Said by a magician.' },
      { name: 'Mythical creatures', colour: 'purple', words: ['TROLL', 'GOBLIN', 'GIANT', 'ELF'], explanation: 'From folklore.' },
    ],
  },
  {
    id: 'cn-038', title: 'All Hands on Deck', difficulty: 'blue',
    categories: [
      { name: 'Spices', colour: 'yellow', words: ['PEPPER', 'GINGER', 'NUTMEG', 'CLOVE'], explanation: 'Warm flavours.' },
      { name: 'Knots', colour: 'green', words: ['HITCH', 'BOWLINE', 'REEF', 'GRANNY'], explanation: 'Tie them in rope. (REEF tempts nautical.)' },
      { name: 'Nautical terms', colour: 'blue', words: ['MAST', 'DECK', 'BOW', 'STERN'], explanation: 'Parts of a ship.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['SNAP', 'DRAB', 'LEVER', 'KEEP'], explanation: 'Backwards: pans, bard, revel, peek.' },
    ],
  },
  {
    id: 'cn-039', title: 'Sidewalk', difficulty: 'blue',
    categories: [
      { name: 'Bodies of water', colour: 'yellow', words: ['SEA', 'BAY', 'GULF', 'COVE'], explanation: 'Coastal waters.' },
      { name: 'Parts of a ship', colour: 'green', words: ['HULL', 'KEEL', 'RUDDER', 'GALLEY'], explanation: 'Below decks.' },
      { name: '___ WALK', colour: 'blue', words: ['BOARD', 'SIDE', 'CAT', 'JAY'], explanation: 'Each precedes WALK: boardwalk, sidewalk, catwalk, jaywalk.' },
      { name: 'Hidden ARM', colour: 'purple', words: ['ALARM', 'WARM', 'FARMER', 'HARMONY'], explanation: 'Each hides ARM: alARM, wARM, fARMer, hARMony.' },
    ],
  },
  {
    id: 'cn-040', title: 'Bookworm', difficulty: 'blue',
    categories: [
      { name: 'Trees', colour: 'yellow', words: ['CEDAR', 'WILLOW', 'ASPEN', 'ELM'], explanation: 'Types of tree.' },
      { name: 'Sci-fi', colour: 'green', words: ['ROBOT', 'ALIEN', 'LASER', 'ANDROID'], explanation: 'Space-age words.' },
      { name: '___ WORM', colour: 'blue', words: ['BOOK', 'EARTH', 'SILK', 'GLOW'], explanation: 'Each precedes WORM: bookworm, earthworm, silkworm, glowworm.' },
      { name: 'Hidden RAT', colour: 'purple', words: ['CRATE', 'GRATE', 'PIRATE', 'DEMOCRAT'], explanation: 'Each hides RAT: cRATe, gRATe, piRATe, democRAT.' },
    ],
  },
  {
    id: 'cn-041', title: 'Something Fishy', difficulty: 'blue',
    categories: [
      { name: 'Earth tones', colour: 'yellow', words: ['AMBER', 'IVORY', 'CORAL', 'SLATE'], explanation: 'Muted natural colours.' },
      { name: 'Textures', colour: 'green', words: ['ROUGH', 'SMOOTH', 'BUMPY', 'SILKY'], explanation: 'How it feels.' },
      { name: '___ FISH', colour: 'blue', words: ['JELLY', 'STAR', 'SWORD', 'CAT'], explanation: 'Each precedes FISH: jellyfish, starfish, swordfish, catfish.' },
      { name: 'Hidden TEN', colour: 'purple', words: ['OFTEN', 'ROTTEN', 'LISTEN', 'MITTEN'], explanation: 'Each hides TEN: ofTEN, rotTEN, lisTEN, mitTEN.' },
    ],
  },
  {
    id: 'cn-042', title: 'Behind the Mask', difficulty: 'blue',
    categories: [
      { name: 'Superhero kit', colour: 'yellow', words: ['CAPE', 'MASK', 'POWER', 'HERO'], explanation: 'Caped-crusader gear.' },
      { name: 'Villain words', colour: 'green', words: ['LAIR', 'MINION', 'SCHEME', 'DOOM'], explanation: 'The bad guys.' },
      { name: 'Comic sound effects', colour: 'blue', words: ['POW', 'BAM', 'ZAP', 'BOOM'], explanation: 'In the speech bubble.' },
      { name: 'Hidden BAT', colour: 'purple', words: ['COMBAT', 'DEBATE', 'ACROBAT', 'SABBATH'], explanation: 'Each hides BAT: comBAT, deBATe, acroBAT, sabBATh.' },
    ],
  },
  {
    id: 'cn-043', title: 'Smartphone', difficulty: 'blue',
    categories: [
      { name: 'Phone parts', colour: 'yellow', words: ['SCREEN', 'BUTTON', 'SPEAKER', 'CAMERA'], explanation: 'On a handset.' },
      { name: 'Touch gestures', colour: 'green', words: ['SWIPE', 'TAP', 'SCROLL', 'PINCH'], explanation: 'How you use a screen.' },
      { name: 'Signal terms', colour: 'blue', words: ['DOT', 'DASH', 'SIGNAL', 'CODE'], explanation: 'Morse and comms.' },
      { name: 'Hidden APP', colour: 'purple', words: ['HAPPY', 'GRAPPLE', 'SAPPHIRE', 'WRAPPER'], explanation: 'Each hides APP: hAPPy, grAPPle, sAPPhire, wrAPPer.' },
    ],
  },
  {
    id: 'cn-044', title: 'Show Me the Money', difficulty: 'blue',
    categories: [
      { name: 'Money slang', colour: 'yellow', words: ['CASH', 'DOUGH', 'BUCKS', 'LOOT'], explanation: 'Words for cash.' },
      { name: 'Ways to pay', colour: 'green', words: ['CARD', 'COIN', 'CHECK', 'WIRE'], explanation: 'Settle the bill.' },
      { name: 'Reverse to a new word', colour: 'blue', words: ['DIAL', 'POOL', 'DEER', 'FLOW'], explanation: 'Backwards: laid, loop, reed, wolf.' },
      { name: 'Hidden TON', colour: 'purple', words: ['COTTON', 'CARTON', 'PHOTON', 'SKELETON'], explanation: 'Each hides TON: cotTON, carTON, phoTON, skeleTON.' },
    ],
  },
  {
    id: 'cn-045', title: 'Sharp Mind', difficulty: 'purple',
    categories: [
      { name: 'Sharp things', colour: 'yellow', words: ['KNIFE', 'RAZOR', 'BLADE', 'THORN'], explanation: 'Mind the edge. (SHARP tempts here.)' },
      { name: 'Music notation', colour: 'green', words: ['SHARP', 'FLAT', 'REST', 'KEY'], explanation: 'On the staff.' },
      { name: 'Sound like letters', colour: 'blue', words: ['GEE', 'QUEUE', 'WHY', 'YOU'], explanation: 'Homophones of G, Q, Y, U.' },
      { name: 'Hidden instruments', colour: 'purple', words: ['ORGANIC', 'VIOLATE', 'HARPOON', 'SALUTE'], explanation: 'Hide an instrument: ORGANic, VIOLAte, HARPoon, saLUTE.' },
    ],
  },
  {
    id: 'cn-046', title: 'Letter Perfect', difficulty: 'purple',
    categories: [
      { name: 'Sound like letters', colour: 'yellow', words: ['EX', 'ESS', 'DEE', 'PEA'], explanation: 'Homophones of X, S, D, P.' },
      { name: 'Greek letters', colour: 'green', words: ['SIGMA', 'GAMMA', 'THETA', 'KAPPA'], explanation: 'From the Greek alphabet.' },
      { name: 'Reverse to a new word', colour: 'blue', words: ['GNAT', 'STRAP', 'SPOOL', 'BUNS'], explanation: 'Backwards: tang, parts, loops, snub.' },
      { name: 'Hidden EAST', colour: 'purple', words: ['BEAST', 'FEAST', 'YEAST', 'LEAST'], explanation: 'Each hides EAST, the direction.' },
    ],
  },
  {
    id: 'cn-047', title: 'Double Agent', difficulty: 'purple',
    categories: [
      { name: 'Spy words', colour: 'yellow', words: ['AGENT', 'CIPHER', 'COVER', 'MOLE'], explanation: 'Espionage. (MOLE tempts animals.)' },
      { name: 'Animals that are also verbs', colour: 'green', words: ['DUCK', 'BADGER', 'HOUND', 'CRANE'], explanation: 'Duck, badger, hound, crane — each is also an action.' },
      { name: 'Blow a ___', colour: 'blue', words: ['KISS', 'WHISTLE', 'BUBBLE', 'FUSE'], explanation: 'Blow a kiss, whistle, bubble, fuse.' },
      { name: 'Hidden KEY', colour: 'purple', words: ['MONKEY', 'DONKEY', 'HOCKEY', 'TURKEY'], explanation: 'Each hides KEY: monKEY, donKEY, hocKEY, turKEY.' },
    ],
  },
  {
    id: 'cn-048', title: 'Hidden Depths', difficulty: 'blue',
    categories: [
      { name: 'Underwater', colour: 'yellow', words: ['REEF', 'KELP', 'CORAL', 'LAGOON'], explanation: 'Beneath the waves.' },
      { name: 'Fish', colour: 'green', words: ['TUNA', 'COD', 'BASS', 'PERCH'], explanation: 'Caught at sea. (BASS tempts music.)' },
      { name: '___ WAVE', colour: 'blue', words: ['MICRO', 'HEAT', 'SHOCK', 'BRAIN'], explanation: 'Each precedes WAVE: microwave, heatwave, shockwave, brainwave.' },
      { name: 'Hidden EEL', colour: 'purple', words: ['WHEEL', 'STEEL', 'KNEEL', 'GENTEEL'], explanation: 'Each hides EEL: whEEL, stEEL, knEEL, gentEEL.' },
    ],
  },
  {
    id: 'cn-049', title: 'Cryptic', difficulty: 'purple',
    categories: [
      { name: 'Puzzle types', colour: 'yellow', words: ['CROSSWORD', 'SUDOKU', 'MAZE', 'RIDDLE'], explanation: 'Brain teasers.' },
      { name: 'Codes', colour: 'green', words: ['MORSE', 'BINARY', 'BRAILLE', 'CIPHER'], explanation: 'Ways to encode.' },
      { name: 'Anagrams of LISTEN', colour: 'blue', words: ['SILENT', 'TINSEL', 'ENLIST', 'INLETS'], explanation: 'Rearrange the letters of LISTEN.' },
      { name: 'Reverse to a new word', colour: 'purple', words: ['STEP', 'REGAL', 'DENIM', 'KNITS'], explanation: 'Backwards: pets, lager, mined, stink.' },
    ],
  },
  {
    id: 'cn-050', title: 'Grand Finale', difficulty: 'purple',
    categories: [
      { name: 'Fireworks', colour: 'yellow', words: ['ROCKET', 'SPARKLER', 'FOUNTAIN', 'BANGER'], explanation: 'Light the fuse.' },
      { name: 'New Year', colour: 'green', words: ['MIDNIGHT', 'RESOLUTION', 'COUNTDOWN', 'TOAST'], explanation: 'Ring it in.' },
      { name: 'Sound like two words', colour: 'blue', words: ['MUSHROOM', 'NIGHTMARE', 'CARNATION', 'BUTTERFLY'], explanation: 'Mush-room, night-mare, car-nation, butter-fly.' },
      { name: 'Hidden END', colour: 'purple', words: ['LEGEND', 'CALENDAR', 'AGENDA', 'SPLENDID'], explanation: 'Each hides END: legEND, calENDar, agENDa, splENDid.' },
    ],
  },
];
