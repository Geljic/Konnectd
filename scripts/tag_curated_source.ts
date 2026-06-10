/**
 * Backfill `source` (+ `tags`) on existing `puzzles` records.
 *
 * Matches each row against the hand-authored seeds (src/data/connectionsPuzzles.ts)
 * by exact 16-word set: a match → source 'curated' (+ the seed's tags); everything
 * else with an empty source → 'generated'. Idempotent: re-running only fills gaps
 * and re-confirms curated rows. Reports any seed that matched multiple rows
 * (i.e. duplicate imports) so you can clean them up.
 *
 * Run:
 *   npx ts-node scripts/tag_curated_source.ts          # apply
 *   npx ts-node scripts/tag_curated_source.ts --dry    # report only, no writes
 *
 * Env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
import { CONNECTIONS_PUZZLE_SEEDS, type CuratedSeed } from '../src/data/connectionsPuzzles';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const DRY = process.argv.includes('--dry');
const pb = new PocketBase(PB_URL);

/** Order-independent fingerprint of a puzzle's 16 words. */
function wordKey(words: string[]): string {
  return words.map(w => String(w).trim().toUpperCase()).sort().join('|');
}

function seedWords(seed: CuratedSeed): string[] {
  return seed.categories.flatMap(c => c.words);
}

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  const seedByKey = new Map<string, CuratedSeed>();
  for (const seed of CONNECTIONS_PUZZLE_SEEDS) seedByKey.set(wordKey(seedWords(seed)), seed);

  const all = await pb.collection('puzzles').getFullList({ fields: 'id,words,source,tags', requestKey: null });
  console.log(`${all.length} puzzles in DB; ${seedByKey.size} curated seeds.${DRY ? '  (dry run)' : ''}`);

  const seedHits = new Map<string, number>();
  let curated = 0, generated = 0, skipped = 0;

  for (const rec of all) {
    const key = wordKey((rec as any).words ?? []);
    const seed = seedByKey.get(key);

    let nextSource: string | null = null;
    let nextTags: string[] | null = null;
    if (seed) {
      seedHits.set(seed.id, (seedHits.get(seed.id) ?? 0) + 1);
      if ((rec as any).source !== 'curated') { nextSource = 'curated'; nextTags = seed.tags ?? []; }
    } else if (!(rec as any).source) {
      nextSource = 'generated';
    }

    if (nextSource === null) { skipped++; continue; }
    if (nextSource === 'curated') curated++; else generated++;

    if (!DRY) {
      const patch: Record<string, unknown> = { source: nextSource };
      if (nextTags !== null) patch.tags = nextTags;
      await pb.collection('puzzles').update(rec.id, patch);
    }
  }

  console.log(`\n${DRY ? 'Would tag' : 'Tagged'}: ${curated} curated, ${generated} generated.  Unchanged: ${skipped}.`);

  const missing = CONNECTIONS_PUZZLE_SEEDS.filter(s => !seedHits.has(s.id));
  const dupes = [...seedHits.entries()].filter(([, n]) => n > 1);
  if (missing.length) console.log(`\n⚠ ${missing.length} seed(s) not found in DB: ${missing.map(s => s.id).join(', ')}`);
  if (dupes.length) {
    console.log(`\n⚠ Duplicate imports detected (seed → copies in DB):`);
    for (const [id, n] of dupes) console.log(`   ${id}: ${n} copies`);
    console.log('   Consider deleting the extras to keep one of each.');
  }
  if (!missing.length && !dupes.length) console.log('\nAll 12 seeds matched exactly once. Clean.');
}

main().catch(e => { console.error(e); process.exit(1); });
