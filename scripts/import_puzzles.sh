#!/usr/bin/env bash
# Import 50 curated puzzles into PocketBase.
# Run after docker is up: bash scripts/import_puzzles.sh

PB_URL="${POCKETBASE_URL:-http://localhost:8092}"
EMAIL="${POCKETBASE_ADMIN_EMAIL:-simontgn@gmail.com}"
PASS="${POCKETBASE_ADMIN_PASSWORD:-TestPassword123}"

echo "Authenticating..."
TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Auth failed. Is Docker running? (sudo DOCKER_CONFIG=/DATA/.docker docker compose up -d)"
  exit 1
fi
echo "Authenticated."

post_puzzle() {
  local json="$1"
  local num="$2"
  RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PB_URL/api/collections/puzzles/records" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d "$json")
  if [ "$RESULT" = "200" ] || [ "$RESULT" = "201" ]; then
    echo "✓ Puzzle $num created"
  else
    echo "✗ Puzzle $num failed (HTTP $RESULT)"
  fi
}

# ── PUZZLES ────────────────────────────────────────────────────────────────────

post_puzzle '{
  "words":["SALMON","BASS","TROUT","PIKE","REED","FLUTE","OBOE","CLARINET","SPRING","SUMMER","FALL","WINTER","CRANE","HERON","STORK","IBIS"],
  "categories":[
    {"name":"Freshwater fish","colour":"yellow","words":["SALMON","BASS","TROUT","PIKE"]},
    {"name":"Woodwind instruments","colour":"green","words":["FLUTE","OBOE","CLARINET","REED"]},
    {"name":"Seasons","colour":"blue","words":["SPRING","SUMMER","FALL","WINTER"]},
    {"name":"Wading birds","colour":"purple","words":["CRANE","HERON","STORK","IBIS"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 1

post_puzzle '{
  "words":["ECHO","SIERRA","TANGO","INDIA","BARK","HOWL","GROWL","WHIMPER","MAPLE","OAK","PINE","BIRCH","SPRINT","HURDLE","JAVELIN","DISCUS"],
  "categories":[
    {"name":"NATO alphabet","colour":"yellow","words":["ECHO","SIERRA","TANGO","INDIA"]},
    {"name":"Dog sounds","colour":"green","words":["BARK","HOWL","GROWL","WHIMPER"]},
    {"name":"Deciduous trees","colour":"blue","words":["MAPLE","OAK","PINE","BIRCH"]},
    {"name":"Track & field events","colour":"purple","words":["SPRINT","HURDLE","JAVELIN","DISCUS"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 2

post_puzzle '{
  "words":["MARS","VENUS","SATURN","NEPTUNE","WALTZ","TANGO","FOXTROT","RUMBA","COPPER","IRON","TIN","LEAD","STRIKE","SPARE","FRAME","GUTTER"],
  "categories":[
    {"name":"Planets","colour":"yellow","words":["MARS","VENUS","SATURN","NEPTUNE"]},
    {"name":"Ballroom dances","colour":"green","words":["WALTZ","TANGO","FOXTROT","RUMBA"]},
    {"name":"Metals","colour":"blue","words":["COPPER","IRON","TIN","LEAD"]},
    {"name":"Bowling terms","colour":"purple","words":["STRIKE","SPARE","FRAME","GUTTER"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 3

post_puzzle '{
  "words":["LEMON","LIME","ORANGE","GRAPEFRUIT","BISHOP","ROOK","PAWN","KNIGHT","BERET","FEDORA","BOWLER","STETSON","DELTA","OMEGA","GAMMA","SIGMA"],
  "categories":[
    {"name":"Citrus fruits","colour":"yellow","words":["LEMON","LIME","ORANGE","GRAPEFRUIT"]},
    {"name":"Chess pieces","colour":"green","words":["BISHOP","ROOK","PAWN","KNIGHT"]},
    {"name":"Types of hat","colour":"blue","words":["BERET","FEDORA","BOWLER","STETSON"]},
    {"name":"Greek letters","colour":"purple","words":["DELTA","OMEGA","GAMMA","SIGMA"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 4

post_puzzle '{
  "words":["COBRA","MAMBA","VIPER","ADDER","JAZZ","BLUES","FUNK","SOUL","CLIFF","RIDGE","PLATEAU","MESA","ANCHOR","CABLE","MAST","BOOM"],
  "categories":[
    {"name":"Venomous snakes","colour":"yellow","words":["COBRA","MAMBA","VIPER","ADDER"]},
    {"name":"Music genres","colour":"green","words":["JAZZ","BLUES","FUNK","SOUL"]},
    {"name":"Landforms","colour":"blue","words":["CLIFF","RIDGE","PLATEAU","MESA"]},
    {"name":"Parts of a sailing boat","colour":"purple","words":["ANCHOR","CABLE","MAST","BOOM"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 5

post_puzzle '{
  "words":["CHEDDAR","BRIE","GOUDA","EDAM","BRONZE","SILVER","GOLD","PLATINUM","COMPASS","RULER","PROTRACTOR","SQUARE","BLIZZARD","SLEET","HAIL","FROST"],
  "categories":[
    {"name":"Cheeses","colour":"yellow","words":["CHEDDAR","BRIE","GOUDA","EDAM"]},
    {"name":"Precious metals / awards","colour":"green","words":["BRONZE","SILVER","GOLD","PLATINUM"]},
    {"name":"Geometry tools","colour":"blue","words":["COMPASS","RULER","PROTRACTOR","SQUARE"]},
    {"name":"Wintry weather","colour":"purple","words":["BLIZZARD","SLEET","HAIL","FROST"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 6

post_puzzle '{
  "words":["TULIP","ROSE","DAISY","IRIS","PENGUIN","SEAL","WALRUS","OTTER","ALTO","TENOR","SOPRANO","BASS","PARROT","TOUCAN","MACAW","COCKATOO"],
  "categories":[
    {"name":"Flowers","colour":"yellow","words":["TULIP","ROSE","DAISY","IRIS"]},
    {"name":"Marine mammals","colour":"green","words":["PENGUIN","SEAL","WALRUS","OTTER"]},
    {"name":"Singing voice types","colour":"blue","words":["ALTO","TENOR","SOPRANO","BASS"]},
    {"name":"Tropical birds","colour":"purple","words":["PARROT","TOUCAN","MACAW","COCKATOO"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 7

post_puzzle '{
  "words":["DIAMOND","SPADE","CLUB","HEART","NILE","AMAZON","GANGES","YANGTZE","HAIKU","SONNET","LIMERICK","ODE","ORBIT","ROTATION","AXIS","TILT"],
  "categories":[
    {"name":"Card suits","colour":"yellow","words":["DIAMOND","SPADE","CLUB","HEART"]},
    {"name":"Major rivers","colour":"green","words":["NILE","AMAZON","GANGES","YANGTZE"]},
    {"name":"Poem types","colour":"blue","words":["HAIKU","SONNET","LIMERICK","ODE"]},
    {"name":"Earth movements","colour":"purple","words":["ORBIT","ROTATION","AXIS","TILT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 8

post_puzzle '{
  "words":["SCARLET","CRIMSON","MAROON","BURGUNDY","KANGAROO","KOALA","WOMBAT","ECHIDNA","ANVIL","STIRRUP","HAMMER","DRUM","TENOR","TUBA","PICCOLO","BANJO"],
  "categories":[
    {"name":"Shades of red","colour":"yellow","words":["SCARLET","CRIMSON","MAROON","BURGUNDY"]},
    {"name":"Australian animals","colour":"green","words":["KANGAROO","KOALA","WOMBAT","ECHIDNA"]},
    {"name":"Bones of the ear","colour":"blue","words":["ANVIL","STIRRUP","HAMMER","DRUM"]},
    {"name":"Musical instruments","colour":"purple","words":["TENOR","TUBA","PICCOLO","BANJO"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 9

post_puzzle '{
  "words":["CROISSANT","BAGUETTE","BRIOCHE","ECLAIR","CRICKET","RUGBY","POLO","SQUASH","AMBER","JADE","PEARL","CORAL","TYPHOON","CYCLONE","TORNADO","MONSOON"],
  "categories":[
    {"name":"French baked goods","colour":"yellow","words":["CROISSANT","BAGUETTE","BRIOCHE","ECLAIR"]},
    {"name":"Sports played with a ball","colour":"green","words":["CRICKET","RUGBY","POLO","SQUASH"]},
    {"name":"Gemstones / organic gems","colour":"blue","words":["AMBER","JADE","PEARL","CORAL"]},
    {"name":"Tropical storms","colour":"purple","words":["TYPHOON","CYCLONE","TORNADO","MONSOON"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 10

post_puzzle '{
  "words":["HAWK","FALCON","KITE","OSPREY","TREBLE","CLEF","STAVE","QUAVER","SEDAN","COUPE","HATCHBACK","CONVERTIBLE","JADE","EMERALD","MALACHITE","PERIDOT"],
  "categories":[
    {"name":"Birds of prey","colour":"yellow","words":["HAWK","FALCON","KITE","OSPREY"]},
    {"name":"Music notation terms","colour":"green","words":["TREBLE","CLEF","STAVE","QUAVER"]},
    {"name":"Car body styles","colour":"blue","words":["SEDAN","COUPE","HATCHBACK","CONVERTIBLE"]},
    {"name":"Green gemstones","colour":"purple","words":["JADE","EMERALD","MALACHITE","PERIDOT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 11

post_puzzle '{
  "words":["SAFFRON","PAPRIKA","TURMERIC","CUMIN","ATLANTIC","PACIFIC","ARCTIC","INDIAN","FOYER","LOBBY","VESTIBULE","ATRIUM","CANTER","TROT","GALLOP","WALK"],
  "categories":[
    {"name":"Spices","colour":"yellow","words":["SAFFRON","PAPRIKA","TURMERIC","CUMIN"]},
    {"name":"Oceans","colour":"green","words":["ATLANTIC","PACIFIC","ARCTIC","INDIAN"]},
    {"name":"Entrance areas","colour":"blue","words":["FOYER","LOBBY","VESTIBULE","ATRIUM"]},
    {"name":"Horse gaits","colour":"purple","words":["CANTER","TROT","GALLOP","WALK"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 12

post_puzzle '{
  "words":["MERLOT","RIESLING","MALBEC","PINOT","DAGGER","RAPIER","SABRE","CUTLASS","KINDLE","NOOK","KOBO","VERSO","LUNAR","SOLAR","PARTIAL","ANNULAR"],
  "categories":[
    {"name":"Wine grape varieties","colour":"yellow","words":["MERLOT","RIESLING","MALBEC","PINOT"]},
    {"name":"Bladed weapons","colour":"green","words":["DAGGER","RAPIER","SABRE","CUTLASS"]},
    {"name":"E-readers","colour":"blue","words":["KINDLE","NOOK","KOBO","VERSO"]},
    {"name":"Types of eclipse","colour":"purple","words":["LUNAR","SOLAR","PARTIAL","ANNULAR"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 13

post_puzzle '{
  "words":["DENIM","LINEN","VELVET","SATIN","TROMBONE","TRUMPET","TUBA","HORN","SAHARA","GOBI","MOJAVE","ATACAMA","BISHOP","DEACON","VICAR","CURATE"],
  "categories":[
    {"name":"Fabrics","colour":"yellow","words":["DENIM","LINEN","VELVET","SATIN"]},
    {"name":"Brass instruments","colour":"green","words":["TROMBONE","TRUMPET","TUBA","HORN"]},
    {"name":"Deserts","colour":"blue","words":["SAHARA","GOBI","MOJAVE","ATACAMA"]},
    {"name":"Church roles","colour":"purple","words":["BISHOP","DEACON","VICAR","CURATE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 14

post_puzzle '{
  "words":["PAPAYA","GUAVA","LYCHEE","MANGO","REEF","LAGOON","ATOLL","SHOAL","DELTA","LAMBDA","EPSILON","KAPPA","CORAL","TURQUOISE","TEAL","CYAN"],
  "categories":[
    {"name":"Tropical fruits","colour":"yellow","words":["PAPAYA","GUAVA","LYCHEE","MANGO"]},
    {"name":"Coastal features","colour":"green","words":["REEF","LAGOON","ATOLL","SHOAL"]},
    {"name":"Greek letters","colour":"blue","words":["DELTA","LAMBDA","EPSILON","KAPPA"]},
    {"name":"Shades of blue-green","colour":"purple","words":["CORAL","TURQUOISE","TEAL","CYAN"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 15

post_puzzle '{
  "words":["BAYOU","DELTA","ESTUARY","TRIBUTARY","VIOLIN","VIOLA","CELLO","HARP","RUBY","GARNET","SPINEL","CARNELIAN","ECLIPSE","COMET","METEOR","ASTEROID"],
  "categories":[
    {"name":"River features","colour":"yellow","words":["BAYOU","DELTA","ESTUARY","TRIBUTARY"]},
    {"name":"String instruments","colour":"green","words":["VIOLIN","VIOLA","CELLO","HARP"]},
    {"name":"Red gemstones","colour":"blue","words":["RUBY","GARNET","SPINEL","CARNELIAN"]},
    {"name":"Space objects","colour":"purple","words":["ECLIPSE","COMET","METEOR","ASTEROID"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 16

post_puzzle '{
  "words":["OREGANO","BASIL","THYME","ROSEMARY","CANOE","KAYAK","PUNT","DINGHY","PRISM","LENS","MIRROR","FILTER","BUNKER","BIRDIE","BOGEY","EAGLE"],
  "categories":[
    {"name":"Herbs","colour":"yellow","words":["OREGANO","BASIL","THYME","ROSEMARY"]},
    {"name":"Small boats","colour":"green","words":["CANOE","KAYAK","PUNT","DINGHY"]},
    {"name":"Optics equipment","colour":"blue","words":["PRISM","LENS","MIRROR","FILTER"]},
    {"name":"Golf scoring terms","colour":"purple","words":["BUNKER","BIRDIE","BOGEY","EAGLE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 17

post_puzzle '{
  "words":["TABBY","SIAMESE","PERSIAN","BENGAL","SUSHI","RAMEN","UDON","TEMPURA","OBSIDIAN","BASALT","PUMICE","GRANITE","CROCHET","KNIT","WEAVE","EMBROIDER"],
  "categories":[
    {"name":"Cat breeds","colour":"yellow","words":["TABBY","SIAMESE","PERSIAN","BENGAL"]},
    {"name":"Japanese foods","colour":"green","words":["SUSHI","RAMEN","UDON","TEMPURA"]},
    {"name":"Volcanic rocks","colour":"blue","words":["OBSIDIAN","BASALT","PUMICE","GRANITE"]},
    {"name":"Textile crafts","colour":"purple","words":["CROCHET","KNIT","WEAVE","EMBROIDER"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 18

post_puzzle '{
  "words":["PARLIAMENT","CONGRESS","SENATE","DIET","POODLE","BEAGLE","SPANIEL","RETRIEVER","OZONE","CARBON","METHANE","NITROGEN","SOCKET","PLUG","FUSE","RELAY"],
  "categories":[
    {"name":"Legislative bodies","colour":"yellow","words":["PARLIAMENT","CONGRESS","SENATE","DIET"]},
    {"name":"Dog breeds","colour":"green","words":["POODLE","BEAGLE","SPANIEL","RETRIEVER"]},
    {"name":"Atmospheric gases","colour":"blue","words":["OZONE","CARBON","METHANE","NITROGEN"]},
    {"name":"Electrical components","colour":"purple","words":["SOCKET","PLUG","FUSE","RELAY"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 19

post_puzzle '{
  "words":["PIRANHA","BARRACUDA","MORAY","STINGRAY","CELLO","PIANO","HARP","ORGAN","HEIST","CAPER","STING","JOB","JADE","OBSIDIAN","ONYX","JET"],
  "categories":[
    {"name":"Dangerous sea creatures","colour":"yellow","words":["PIRANHA","BARRACUDA","MORAY","STINGRAY"]},
    {"name":"Large instruments","colour":"green","words":["CELLO","PIANO","HARP","ORGAN"]},
    {"name":"Slang for a crime plan","colour":"blue","words":["HEIST","CAPER","STING","JOB"]},
    {"name":"Black gemstones","colour":"purple","words":["JADE","OBSIDIAN","ONYX","JET"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 20

post_puzzle '{
  "words":["LEVER","PULLEY","WEDGE","SCREW","BONSAI","IKEBANA","ORIGAMI","CALLIGRAPHY","FJORD","GLACIER","TUNDRA","PERMAFROST","CODA","OVERTURE","INTERLUDE","PRELUDE"],
  "categories":[
    {"name":"Simple machines","colour":"yellow","words":["LEVER","PULLEY","WEDGE","SCREW"]},
    {"name":"Japanese art forms","colour":"green","words":["BONSAI","IKEBANA","ORIGAMI","CALLIGRAPHY"]},
    {"name":"Arctic landscape features","colour":"blue","words":["FJORD","GLACIER","TUNDRA","PERMAFROST"]},
    {"name":"Musical structure terms","colour":"purple","words":["CODA","OVERTURE","INTERLUDE","PRELUDE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 21

post_puzzle '{
  "words":["ACORN","CONKER","WALNUT","HAZELNUT","BALLET","OPERA","MIME","CABARET","COMPASS","SEXTANT","ASTROLABE","GNOMON","SILT","CLAY","LOAM","PEAT"],
  "categories":[
    {"name":"Tree nuts","colour":"yellow","words":["ACORN","CONKER","WALNUT","HAZELNUT"]},
    {"name":"Performance art forms","colour":"green","words":["BALLET","OPERA","MIME","CABARET"]},
    {"name":"Navigation instruments","colour":"blue","words":["COMPASS","SEXTANT","ASTROLABE","GNOMON"]},
    {"name":"Soil types","colour":"purple","words":["SILT","CLAY","LOAM","PEAT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 22

post_puzzle '{
  "words":["SPRINT","MARATHON","RELAY","STEEPLECHASE","AMBER","IVORY","EBONY","MAHOGANY","EPOCH","ERA","EON","AGE","MOLAR","INCISOR","CANINE","WISDOM"],
  "categories":[
    {"name":"Running events","colour":"yellow","words":["SPRINT","MARATHON","RELAY","STEEPLECHASE"]},
    {"name":"Wood types used as colour names","colour":"green","words":["AMBER","IVORY","EBONY","MAHOGANY"]},
    {"name":"Geological time units","colour":"blue","words":["EPOCH","ERA","EON","AGE"]},
    {"name":"Tooth types","colour":"purple","words":["MOLAR","INCISOR","CANINE","WISDOM"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 23

post_puzzle '{
  "words":["TALON","CLAW","FANG","TUSK","FLAMENCO","SALSA","MERENGUE","BACHATA","STALACTITE","STALAGMITE","CAVE","CAVERN","GLITCH","BUG","CRASH","PATCH"],
  "categories":[
    {"name":"Animal weapons","colour":"yellow","words":["TALON","CLAW","FANG","TUSK"]},
    {"name":"Latin dances","colour":"green","words":["FLAMENCO","SALSA","MERENGUE","BACHATA"]},
    {"name":"Cave features","colour":"blue","words":["STALACTITE","STALAGMITE","CAVE","CAVERN"]},
    {"name":"Software problem terms","colour":"purple","words":["GLITCH","BUG","CRASH","PATCH"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 24

post_puzzle '{
  "words":["OTTOMAN","DIVAN","CHAISE","FUTON","CORONA","ECLIPSE","PROMINENCE","FLARE","LAVA","MAGMA","TEPHRA","CALDERA","SERIF","SANS","ITALIC","BOLD"],
  "categories":[
    {"name":"Types of sofa","colour":"yellow","words":["OTTOMAN","DIVAN","CHAISE","FUTON"]},
    {"name":"Solar phenomena","colour":"green","words":["CORONA","ECLIPSE","PROMINENCE","FLARE"]},
    {"name":"Volcanic terms","colour":"blue","words":["LAVA","MAGMA","TEPHRA","CALDERA"]},
    {"name":"Font styles","colour":"purple","words":["SERIF","SANS","ITALIC","BOLD"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 25

post_puzzle '{
  "words":["POPLAR","WILLOW","CYPRESS","SEQUOIA","SCALPEL","FORCEPS","CLAMP","RETRACTOR","REEF","GRANNY","BOWLINE","CLEAT","AZURE","COBALT","SAPPHIRE","INDIGO"],
  "categories":[
    {"name":"Tall trees","colour":"yellow","words":["POPLAR","WILLOW","CYPRESS","SEQUOIA"]},
    {"name":"Surgical tools","colour":"green","words":["SCALPEL","FORCEPS","CLAMP","RETRACTOR"]},
    {"name":"Nautical knots","colour":"blue","words":["REEF","GRANNY","BOWLINE","CLEAT"]},
    {"name":"Shades of blue","colour":"purple","words":["AZURE","COBALT","SAPPHIRE","INDIGO"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 26

post_puzzle '{
  "words":["GECKO","IGUANA","CHAMELEON","SKINK","BASSOON","OBOE","RECORDER","BAGPIPE","TRENCH","CANYON","GORGE","ABYSS","KERNEL","BYTE","PIXEL","TOKEN"],
  "categories":[
    {"name":"Lizard types","colour":"yellow","words":["GECKO","IGUANA","CHAMELEON","SKINK"]},
    {"name":"Double-reed or wind instruments","colour":"green","words":["BASSOON","OBOE","RECORDER","BAGPIPE"]},
    {"name":"Deep geographical features","colour":"blue","words":["TRENCH","CANYON","GORGE","ABYSS"]},
    {"name":"Computing units","colour":"purple","words":["KERNEL","BYTE","PIXEL","TOKEN"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 27

post_puzzle '{
  "words":["BRINE","PICKLE","FERMENT","CURE","LUTE","MANDOLIN","ZITHER","DULCIMER","PLATEAU","MESA","BUTTE","MOUND","QUARTZ","FELDSPAR","MICA","CALCITE"],
  "categories":[
    {"name":"Food preservation methods","colour":"yellow","words":["BRINE","PICKLE","FERMENT","CURE"]},
    {"name":"Plucked string instruments","colour":"green","words":["LUTE","MANDOLIN","ZITHER","DULCIMER"]},
    {"name":"Flat-topped landforms","colour":"blue","words":["PLATEAU","MESA","BUTTE","MOUND"]},
    {"name":"Rock-forming minerals","colour":"purple","words":["QUARTZ","FELDSPAR","MICA","CALCITE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 28

post_puzzle '{
  "words":["DUSK","DAWN","TWILIGHT","GLOAMING","BASSLINE","RIFF","LICK","GROOVE","TIDAL","ROGUE","RIPPLE","SURGE","CIPHER","CODE","HASH","SALT"],
  "categories":[
    {"name":"Times of day near sunset/sunrise","colour":"yellow","words":["DUSK","DAWN","TWILIGHT","GLOAMING"]},
    {"name":"Guitar playing terms","colour":"green","words":["BASSLINE","RIFF","LICK","GROOVE"]},
    {"name":"Types of wave","colour":"blue","words":["TIDAL","ROGUE","RIPPLE","SURGE"]},
    {"name":"Cryptography terms","colour":"purple","words":["CIPHER","CODE","HASH","SALT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 29

post_puzzle '{
  "words":["LABRADOR","DALMATIAN","MASTIFF","GREYHOUND","ALLEGRO","PRESTO","ADAGIO","LARGO","ANVIL","BELLOWS","TONGS","QUENCH","MINT","BASIL","SAGE","BAY"],
  "categories":[
    {"name":"Large dog breeds","colour":"yellow","words":["LABRADOR","DALMATIAN","MASTIFF","GREYHOUND"]},
    {"name":"Musical tempos","colour":"green","words":["ALLEGRO","PRESTO","ADAGIO","LARGO"]},
    {"name":"Blacksmith tools and actions","colour":"blue","words":["ANVIL","BELLOWS","TONGS","QUENCH"]},
    {"name":"Culinary herbs also used as names","colour":"purple","words":["MINT","BASIL","SAGE","BAY"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 30

post_puzzle '{
  "words":["LYMPH","PLASMA","SERUM","MARROW","FRESCO","MOSAIC","MURAL","TAPESTRY","HATCH","CROSSHATCH","STIPPLE","SCUMBLE","VOLT","AMP","OHM","WATT"],
  "categories":[
    {"name":"Components of blood / body fluids","colour":"yellow","words":["LYMPH","PLASMA","SERUM","MARROW"]},
    {"name":"Art techniques using surfaces","colour":"green","words":["FRESCO","MOSAIC","MURAL","TAPESTRY"]},
    {"name":"Drawing shading techniques","colour":"blue","words":["HATCH","CROSSHATCH","STIPPLE","SCUMBLE"]},
    {"name":"Electrical units","colour":"purple","words":["VOLT","AMP","OHM","WATT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 31

post_puzzle '{
  "words":["BAYONET","HALBERD","LANCE","PIKE","SAMBA","BOSSA","CAPOEIRA","FORRÓ","LICHEN","MOSS","ALGAE","FERN","EPOCH","NODE","BRANCH","FORK"],
  "categories":[
    {"name":"Pole weapons","colour":"yellow","words":["BAYONET","HALBERD","LANCE","PIKE"]},
    {"name":"Brazilian music or dance styles","colour":"green","words":["SAMBA","BOSSA","CAPOEIRA","FORRÓ"]},
    {"name":"Primitive plants","colour":"blue","words":["LICHEN","MOSS","ALGAE","FERN"]},
    {"name":"Version control terms","colour":"purple","words":["EPOCH","NODE","BRANCH","FORK"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 32

post_puzzle '{
  "words":["MANGROVE","RAINFOREST","SAVANNA","TUNDRA","CONCERTO","SONATA","SUITE","SYMPHONY","BAROMETER","THERMOMETER","HYGROMETER","ANEMOMETER","ENAMEL","GLAZE","SLIP","BISQUE"],
  "categories":[
    {"name":"Ecosystems / biomes","colour":"yellow","words":["MANGROVE","RAINFOREST","SAVANNA","TUNDRA"]},
    {"name":"Classical music forms","colour":"green","words":["CONCERTO","SONATA","SUITE","SYMPHONY"]},
    {"name":"Weather measuring instruments","colour":"blue","words":["BAROMETER","THERMOMETER","HYGROMETER","ANEMOMETER"]},
    {"name":"Pottery / ceramics terms","colour":"purple","words":["ENAMEL","GLAZE","SLIP","BISQUE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 33

post_puzzle '{
  "words":["RIGATONI","FUSILLI","PENNE","FARFALLE","COCKPIT","FUSELAGE","AILERON","RUDDER","CRESCENT","WANING","WAXING","GIBBOUS","MYTH","FABLE","LEGEND","PARABLE"],
  "categories":[
    {"name":"Pasta shapes","colour":"yellow","words":["RIGATONI","FUSILLI","PENNE","FARFALLE"]},
    {"name":"Aeroplane parts","colour":"green","words":["COCKPIT","FUSELAGE","AILERON","RUDDER"]},
    {"name":"Moon phases","colour":"blue","words":["CRESCENT","WANING","WAXING","GIBBOUS"]},
    {"name":"Types of traditional story","colour":"purple","words":["MYTH","FABLE","LEGEND","PARABLE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 34

post_puzzle '{
  "words":["TECTONIC","SEISMIC","FAULT","EPICENTRE","TREBLE","ALTO","BARITONE","MEZZO","CATARACT","RAPIDS","WEIR","FLOODGATE","AXIOM","THEOREM","LEMMA","COROLLARY"],
  "categories":[
    {"name":"Earthquake terms","colour":"yellow","words":["TECTONIC","SEISMIC","FAULT","EPICENTRE"]},
    {"name":"Vocal range types","colour":"green","words":["TREBLE","ALTO","BARITONE","MEZZO"]},
    {"name":"River control structures","colour":"blue","words":["CATARACT","RAPIDS","WEIR","FLOODGATE"]},
    {"name":"Mathematical proof terms","colour":"purple","words":["AXIOM","THEOREM","LEMMA","COROLLARY"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 35

post_puzzle '{
  "words":["AMBER","UMBER","SIENNA","OCHRE","COCKNEY","BROGUE","DRAWL","TWANG","MORTAR","GROUT","RENDER","PLASTER","SPRITE","PIXIE","ELF","GNOME"],
  "categories":[
    {"name":"Earthy pigment colours","colour":"yellow","words":["AMBER","UMBER","SIENNA","OCHRE"]},
    {"name":"Accents / dialects","colour":"green","words":["COCKNEY","BROGUE","DRAWL","TWANG"]},
    {"name":"Building materials applied wet","colour":"blue","words":["MORTAR","GROUT","RENDER","PLASTER"]},
    {"name":"Mythical small creatures","colour":"purple","words":["SPRITE","PIXIE","ELF","GNOME"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 36

post_puzzle '{
  "words":["OTTER","BEAVER","PLATYPUS","MUSKRAT","PIZZICATO","STACCATO","LEGATO","TREMOLO","CINNAMON","CARDAMOM","CLOVE","NUTMEG","FACADE","GABLE","LINTEL","CORNICE"],
  "categories":[
    {"name":"Semi-aquatic mammals","colour":"yellow","words":["OTTER","BEAVER","PLATYPUS","MUSKRAT"]},
    {"name":"Music playing techniques","colour":"green","words":["PIZZICATO","STACCATO","LEGATO","TREMOLO"]},
    {"name":"Warm baking spices","colour":"blue","words":["CINNAMON","CARDAMOM","CLOVE","NUTMEG"]},
    {"name":"Architectural elements","colour":"purple","words":["FACADE","GABLE","LINTEL","CORNICE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 37

post_puzzle '{
  "words":["STEPPE","PRAIRIE","PAMPA","VELD","STANZA","VERSE","COUPLET","REFRAIN","NACRE","ABALONE","CONCH","COWRIE","AUDIT","LEDGER","INVOICE","RECEIPT"],
  "categories":[
    {"name":"Grassland types","colour":"yellow","words":["STEPPE","PRAIRIE","PAMPA","VELD"]},
    {"name":"Parts of a poem","colour":"green","words":["STANZA","VERSE","COUPLET","REFRAIN"]},
    {"name":"Shells or shell material","colour":"blue","words":["NACRE","ABALONE","CONCH","COWRIE"]},
    {"name":"Accounting documents","colour":"purple","words":["AUDIT","LEDGER","INVOICE","RECEIPT"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 38

post_puzzle '{
  "words":["BROCADE","TWEED","MUSLIN","ORGANZA","PULSAR","QUASAR","NEBULA","SINGULARITY","MORTAR","PESTLE","COLANDER","MANDOLINE","VERB","NOUN","ADVERB","CLAUSE"],
  "categories":[
    {"name":"Fine or textured fabrics","colour":"yellow","words":["BROCADE","TWEED","MUSLIN","ORGANZA"]},
    {"name":"Astronomical objects","colour":"green","words":["PULSAR","QUASAR","NEBULA","SINGULARITY"]},
    {"name":"Kitchen equipment","colour":"blue","words":["MORTAR","PESTLE","COLANDER","MANDOLINE"]},
    {"name":"Grammar terms","colour":"purple","words":["VERB","NOUN","ADVERB","CLAUSE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 39

post_puzzle '{
  "words":["TAFFETA","JACQUARD","CREPE","CHIFFON","ALBATROSS","FRIGATE","PELICAN","GANNET","PROTON","NEUTRON","QUARK","LEPTON","ARIA","LIBRETTO","CHORUS","RECITATIVE"],
  "categories":[
    {"name":"Lightweight dress fabrics","colour":"yellow","words":["TAFFETA","JACQUARD","CREPE","CHIFFON"]},
    {"name":"Seabirds","colour":"green","words":["ALBATROSS","FRIGATE","PELICAN","GANNET"]},
    {"name":"Subatomic particles","colour":"blue","words":["PROTON","NEUTRON","QUARK","LEPTON"]},
    {"name":"Opera terms","colour":"purple","words":["ARIA","LIBRETTO","CHORUS","RECITATIVE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 40

post_puzzle '{
  "words":["GAZELLE","IMPALA","WILDEBEEST","SPRINGBOK","RIVET","WELD","SOLDER","BRAZE","SERIF","KERNING","LEADING","TRACKING","LOCH","TARN","MERE","RESERVOIR"],
  "categories":[
    {"name":"African antelopes","colour":"yellow","words":["GAZELLE","IMPALA","WILDEBEEST","SPRINGBOK"]},
    {"name":"Metal joining methods","colour":"green","words":["RIVET","WELD","SOLDER","BRAZE"]},
    {"name":"Typography terms","colour":"blue","words":["SERIF","KERNING","LEADING","TRACKING"]},
    {"name":"Inland water bodies","colour":"purple","words":["LOCH","TARN","MERE","RESERVOIR"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 41

post_puzzle '{
  "words":["CAPYBARA","TAPIR","ARMADILLO","ANTEATER","FUGUE","CANON","ROUND","MADRIGAL","BASALT","LIMESTONE","SANDSTONE","SCHIST","QUILL","STYLUS","NIB","BIRO"],
  "categories":[
    {"name":"South American animals","colour":"yellow","words":["CAPYBARA","TAPIR","ARMADILLO","ANTEATER"]},
    {"name":"Polyphonic music forms","colour":"green","words":["FUGUE","CANON","ROUND","MADRIGAL"]},
    {"name":"Types of rock","colour":"blue","words":["BASALT","LIMESTONE","SANDSTONE","SCHIST"]},
    {"name":"Writing implements","colour":"purple","words":["QUILL","STYLUS","NIB","BIRO"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 42

post_puzzle '{
  "words":["TYPHOID","CHOLERA","MALARIA","DENGUE","SITAR","SAROD","TABLA","VEENA","SCREE","TALUS","MORAINE","DRUMLIN","SYNTAX","RUNTIME","COMPILE","DEBUG"],
  "categories":[
    {"name":"Tropical diseases","colour":"yellow","words":["TYPHOID","CHOLERA","MALARIA","DENGUE"]},
    {"name":"Indian classical instruments","colour":"green","words":["SITAR","SAROD","TABLA","VEENA"]},
    {"name":"Glacial landform deposits","colour":"blue","words":["SCREE","TALUS","MORAINE","DRUMLIN"]},
    {"name":"Stages of software development","colour":"purple","words":["SYNTAX","RUNTIME","COMPILE","DEBUG"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 43

post_puzzle '{
  "words":["VISCOSITY","DENSITY","BUOYANCY","SURFACE TENSION","MOTIF","LEITMOTIF","THEME","SUBJECT","ESCARPMENT","HOGBACK","DRUMLIN","ESKER","OSMOSIS","DIFFUSION","FILTRATION","DISTILLATION"],
  "categories":[
    {"name":"Fluid physics properties","colour":"yellow","words":["VISCOSITY","DENSITY","BUOYANCY","SURFACE TENSION"]},
    {"name":"Musical compositional elements","colour":"green","words":["MOTIF","LEITMOTIF","THEME","SUBJECT"]},
    {"name":"Glacial or hill ridge features","colour":"blue","words":["ESCARPMENT","HOGBACK","DRUMLIN","ESKER"]},
    {"name":"Separation techniques in chemistry","colour":"purple","words":["OSMOSIS","DIFFUSION","FILTRATION","DISTILLATION"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 44

post_puzzle '{
  "words":["MANDIBLE","MAXILLA","CLAVICLE","SCAPULA","DIRGE","ELEGY","THRENODY","LAMENT","CREVASSE","BERGSCHRUND","SERAC","CIRQUE","SEMAPHORE","MORSE","BRAILLE","BINARY"],
  "categories":[
    {"name":"Bones","colour":"yellow","words":["MANDIBLE","MAXILLA","CLAVICLE","SCAPULA"]},
    {"name":"Mournful music or poetry","colour":"green","words":["DIRGE","ELEGY","THRENODY","LAMENT"]},
    {"name":"Glacier features","colour":"blue","words":["CREVASSE","BERGSCHRUND","SERAC","CIRQUE"]},
    {"name":"Encoding / communication systems","colour":"purple","words":["SEMAPHORE","MORSE","BRAILLE","BINARY"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 45

post_puzzle '{
  "words":["TREBUCHET","BALLISTA","CATAPULT","MANGONEL","PENTATONIC","CHROMATIC","DIATONIC","ATONAL","LIGNITE","ANTHRACITE","BITUMEN","PEAT","PROXY","CACHE","DAEMON","SOCKET"],
  "categories":[
    {"name":"Medieval siege weapons","colour":"yellow","words":["TREBUCHET","BALLISTA","CATAPULT","MANGONEL"]},
    {"name":"Musical scale types","colour":"green","words":["PENTATONIC","CHROMATIC","DIATONIC","ATONAL"]},
    {"name":"Fossil fuel forms","colour":"blue","words":["LIGNITE","ANTHRACITE","BITUMEN","PEAT"]},
    {"name":"Computer networking terms","colour":"purple","words":["PROXY","CACHE","DAEMON","SOCKET"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 46

post_puzzle '{
  "words":["HYDRA","MEDUSA","MINOTAUR","CHIMERA","DIATRIBE","POLEMIC","HARANGUE","INVECTIVE","PERMAFROST","THERMOKARST","TALIK","PINGO","REGEX","ARRAY","POINTER","STACK"],
  "categories":[
    {"name":"Greek mythological monsters","colour":"yellow","words":["HYDRA","MEDUSA","MINOTAUR","CHIMERA"]},
    {"name":"Angry or forceful speech","colour":"green","words":["DIATRIBE","POLEMIC","HARANGUE","INVECTIVE"]},
    {"name":"Permafrost landscape terms","colour":"blue","words":["PERMAFROST","THERMOKARST","TALIK","PINGO"]},
    {"name":"Programming data structures","colour":"purple","words":["REGEX","ARRAY","POINTER","STACK"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 47

post_puzzle '{
  "words":["THALAMUS","HYPOTHALAMUS","CEREBELLUM","MEDULLA","PLINTH","CORNICE","FRIEZE","PEDIMENT","ABLATIVE","DATIVE","GENITIVE","VOCATIVE","LACQUER","VENEER","MARQUETRY","INLAY"],
  "categories":[
    {"name":"Brain regions","colour":"yellow","words":["THALAMUS","HYPOTHALAMUS","CEREBELLUM","MEDULLA"]},
    {"name":"Classical architectural elements","colour":"green","words":["PLINTH","CORNICE","FRIEZE","PEDIMENT"]},
    {"name":"Grammatical cases","colour":"blue","words":["ABLATIVE","DATIVE","GENITIVE","VOCATIVE"]},
    {"name":"Decorative wood surface techniques","colour":"purple","words":["LACQUER","VENEER","MARQUETRY","INLAY"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 48

post_puzzle '{
  "words":["ISTHMUS","PENINSULA","ARCHIPELAGO","PROMONTORY","HARPSICHORD","CLAVICHORD","FORTEPIANO","SPINET","PHENOTYPE","GENOTYPE","ALLELE","LOCUS","ANAPAEST","DACTYL","SPONDEE","TROCHEE"],
  "categories":[
    {"name":"Narrow coastal land forms","colour":"yellow","words":["ISTHMUS","PENINSULA","ARCHIPELAGO","PROMONTORY"]},
    {"name":"Precursors to the piano","colour":"green","words":["HARPSICHORD","CLAVICHORD","FORTEPIANO","SPINET"]},
    {"name":"Genetics terms","colour":"blue","words":["PHENOTYPE","GENOTYPE","ALLELE","LOCUS"]},
    {"name":"Metrical feet in poetry","colour":"purple","words":["ANAPAEST","DACTYL","SPONDEE","TROCHEE"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 49

post_puzzle '{
  "words":["CHIAROSCURO","IMPASTO","SFUMATO","GRISAILLE","APHELION","PERIHELION","SOLSTICE","EQUINOX","MYCELIUM","SPORANGIUM","HYPHA","BASIDIUM","IAMB","CAESURA","ENJAMBMENT","ELISION"],
  "categories":[
    {"name":"Painting techniques","colour":"yellow","words":["CHIAROSCURO","IMPASTO","SFUMATO","GRISAILLE"]},
    {"name":"Astronomical calendar / orbit events","colour":"green","words":["APHELION","PERIHELION","SOLSTICE","EQUINOX"]},
    {"name":"Fungal anatomy","colour":"blue","words":["MYCELIUM","SPORANGIUM","HYPHA","BASIDIUM"]},
    {"name":"Poetic devices","colour":"purple","words":["IAMB","CAESURA","ENJAMBMENT","ELISION"]}
  ],
  "difficulty_min":"yellow","difficulty_order":0,"status":"published","daily_date":null,"play_count":0
}' 50

echo ""
echo "Import complete!"
