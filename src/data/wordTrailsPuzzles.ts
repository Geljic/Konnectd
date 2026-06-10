export type TrailRelation =
  | 'cause'
  | 'sequence'
  | 'growth'
  | 'process'
  | 'place'
  | 'phrase'
  | 'hierarchy'
  | 'story'
  | 'association';

export interface WordTrail {
  words: [string, string, string, string];
  label: string;
  relation: TrailRelation;
}

export interface WordTrailsPuzzle {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  trails: [WordTrail, WordTrail, WordTrail, WordTrail];
}

export const WORD_TRAILS_PUZZLES: WordTrailsPuzzle[] = [
  {
    id: 'wt-001',
    title: 'First Steps',
    difficulty: 1,
    trails: [
      { words: ['SEED', 'ROOT', 'TREE', 'FOREST'], label: 'grows into', relation: 'growth' },
      { words: ['MATCH', 'SPARK', 'FIRE', 'SMOKE'], label: 'causes', relation: 'cause' },
      { words: ['SCRIPT', 'ACTOR', 'STAGE', 'APPLAUSE'], label: 'performance path', relation: 'sequence' },
      { words: ['COURT', 'JUDGE', 'VERDICT', 'SENTENCE'], label: 'legal process', relation: 'process' },
    ],
  },
  {
    id: 'wt-002',
    title: 'Morning Run',
    difficulty: 1,
    trails: [
      { words: ['BEAN', 'GRINDER', 'COFFEE', 'MUG'], label: 'coffee making', relation: 'process' },
      { words: ['ALARM', 'YAWN', 'SHOWER', 'BREAKFAST'], label: 'morning routine', relation: 'sequence' },
      { words: ['LACE', 'SHOE', 'TRACK', 'FINISH'], label: 'race preparation', relation: 'sequence' },
      { words: ['CLOUD', 'RAIN', 'PUDDLE', 'SPLASH'], label: 'rainy chain', relation: 'cause' },
    ],
  },
  {
    id: 'wt-003',
    title: 'Kitchen Logic',
    difficulty: 1,
    trails: [
      { words: ['FLOUR', 'DOUGH', 'BREAD', 'TOAST'], label: 'baking path', relation: 'process' },
      { words: ['EGG', 'PAN', 'OMELET', 'PLATE'], label: 'breakfast cooking', relation: 'process' },
      { words: ['KNIFE', 'ONION', 'TEARS', 'TISSUE'], label: 'chopping consequence', relation: 'cause' },
      { words: ['RECIPE', 'INGREDIENT', 'OVEN', 'DINNER'], label: 'meal plan', relation: 'process' },
    ],
  },
  {
    id: 'wt-004',
    title: 'Nature Walk',
    difficulty: 1,
    trails: [
      { words: ['BUD', 'BLOSSOM', 'FLOWER', 'BOUQUET'], label: 'flower growth', relation: 'growth' },
      { words: ['STREAM', 'RIVER', 'DELTA', 'OCEAN'], label: 'water journey', relation: 'place' },
      { words: ['CATERPILLAR', 'COCOON', 'BUTTERFLY', 'WING'], label: 'metamorphosis', relation: 'process' },
      { words: ['NEST', 'EGG', 'CHICK', 'FLIGHT'], label: 'bird life', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-005',
    title: 'Office Day',
    difficulty: 1,
    trails: [
      { words: ['EMAIL', 'MEETING', 'AGENDA', 'MINUTES'], label: 'meeting workflow', relation: 'process' },
      { words: ['IDEA', 'DRAFT', 'REVIEW', 'PUBLISH'], label: 'writing workflow', relation: 'process' },
      { words: ['DESK', 'CHAIR', 'KEYBOARD', 'SCREEN'], label: 'workstation', relation: 'association' },
      { words: ['CALENDAR', 'REMINDER', 'DEADLINE', 'DELIVERY'], label: 'project timing', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-006',
    title: 'Night Out',
    difficulty: 1,
    trails: [
      { words: ['TICKET', 'QUEUE', 'SEAT', 'CURTAIN'], label: 'theatre arrival', relation: 'sequence' },
      { words: ['MENU', 'ORDER', 'KITCHEN', 'BILL'], label: 'restaurant flow', relation: 'sequence' },
      { words: ['DANCE', 'MUSIC', 'BEAT', 'CHEER'], label: 'dance floor', relation: 'association' },
      { words: ['CAMERA', 'FLASH', 'PHOTO', 'MEMORY'], label: 'capturing a moment', relation: 'process' },
    ],
  },
  {
    id: 'wt-007',
    title: 'Mixed Bag',
    difficulty: 1,
    trails: [
      { words: ['BELL', 'CLASS', 'LESSON', 'HOMEWORK'], label: 'school routine', relation: 'sequence' },
      { words: ['GRAPE', 'JUICE', 'FERMENT', 'WINE'], label: 'winemaking', relation: 'process' },
      { words: ['WOOL', 'KNIT', 'JUMPER', 'WARDROBE'], label: 'clothing made', relation: 'process' },
      { words: ['DOOR', 'HALL', 'STAIRS', 'BEDROOM'], label: 'path through a home', relation: 'place' },
    ],
  },
  {
    id: 'wt-008',
    title: 'Kick Off',
    difficulty: 1,
    trails: [
      { words: ['WHISTLE', 'KICKOFF', 'PASS', 'GOAL'], label: 'football attack', relation: 'sequence' },
      { words: ['NEEDLE', 'THREAD', 'STITCH', 'PATCH'], label: 'sewing repair', relation: 'process' },
      { words: ['RING', 'ANSWER', 'CHAT', 'GOODBYE'], label: 'phone call', relation: 'sequence' },
      { words: ['CLOUD', 'LIGHTNING', 'THUNDER', 'RAIN'], label: 'storm sequence', relation: 'cause' },
    ],
  },
  {
    id: 'wt-009',
    title: 'Travel Day',
    difficulty: 1,
    trails: [
      { words: ['PASSPORT', 'AIRPORT', 'GATE', 'FLIGHT'], label: 'flying out', relation: 'sequence' },
      { words: ['MAP', 'ROUTE', 'ROAD', 'DESTINATION'], label: 'navigation', relation: 'process' },
      { words: ['SUITCASE', 'HOTEL', 'KEY', 'ROOM'], label: 'checking in', relation: 'sequence' },
      { words: ['POSTCARD', 'STAMP', 'MAILBOX', 'HOME'], label: 'sending back', relation: 'process' },
    ],
  },
  {
    id: 'wt-010',
    title: 'Simple Machines',
    difficulty: 1,
    trails: [
      { words: ['GEAR', 'CHAIN', 'PEDAL', 'BICYCLE'], label: 'bike drive', relation: 'process' },
      { words: ['BUTTON', 'WIRE', 'BULB', 'LIGHT'], label: 'switching on', relation: 'cause' },
      { words: ['LEVER', 'FORCE', 'LIFT', 'WEIGHT'], label: 'mechanical advantage', relation: 'process' },
      { words: ['KEY', 'LOCK', 'DOOR', 'ROOM'], label: 'access path', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-011',
    title: 'City Flow',
    difficulty: 2,
    trails: [
      { words: ['SIDEWALK', 'CROSSWALK', 'STREET', 'BLOCK'], label: 'city walking', relation: 'place' },
      { words: ['SUBWAY', 'PLATFORM', 'TRAIN', 'STATION'], label: 'metro path', relation: 'sequence' },
      { words: ['PERMIT', 'CRANE', 'BUILDING', 'SKYLINE'], label: 'construction growth', relation: 'process' },
      { words: ['SIREN', 'TRAFFIC', 'DETOUR', 'DELAY'], label: 'city disruption', relation: 'cause' },
    ],
  },
  {
    id: 'wt-012',
    title: 'Studio Session',
    difficulty: 2,
    trails: [
      { words: ['MIC', 'STUDIO', 'TRACK', 'ALBUM'], label: 'recording path', relation: 'process' },
      { words: ['ROOT', 'TRUNK', 'BRANCH', 'LEAF'], label: 'tree structure', relation: 'growth' },
      { words: ['INVOICE', 'PAYMENT', 'RECEIPT', 'FILING'], label: 'business admin', relation: 'process' },
      { words: ['BRUISE', 'SWELL', 'ICE', 'HEAL'], label: 'minor injury', relation: 'process' },
    ],
  },
  {
    id: 'wt-013',
    title: 'Cause And Effect',
    difficulty: 2,
    trails: [
      { words: ['PRESSURE', 'WIND', 'STORM', 'DAMAGE'], label: 'storm formation', relation: 'cause' },
      { words: ['COIN', 'SLOT', 'PULL', 'PRIZE'], label: 'slot machine', relation: 'sequence' },
      { words: ['MILK', 'HEAT', 'CURDLE', 'CHEESE'], label: 'cheesemaking', relation: 'process' },
      { words: ['SUSPECT', 'INTERVIEW', 'CHARGE', 'BAIL'], label: 'police procedure', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-014',
    title: 'Movie Set',
    difficulty: 2,
    trails: [
      { words: ['PITCH', 'SCRIPT', 'CAST', 'SHOOT'], label: 'film development', relation: 'process' },
      { words: ['CAMERA', 'SCENE', 'TAKE', 'CUT'], label: 'filming commands', relation: 'sequence' },
      { words: ['TRAILER', 'PREMIERE', 'REVIEW', 'BOXOFFICE'], label: 'release path', relation: 'sequence' },
      { words: ['STUNT', 'RISK', 'HARNESS', 'LANDING'], label: 'stunt safety', relation: 'process' },
    ],
  },
  {
    id: 'wt-015',
    title: 'Busy Day',
    difficulty: 2,
    trails: [
      { words: ['BEE', 'POLLEN', 'FRUIT', 'PIE'], label: 'pollination payoff', relation: 'cause' },
      { words: ['SKETCH', 'COLOUR', 'FRAME', 'WALL'], label: 'making artwork', relation: 'process' },
      { words: ['LEASE', 'KEYS', 'UNPACK', 'HOME'], label: 'moving house', relation: 'sequence' },
      { words: ['MIRROR', 'SIGNAL', 'TURN', 'PARK'], label: 'driving manoeuvre', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-016',
    title: 'Money Trail',
    difficulty: 2,
    trails: [
      { words: ['WORK', 'WAGE', 'BANK', 'SAVINGS'], label: 'earning money', relation: 'process' },
      { words: ['PRICE', 'DISCOUNT', 'RECEIPT', 'REFUND'], label: 'shopping math', relation: 'sequence' },
      { words: ['COIN', 'WALLET', 'REGISTER', 'CHANGE'], label: 'cash purchase', relation: 'process' },
      { words: ['BUDGET', 'BILL', 'PAYMENT', 'BALANCE'], label: 'monthly finances', relation: 'process' },
    ],
  },
  {
    id: 'wt-017',
    title: 'Four Paths',
    difficulty: 2,
    trails: [
      { words: ['SYMPTOM', 'DOCTOR', 'TEST', 'DIAGNOSIS'], label: 'medical assessment', relation: 'process' },
      { words: ['DRAFT', 'EDIT', 'PROOF', 'PRINT'], label: 'publishing path', relation: 'process' },
      { words: ['QUEUE', 'COUNTER', 'ORDER', 'RECEIPT'], label: 'café ordering', relation: 'sequence' },
      { words: ['IRON', 'FOLD', 'STACK', 'DRAWER'], label: 'laundry path', relation: 'process' },
    ],
  },
  {
    id: 'wt-018',
    title: 'Book World',
    difficulty: 2,
    trails: [
      { words: ['AUTHOR', 'DRAFT', 'EDITOR', 'NOVEL'], label: 'making a book', relation: 'process' },
      { words: ['COVER', 'BLURB', 'SHELF', 'READER'], label: 'book discovery', relation: 'sequence' },
      { words: ['PROLOGUE', 'CHAPTER', 'CLIMAX', 'ENDING'], label: 'story arc', relation: 'sequence' },
      { words: ['LIBRARY', 'CARD', 'LOAN', 'RETURN'], label: 'borrowing a book', relation: 'process' },
    ],
  },
  {
    id: 'wt-019',
    title: 'Starting Points',
    difficulty: 2,
    trails: [
      { words: ['REEF', 'FISH', 'NET', 'MARKET'], label: 'seafood path', relation: 'sequence' },
      { words: ['KNEAD', 'RISE', 'BAKE', 'LOAF'], label: 'bread making', relation: 'process' },
      { words: ['SAVE', 'INVEST', 'GROW', 'RETIRE'], label: 'financial planning', relation: 'process' },
      { words: ['DRAFT', 'SUBMIT', 'MARK', 'RETURN'], label: 'assignment cycle', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-020',
    title: 'Workshop',
    difficulty: 2,
    trails: [
      { words: ['MEASURE', 'SAW', 'SAND', 'VARNISH'], label: 'woodwork steps', relation: 'process' },
      { words: ['NAIL', 'HAMMER', 'BOARD', 'FRAME'], label: 'building up', relation: 'process' },
      { words: ['BLUEPRINT', 'MATERIAL', 'BENCH', 'PROJECT'], label: 'making a project', relation: 'process' },
      { words: ['GLUE', 'CLAMP', 'DRY', 'HOLD'], label: 'setting joinery', relation: 'cause' },
    ],
  },
  {
    id: 'wt-021',
    title: 'Double Meanings',
    difficulty: 3,
    trails: [
      { words: ['BANK', 'RIVER', 'CURRENT', 'FLOW'], label: 'water-side bank', relation: 'association' },
      { words: ['LOAN', 'INTEREST', 'PAYMENT', 'DEBT'], label: 'borrowing path', relation: 'process' },
      { words: ['BAT', 'CAVE', 'ECHO', 'NIGHT'], label: 'animal bat', relation: 'association' },
      { words: ['BALL', 'SWING', 'HIT', 'BASE'], label: 'baseball play', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-022',
    title: 'Food Chains',
    difficulty: 3,
    trails: [
      { words: ['GRAIN', 'FLOUR', 'PASTA', 'SAUCE'], label: 'dinner base', relation: 'process' },
      { words: ['COW', 'MILK', 'CHEESE', 'PIZZA'], label: 'dairy route', relation: 'process' },
      { words: ['VINE', 'GRAPE', 'RAISIN', 'COOKIE'], label: 'fruit transformation', relation: 'process' },
      { words: ['COCOA', 'CHOCOLATE', 'BROWNIE', 'CRUMB'], label: 'dessert path', relation: 'process' },
    ],
  },
  {
    id: 'wt-023',
    title: 'Follow Through',
    difficulty: 3,
    trails: [
      { words: ['IDEA', 'CODE', 'BUILD', 'RELEASE'], label: 'software shipping', relation: 'process' },
      { words: ['GRAPE', 'CRUSH', 'FERMENT', 'BOTTLE'], label: 'winemaking', relation: 'process' },
      { words: ['DROUGHT', 'CRACK', 'DRY', 'DUST'], label: 'dry spell consequence', relation: 'cause' },
      { words: ['CLUE', 'SUSPECT', 'CONFRONT', 'CONFESSION'], label: 'detective story', relation: 'story' },
    ],
  },
  {
    id: 'wt-024',
    title: 'Step By Step',
    difficulty: 3,
    trails: [
      { words: ['QUESTION', 'HYPOTHESIS', 'EXPERIMENT', 'RESULT'], label: 'scientific method', relation: 'process' },
      { words: ['GRAIN', 'MILL', 'MASH', 'BARREL'], label: 'brewing process', relation: 'process' },
      { words: ['ROPE', 'HARNESS', 'CLIMB', 'SUMMIT'], label: 'rock climbing', relation: 'sequence' },
      { words: ['CANDIDATE', 'DEBATE', 'POLL', 'ELECTED'], label: 'election path', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-025',
    title: 'History Line',
    difficulty: 3,
    trails: [
      { words: ['SPARK', 'PROTEST', 'REVOLUTION', 'REFORM'], label: 'political change', relation: 'cause' },
      { words: ['EXPLORER', 'MAP', 'COLONY', 'EMPIRE'], label: 'expansion arc', relation: 'sequence' },
      { words: ['INVENTION', 'FACTORY', 'CITY', 'INDUSTRY'], label: 'industrial growth', relation: 'cause' },
      { words: ['LETTER', 'ARCHIVE', 'HISTORIAN', 'BOOK'], label: 'history writing', relation: 'process' },
    ],
  },
  {
    id: 'wt-026',
    title: 'Crime Plot',
    difficulty: 3,
    trails: [
      { words: ['MOTIVE', 'PLAN', 'ALIBI', 'SUSPECT'], label: 'detective reasoning', relation: 'story' },
      { words: ['CLUE', 'PRINT', 'LAB', 'EVIDENCE'], label: 'forensics path', relation: 'process' },
      { words: ['CHASE', 'ARREST', 'TRIAL', 'PRISON'], label: 'justice path', relation: 'sequence' },
      { words: ['MASK', 'VAULT', 'ALARM', 'ESCAPE'], label: 'heist sequence', relation: 'story' },
    ],
  },
  {
    id: 'wt-027',
    title: 'Lift Off',
    difficulty: 3,
    trails: [
      { words: ['COUNTDOWN', 'ROCKET', 'ORBIT', 'SATELLITE'], label: 'launch path', relation: 'sequence' },
      { words: ['WOOL', 'LOOM', 'CLOTH', 'TAILOR'], label: 'textile to garment', relation: 'process' },
      { words: ['SKETCH', 'CHISEL', 'POLISH', 'STATUE'], label: 'sculpting process', relation: 'process' },
      { words: ['AUDITION', 'REHEARSAL', 'OPENING', 'CURTAIN'], label: 'theatre production', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-028',
    title: 'Court And Field',
    difficulty: 3,
    trails: [
      { words: ['COURT', 'JUDGE', 'RULING', 'APPEAL'], label: 'legal court', relation: 'process' },
      { words: ['SERVE', 'RALLY', 'MATCH', 'TROPHY'], label: 'sports court', relation: 'sequence' },
      { words: ['FIELD', 'SEED', 'CROP', 'HARVEST'], label: 'farm field', relation: 'growth' },
      { words: ['PLAYER', 'PASS', 'SCORE', 'FANS'], label: 'sports field', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-029',
    title: 'News Cycle',
    difficulty: 3,
    trails: [
      { words: ['TIP', 'SOURCE', 'REPORTER', 'STORY'], label: 'reporting lead', relation: 'process' },
      { words: ['HEADLINE', 'CLICK', 'ARTICLE', 'COMMENT'], label: 'reader path', relation: 'sequence' },
      { words: ['RUMOR', 'CHECK', 'FACT', 'CORRECTION'], label: 'verification', relation: 'process' },
      { words: ['PHOTO', 'CAPTION', 'FRONT', 'PAGE'], label: 'newspaper placement', relation: 'phrase' },
    ],
  },
  {
    id: 'wt-030',
    title: 'Games Table',
    difficulty: 3,
    trails: [
      { words: ['DECK', 'SHUFFLE', 'HAND', 'TRICK'], label: 'card play', relation: 'sequence' },
      { words: ['DICE', 'ROLL', 'MOVE', 'BOARD'], label: 'board game turn', relation: 'sequence' },
      { words: ['PAWN', 'FILE', 'CHECK', 'MATE'], label: 'chess route', relation: 'sequence' },
      { words: ['LEVEL', 'BOSS', 'LOOT', 'UPGRADE'], label: 'video game loop', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-031',
    title: 'Phrase Shift',
    difficulty: 4,
    trails: [
      { words: ['SILVER', 'LINING', 'CLOUD', 'RAIN'], label: 'silver lining', relation: 'phrase' },
      { words: ['RED', 'HERRING', 'CLUE', 'MYSTERY'], label: 'false clue', relation: 'phrase' },
      { words: ['GLASS', 'CEILING', 'LIMIT', 'BREAK'], label: 'barrier phrase', relation: 'phrase' },
      { words: ['PAPER', 'TRAIL', 'AUDIT', 'PROOF'], label: 'records path', relation: 'phrase' },
    ],
  },
  {
    id: 'wt-032',
    title: 'Ambiguous Animals',
    difficulty: 4,
    trails: [
      { words: ['CRANE', 'HOOK', 'LOAD', 'BUILDING'], label: 'machine crane', relation: 'process' },
      { words: ['HERON', 'WING', 'MIGRATION', 'MARSH'], label: 'wading bird', relation: 'association' },
      { words: ['SEAL', 'STAMP', 'DOCUMENT', 'OFFICIAL'], label: 'official seal', relation: 'process' },
      { words: ['FLIPPER', 'ICE', 'OCEAN', 'COLONY'], label: 'animal seal', relation: 'association' },
    ],
  },
  {
    id: 'wt-033',
    title: 'Art Studio',
    difficulty: 4,
    trails: [
      { words: ['SKETCH', 'CANVAS', 'PAINT', 'GALLERY'], label: 'painting path', relation: 'process' },
      { words: ['CLAY', 'WHEEL', 'KILN', 'VASE'], label: 'pottery process', relation: 'process' },
      { words: ['LENS', 'FOCUS', 'EXPOSURE', 'PRINT'], label: 'photography path', relation: 'process' },
      { words: ['MUSE', 'STYLE', 'SERIES', 'EXHIBIT'], label: 'artist development', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-034',
    title: 'Market Forces',
    difficulty: 4,
    trails: [
      { words: ['DEMAND', 'PRICE', 'SUPPLY', 'SHORTAGE'], label: 'scarcity loop', relation: 'cause' },
      { words: ['STARTUP', 'PITCH', 'INVESTOR', 'GROWTH'], label: 'funding path', relation: 'process' },
      { words: ['BRAND', 'AD', 'CUSTOMER', 'LOYALTY'], label: 'marketing path', relation: 'cause' },
      { words: ['RISK', 'INSURANCE', 'CLAIM', 'PAYOUT'], label: 'coverage path', relation: 'process' },
    ],
  },
  {
    id: 'wt-035',
    title: 'Hidden Infrastructure',
    difficulty: 4,
    trails: [
      { words: ['RAIN', 'GUTTER', 'DRAIN', 'SEWER'], label: 'stormwater path', relation: 'place' },
      { words: ['POWER', 'GRID', 'SUBSTATION', 'OUTLET'], label: 'electric delivery', relation: 'hierarchy' },
      { words: ['DATA', 'CABLE', 'ROUTER', 'DEVICE'], label: 'network delivery', relation: 'process' },
      { words: ['WASTE', 'TRUCK', 'SORTING', 'RECYCLE'], label: 'trash route', relation: 'process' },
    ],
  },
  {
    id: 'wt-036',
    title: 'Myth And Story',
    difficulty: 4,
    trails: [
      { words: ['PROPHECY', 'HERO', 'QUEST', 'RETURN'], label: 'hero arc', relation: 'story' },
      { words: ['DRAGON', 'TREASURE', 'THIEF', 'CURSE'], label: 'fantasy trouble', relation: 'story' },
      { words: ['SPELL', 'POTION', 'TRANSFORM', 'ESCAPE'], label: 'magic solution', relation: 'story' },
      { words: ['KING', 'CROWN', 'THRONE', 'KINGDOM'], label: 'royal symbols', relation: 'association' },
    ],
  },
  {
    id: 'wt-037',
    title: 'Language Path',
    difficulty: 4,
    trails: [
      { words: ['SOUND', 'SYLLABLE', 'WORD', 'SENTENCE'], label: 'language units', relation: 'hierarchy' },
      { words: ['ROOT', 'PREFIX', 'MEANING', 'VOCABULARY'], label: 'word building', relation: 'process' },
      { words: ['IDIOM', 'CONTEXT', 'INTERPRETATION', 'JOKE'], label: 'figurative language', relation: 'process' },
      { words: ['TRANSLATE', 'SUBTITLE', 'AUDIENCE', 'UNDERSTANDING'], label: 'translation result', relation: 'cause' },
    ],
  },
  {
    id: 'wt-038',
    title: 'Legal Loops',
    difficulty: 4,
    trails: [
      { words: ['LAW', 'POLICE', 'ARREST', 'CHARGE'], label: 'criminal start', relation: 'process' },
      { words: ['CONTRACT', 'SIGNATURE', 'BREACH', 'LAWSUIT'], label: 'contract dispute', relation: 'cause' },
      { words: ['PATENT', 'INVENTION', 'LICENSE', 'ROYALTY'], label: 'IP path', relation: 'process' },
      { words: ['JURY', 'DELIBERATION', 'VERDICT', 'APPEAL'], label: 'trial ending', relation: 'process' },
    ],
  },
  {
    id: 'wt-039',
    title: 'Body Systems',
    difficulty: 4,
    trails: [
      { words: ['LUNG', 'OXYGEN', 'BLOOD', 'MUSCLE'], label: 'oxygen delivery', relation: 'process' },
      { words: ['EYE', 'LIGHT', 'NERVE', 'BRAIN'], label: 'seeing path', relation: 'process' },
      { words: ['FOOD', 'STOMACH', 'ENERGY', 'MOVEMENT'], label: 'digestion payoff', relation: 'process' },
      { words: ['SKIN', 'CUT', 'CLOT', 'SCAR'], label: 'healing path', relation: 'process' },
    ],
  },
  {
    id: 'wt-040',
    title: 'Time Pieces',
    difficulty: 4,
    trails: [
      { words: ['SECOND', 'MINUTE', 'HOUR', 'DAY'], label: 'time units', relation: 'hierarchy' },
      { words: ['PAST', 'MEMORY', 'PHOTO', 'NOSTALGIA'], label: 'looking back', relation: 'association' },
      { words: ['PLAN', 'CALENDAR', 'APPOINTMENT', 'ARRIVAL'], label: 'scheduled time', relation: 'sequence' },
      { words: ['DELAY', 'WAIT', 'PATIENCE', 'RELIEF'], label: 'waiting arc', relation: 'story' },
    ],
  },
  {
    id: 'wt-041',
    title: 'Tight Turns',
    difficulty: 5,
    trails: [
      { words: ['PITCH', 'TONE', 'VOICE', 'CHOIR'], label: 'sound pitch', relation: 'hierarchy' },
      { words: ['TENT', 'CAMP', 'FIRE', 'STORY'], label: 'camp setup', relation: 'sequence' },
      { words: ['FOUNDER', 'INVESTOR', 'TERM', 'SHEET'], label: 'business pitch', relation: 'process' },
      { words: ['MOUND', 'BALL', 'SWING', 'STRIKE'], label: 'baseball pitch', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-042',
    title: 'Sharp Edges',
    difficulty: 5,
    trails: [
      { words: ['POINT', 'ARGUMENT', 'DEBATE', 'DECISION'], label: 'making a point', relation: 'process' },
      { words: ['PENCIL', 'LINE', 'DRAWING', 'SKETCH'], label: 'drawing point', relation: 'process' },
      { words: ['SCORE', 'LEAD', 'CLOCK', 'WIN'], label: 'game point', relation: 'cause' },
      { words: ['COMPASS', 'NORTH', 'MAP', 'ROUTE'], label: 'direction point', relation: 'association' },
    ],
  },
  {
    id: 'wt-043',
    title: 'Cold Chain',
    difficulty: 5,
    trails: [
      { words: ['FREEZER', 'ICE', 'COOLER', 'PICNIC'], label: 'keeping cold', relation: 'process' },
      { words: ['FROST', 'WINDOW', 'SUN', 'MELT'], label: 'morning thaw', relation: 'cause' },
      { words: ['SNOW', 'SLOPE', 'SKI', 'LODGE'], label: 'ski day', relation: 'sequence' },
      { words: ['CHILL', 'FEVER', 'BLANKET', 'REST'], label: 'sick day', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-044',
    title: 'Signal Noise',
    difficulty: 5,
    trails: [
      { words: ['RADIO', 'WAVE', 'ANTENNA', 'BROADCAST'], label: 'radio signal', relation: 'process' },
      { words: ['HAND', 'HELLO', 'SMILE', 'FRIEND'], label: 'greeting wave', relation: 'sequence' },
      { words: ['OCEAN', 'BOARD', 'SURFER', 'BEACH'], label: 'surf wave', relation: 'association' },
      { words: ['CROWD', 'STADIUM', 'CHEER', 'CHANT'], label: 'stadium wave', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-045',
    title: 'Paper Cuts',
    difficulty: 5,
    trails: [
      { words: ['PAPER', 'SCISSORS', 'ROCK', 'GAME'], label: 'playground game', relation: 'phrase' },
      { words: ['INK', 'PRESS', 'NEWSPAPER', 'HEADLINE'], label: 'printing path', relation: 'process' },
      { words: ['FOLD', 'CRANE', 'ORIGAMI', 'DISPLAY'], label: 'folded art', relation: 'process' },
      { words: ['THESIS', 'DEFENSE', 'DEGREE', 'GRADUATION'], label: 'academic paper', relation: 'process' },
    ],
  },
  {
    id: 'wt-046',
    title: 'Line Readings',
    difficulty: 5,
    trails: [
      { words: ['LINE', 'QUEUE', 'TICKET', 'ENTRY'], label: 'waiting line', relation: 'sequence' },
      { words: ['SCRIPT', 'ACTOR', 'DELIVERY', 'LAUGH'], label: 'spoken line', relation: 'process' },
      { words: ['HOOK', 'FISH', 'DINNER', 'PLATE'], label: 'fishing line', relation: 'sequence' },
      { words: ['GRAPH', 'TREND', 'FORECAST', 'REPORT'], label: 'chart line', relation: 'process' },
    ],
  },
  {
    id: 'wt-047',
    title: 'Light Work',
    difficulty: 5,
    trails: [
      { words: ['LIGHT', 'BULB', 'IDEA', 'INVENTION'], label: 'bright idea', relation: 'phrase' },
      { words: ['PRISM', 'RAINBOW', 'COLOR', 'SPECTRUM'], label: 'split light', relation: 'process' },
      { words: ['CAMERA', 'ACTION', 'SCENE', 'TAKE'], label: 'film cue', relation: 'phrase' },
      { words: ['FEATHER', 'WEIGHT', 'SCALE', 'GRAM'], label: 'not heavy', relation: 'association' },
    ],
  },
  {
    id: 'wt-048',
    title: 'Key Problems',
    difficulty: 5,
    trails: [
      { words: ['KEY', 'LOCK', 'SAFE', 'SECRET'], label: 'security key', relation: 'process' },
      { words: ['PIANO', 'CHORD', 'SONG', 'CONCERT'], label: 'music key', relation: 'association' },
      { words: ['MAP', 'SYMBOL', 'LEGEND', 'ROUTE'], label: 'map key', relation: 'hierarchy' },
      { words: ['ANSWER', 'TEST', 'GRADE', 'REPORT'], label: 'answer key', relation: 'phrase' },
    ],
  },
  {
    id: 'wt-049',
    title: 'Change Paths',
    difficulty: 5,
    trails: [
      { words: ['CHANGE', 'COIN', 'REGISTER', 'DRAWER'], label: 'cash change', relation: 'sequence' },
      { words: ['PLAN', 'PIVOT', 'RISK', 'SUCCESS'], label: 'strategy change', relation: 'process' },
      { words: ['SEASON', 'LEAVES', 'FALL', 'RAKE'], label: 'seasonal change', relation: 'cause' },
      { words: ['DIAPER', 'BABY', 'CRIB', 'NAP'], label: 'care routine', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-050',
    title: 'Final Mix',
    difficulty: 5,
    trails: [
      { words: ['ROOT', 'WORD', 'MEANING', 'DICTIONARY'], label: 'language root', relation: 'hierarchy' },
      { words: ['TOOTH', 'CANAL', 'DENTIST', 'FILLING'], label: 'dental root', relation: 'association' },
      { words: ['TEAM', 'CHEER', 'VICTORY', 'PARADE'], label: 'root for a team', relation: 'phrase' },
      { words: ['TREE', 'SHADE', 'BLANKET', 'PICNIC'], label: 'tree root', relation: 'association' },
    ],
  },

  // ── Batch 2 (wt-051 … wt-062): authored to the design framework ──────────────
  // 4 distinct domains per puzzle; difficulty from ordering, not grouping.
  // Level 3+ include deliberate cross-path bait words (see docs).
  {
    id: 'wt-051', title: 'First Light', difficulty: 1,
    trails: [
      { words: ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'], label: 'plant grows', relation: 'growth' },
      { words: ['DAWN', 'NOON', 'DUSK', 'NIGHT'], label: 'day passes', relation: 'sequence' },
      { words: ['FLOUR', 'DOUGH', 'OVEN', 'BREAD'], label: 'baking', relation: 'process' },
      { words: ['CLOUD', 'RAIN', 'RIVER', 'SEA'], label: 'water cycle', relation: 'process' },
    ],
  },
  {
    id: 'wt-052', title: 'Building Blocks', difficulty: 1,
    trails: [
      { words: ['BRICK', 'WALL', 'HOUSE', 'STREET'], label: 'builds up', relation: 'growth' },
      { words: ['BEAN', 'GRIND', 'BREW', 'CUP'], label: 'making coffee', relation: 'process' },
      { words: ['EGG', 'LARVA', 'COCOON', 'BUTTERFLY'], label: 'metamorphosis', relation: 'growth' },
      { words: ['WRITE', 'STAMP', 'POST', 'DELIVER'], label: 'sending mail', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-053', title: 'Running Hot', difficulty: 2,
    trails: [
      { words: ['SYMPTOM', 'DOCTOR', 'TEST', 'DIAGNOSIS'], label: 'getting diagnosed', relation: 'process' },
      { words: ['WATER', 'BOIL', 'PASTA', 'DRAIN'], label: 'cooking pasta', relation: 'sequence' },
      { words: ['BREEZE', 'WIND', 'GALE', 'HURRICANE'], label: 'wind builds', relation: 'growth' },
      { words: ['SCRIPT', 'FILMING', 'EDIT', 'PREMIERE'], label: 'making a film', relation: 'process' },
    ],
  },
  {
    id: 'wt-054', title: 'Slow Burn', difficulty: 2,
    trails: [
      { words: ['ACORN', 'SAPLING', 'OAK', 'FOREST'], label: 'tree grows', relation: 'growth' },
      { words: ['SPARK', 'FLAME', 'BLAZE', 'ASH'], label: 'fire burns out', relation: 'sequence' },
      { words: ['START', 'SPRINT', 'FINISH', 'MEDAL'], label: 'running a race', relation: 'sequence' },
      { words: ['SLICE', 'TOASTER', 'TOAST', 'BUTTER'], label: 'making toast', relation: 'process' },
    ],
  },
  {
    id: 'wt-055', title: 'Catching Fire', difficulty: 3,
    trails: [
      { words: ['IDEA', 'SPARK', 'INVENTION', 'PATENT'], label: 'a bright idea', relation: 'process' },
      { words: ['GLANCE', 'FLAME', 'KISS', 'WEDDING'], label: 'falling in love', relation: 'story' },
      { words: ['LOG', 'EMBER', 'SMOKE', 'ASH'], label: 'campfire dies', relation: 'sequence' },
      { words: ['SPAT', 'ROW', 'FIGHT', 'BREAKUP'], label: 'argument escalates', relation: 'growth' },
    ],
  },
  {
    id: 'wt-056', title: 'Order in the Court', difficulty: 3,
    trails: [
      { words: ['SERVE', 'RALLY', 'MATCH', 'TROPHY'], label: 'tennis', relation: 'sequence' },
      { words: ['ARREST', 'COURT', 'VERDICT', 'SENTENCE'], label: 'the law', relation: 'process' },
      { words: ['WORD', 'PHRASE', 'CLAUSE', 'PARAGRAPH'], label: 'building a text', relation: 'hierarchy' },
      { words: ['NOTE', 'CHORD', 'MELODY', 'SONG'], label: 'building music', relation: 'hierarchy' },
    ],
  },
  {
    id: 'wt-057', title: 'Going Once', difficulty: 4,
    trails: [
      { words: ['DEMAND', 'PRICE', 'SUPPLY', 'SHORTAGE'], label: 'market forces', relation: 'cause' },
      { words: ['OFFER', 'COUNTER', 'DEAL', 'HANDSHAKE'], label: 'negotiation', relation: 'sequence' },
      { words: ['ANTE', 'BET', 'RAISE', 'SHOWDOWN'], label: 'poker round', relation: 'sequence' },
      { words: ['LOT', 'BID', 'GAVEL', 'SOLD'], label: 'auction', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-058', title: 'Rap Sheet', difficulty: 4,
    trails: [
      { words: ['CLUE', 'SUSPECT', 'MOTIVE', 'ARREST'], label: 'the investigation', relation: 'process' },
      { words: ['PLAN', 'CREW', 'VAULT', 'ESCAPE'], label: 'the heist', relation: 'sequence' },
      { words: ['CHARGE', 'EVIDENCE', 'JURY', 'VERDICT'], label: 'the trial', relation: 'process' },
      { words: ['CELL', 'GUARD', 'YARD', 'PAROLE'], label: 'doing time', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-059', title: 'Pressure Cooker', difficulty: 2,
    trails: [
      { words: ['MAGMA', 'ERUPTION', 'LAVA', 'ROCK'], label: 'volcano', relation: 'process' },
      { words: ['CAMERA', 'SNAP', 'DEVELOP', 'PRINT'], label: 'taking a photo', relation: 'process' },
      { words: ['GRAPE', 'CRUSH', 'FERMENT', 'WINE'], label: 'making wine', relation: 'process' },
      { words: ['YAWN', 'PILLOW', 'DREAM', 'WAKE'], label: 'a good sleep', relation: 'sequence' },
    ],
  },
  {
    id: 'wt-060', title: 'Ringside', difficulty: 3,
    trails: [
      { words: ['BELL', 'JAB', 'KNOCKOUT', 'CHAMPION'], label: 'boxing match', relation: 'sequence' },
      { words: ['PROPOSAL', 'RING', 'VOWS', 'HONEYMOON'], label: 'getting married', relation: 'sequence' },
      { words: ['DIAL', 'RINGTONE', 'ANSWER', 'HANGUP'], label: 'a phone call', relation: 'sequence' },
      { words: ['TENT', 'CLOWN', 'TRAPEZE', 'APPLAUSE'], label: 'at the circus', relation: 'place' },
    ],
  },
  {
    id: 'wt-061', title: 'Balancing Act', difficulty: 3,
    trails: [
      { words: ['DEPOSIT', 'BALANCE', 'INTEREST', 'SAVINGS'], label: 'a bank account', relation: 'process' },
      { words: ['VAULT', 'BEAM', 'ROUTINE', 'SCORE'], label: 'gymnastics', relation: 'sequence' },
      { words: ['TRAIL', 'SUMMIT', 'VIEW', 'DESCENT'], label: 'a hike', relation: 'sequence' },
      { words: ['CHAPTER', 'PLOT', 'CLIMAX', 'ENDING'], label: 'a story', relation: 'story' },
    ],
  },
  {
    id: 'wt-062', title: 'Ship It', difficulty: 4,
    trails: [
      { words: ['CODE', 'COMPILE', 'DEBUG', 'DEPLOY'], label: 'shipping software', relation: 'process' },
      { words: ['CIPHER', 'AGENT', 'MISSION', 'EXTRACT'], label: 'a spy op', relation: 'sequence' },
      { words: ['TRACK', 'MIX', 'MASTER', 'RELEASE'], label: 'producing a song', relation: 'process' },
      { words: ['COUNTDOWN', 'LAUNCH', 'ORBIT', 'SPLASHDOWN'], label: 'a space mission', relation: 'sequence' },
    ],
  },
];
