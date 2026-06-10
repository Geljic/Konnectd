/**
 * Import NYT Connections puzzles from the Eyefyre community archive into a
 * dedicated `nyt_puzzles` collection in PocketBase.
 *
 * Source: https://github.com/Eyefyre/NYT-Connections-Answers
 *
 * Run: npx ts-node scripts/import_nyt_puzzles.ts
 *
 * Optional flags:
 *   --dry-run     Print records without writing to PocketBase
 *   --skip=N      Skip the first N puzzles (resume after a partial import)
 *
 * Env required:
 *   POCKETBASE_URL            (default: http://localhost:8094)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';

const SOURCE_URL =
  'https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/main/connections.json';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const COLLECTION = 'nyt_puzzles';
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP = parseInt(
  process.argv.find(a => a.startsWith('--skip='))?.split('=')[1] ?? '0'
);

const LEVEL_TO_COLOUR: Record<number, 'yellow' | 'green' | 'blue' | 'purple'> = {
  0: 'yellow',
  1: 'green',
  2: 'blue',
  3: 'purple',
};

interface NytCategory {
  level: number;
  group: string;
  members: [string, string, string, string];
}

interface NytPuzzle {
  id: number;
  date: string;
  answers: NytCategory[];
}

async function fetchSource(): Promise<NytPuzzle[]> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Failed to fetch source: ${res.status} ${res.statusText}`);
  return res.json() as Promise<NytPuzzle[]>;
}

function buildRecord(puzzle: NytPuzzle) {
  const categories = puzzle.answers.map(a => ({
    name: a.group,
    colour: LEVEL_TO_COLOUR[a.level],
    words: a.members,
  }));

  const allWords = categories.flatMap(c => c.words);
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);

  return {
    nyt_id: puzzle.id,
    nyt_date: puzzle.date,
    words: shuffled,
    categories,
    status: 'published',
    play_count: 0,
  };
}

async function main() {
  const puzzles = await fetchSource();
  console.log(`Fetched ${puzzles.length} NYT puzzles from source.`);

  const toImport = SKIP > 0 ? puzzles.slice(SKIP) : puzzles;
  console.log(
    `Importing ${toImport.length} puzzles${SKIP > 0 ? ` (skipping first ${SKIP})` : ''}` +
    (DRY_RUN ? ' [DRY RUN]' : ` → ${PB_URL} / ${COLLECTION}`)
  );

  if (DRY_RUN) {
    console.log('\nSample record (first puzzle):');
    console.log(JSON.stringify(buildRecord(toImport[0]), null, 2));
    return;
  }

  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? ''
  );

  // Create the collection if it doesn't exist
  try {
    await pb.collections.getOne(COLLECTION);
    console.log(`Collection "${COLLECTION}" already exists.`);
  } catch {
    console.log(`Creating collection "${COLLECTION}"...`);
    await pb.collections.create({
      name: COLLECTION,
      type: 'base',
      schema: [
        { name: 'nyt_id',     type: 'number', required: true, options: { min: null, max: null } },
        { name: 'nyt_date',   type: 'text',   required: true },
        { name: 'words',      type: 'json',   required: true },
        { name: 'categories', type: 'json',   required: true },
        { name: 'status',     type: 'text',   required: false },
        { name: 'play_count', type: 'number', required: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_nyt_id ON nyt_puzzles (nyt_id)'],
    });
    console.log(`Collection "${COLLECTION}" created.`);
  }

  let imported = 0;
  let skipped = 0;

  for (const puzzle of toImport) {
    const record = buildRecord(puzzle);
    try {
      await pb.collection(COLLECTION).create(record);
      imported++;
      process.stdout.write(`\r  Imported ${imported}/${toImport.length} (skipped ${skipped})`);
    } catch (e: any) {
      // Duplicate nyt_id — already imported
      if (e?.response?.code === 400) {
        skipped++;
      } else {
        console.error(`\nError on puzzle id=${puzzle.id}:`, e);
      }
    }

    // Small delay to avoid hammering PocketBase
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n\nDone. ${imported} imported, ${skipped} already existed.`);
  console.log(`View at ${PB_URL}/_/#/collections?collectionId=${COLLECTION}`);
}

main().catch(console.error);
