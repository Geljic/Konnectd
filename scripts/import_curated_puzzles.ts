/**
 * Publish the hand-authored curated puzzles (src/data/connectionsPuzzles.ts) to
 * the PocketBase `puzzles` collection. No Claude API needed — this just uploads
 * our own static content.
 *
 * --replace makes this idempotent: it first deletes any existing puzzle whose
 * 16-word set matches a seed, then imports fresh. Use it on every re-import while
 * iterating on the authored set. Without it, re-running creates duplicates.
 *
 * Run:
 *   npx ts-node scripts/import_curated_puzzles.ts                     # save as draft
 *   npx ts-node scripts/import_curated_puzzles.ts --publish           # save as published
 *   npx ts-node scripts/import_curated_puzzles.ts --publish --replace # refresh in place
 *
 * Env required:
 *   POCKETBASE_URL              (default: http://localhost:8092)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
// Type-only import is erased at runtime, so this needs no path-alias resolution.
import { CONNECTIONS_PUZZLE_SEEDS, type CuratedSeed } from '../src/data/connectionsPuzzles';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const PUBLISH = process.argv.includes('--publish');
const REPLACE = process.argv.includes('--replace');
const pb = new PocketBase(PB_URL);

const COLOUR_ORDER: Record<string, number> = { yellow: 0, green: 1, blue: 2, purple: 3 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordKey(words: string[]): string {
  return words.map(w => String(w).trim().toUpperCase()).sort().join('|');
}

function buildRecord(seed: CuratedSeed) {
  const words = seed.categories.flatMap(c => c.words);
  return {
    words: shuffle(words),
    categories: seed.categories.map(c => ({
      name: c.name,
      colour: c.colour,
      words: c.words,
      explanation: c.explanation,
    })),
    // difficulty_min carries the OVERALL rating (Easy→Expert), not the easiest row.
    difficulty_min: seed.difficulty,
    difficulty_order: COLOUR_ORDER[seed.difficulty],
    status: PUBLISH ? 'published' : 'draft',
    daily_date: null,
    play_count: 0,
    source: 'curated',
    tags: seed.tags ?? [],
  };
}

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  if (REPLACE) {
    const seedKeys = new Set(CONNECTIONS_PUZZLE_SEEDS.map(s => wordKey(s.categories.flatMap(c => c.words))));
    const existing = await pb.collection('puzzles').getFullList({ fields: 'id,words', requestKey: null });
    const stale = existing.filter(r => seedKeys.has(wordKey((r as any).words ?? [])));
    console.log(`--replace: deleting ${stale.length} existing seed-matching puzzle(s)...`);
    for (const r of stale) await pb.collection('puzzles').delete(r.id);
  }

  console.log(`Importing ${CONNECTIONS_PUZZLE_SEEDS.length} curated puzzles as ${PUBLISH ? 'PUBLISHED' : 'draft'}...`);
  let created = 0;
  for (const seed of CONNECTIONS_PUZZLE_SEEDS) {
    try {
      await pb.collection('puzzles').create(buildRecord(seed));
      created++;
      console.log(`  ✓ ${seed.id} "${seed.title}" [${seed.difficulty}]`);
    } catch (e) {
      console.log(`  ✗ ${seed.id} — ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nDone. ${created}/${CONNECTIONS_PUZZLE_SEEDS.length} imported.`);
  if (!PUBLISH) console.log(`Review at ${PB_URL}/_/ and flip status to 'published'.`);
}

main().catch(e => { console.error(e); process.exit(1); });
