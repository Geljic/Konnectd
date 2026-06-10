/**
 * Delete every puzzle that is NOT one of our hand-authored curated seeds,
 * leaving a clean board of only the curated set for hand-testing.
 *
 * Keepers are identified by EXACT 16-word match to src/data/connectionsPuzzles.ts
 * (not by the `source` tag), so this is correct even if tagging hasn't run.
 *
 * SAFETY:
 *  - Dry run by default — prints what it WOULD delete and keep, changes nothing.
 *  - Pass --confirm to actually delete.
 *  - BACK UP pb_data first (PB admin → Settings → Backups, or copy the data dir
 *    while the container is stopped). Deletes are not reversible.
 *  - --keep-daily spares any puzzle with a daily_date (preserves daily history).
 *
 * Run:
 *   npx ts-node scripts/purge_non_curated.ts            # dry run (safe)
 *   npx ts-node scripts/purge_non_curated.ts --confirm  # actually delete
 *
 * Env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
import { CONNECTIONS_PUZZLE_SEEDS, type CuratedSeed } from '../src/data/connectionsPuzzles';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const CONFIRM = process.argv.includes('--confirm');
const KEEP_DAILY = process.argv.includes('--keep-daily');
const pb = new PocketBase(PB_URL);

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

  const seedKeys = new Set(CONNECTIONS_PUZZLE_SEEDS.map(s => wordKey(seedWords(s))));
  const all = await pb.collection('puzzles').getFullList({ fields: 'id,words,daily_date,play_count', requestKey: null });

  const keepers: typeof all = [];
  const victims: typeof all = [];
  for (const rec of all) {
    const isCurated = seedKeys.has(wordKey((rec as any).words ?? []));
    const isProtectedDaily = KEEP_DAILY && !!(rec as any).daily_date;
    (isCurated || isProtectedDaily ? keepers : victims).push(rec);
  }

  const victimsWithDaily = victims.filter(v => (v as any).daily_date).length;
  const victimsWithPlays = victims.filter(v => ((v as any).play_count ?? 0) > 0).length;

  console.log(`Puzzles in DB: ${all.length}`);
  console.log(`  KEEP:   ${keepers.length}  (curated seed matches${KEEP_DAILY ? ' + daily' : ''})`);
  console.log(`  DELETE: ${victims.length}`);
  console.log(`          of those, ${victimsWithDaily} have a daily_date, ${victimsWithPlays} have play history.`);

  const matchedSeeds = new Set(
    all.filter(r => seedKeys.has(wordKey((r as any).words ?? []))).map(r => wordKey((r as any).words ?? [])),
  );
  if (matchedSeeds.size !== CONNECTIONS_PUZZLE_SEEDS.length) {
    console.log(`\n⚠ Only ${matchedSeeds.size}/${CONNECTIONS_PUZZLE_SEEDS.length} seeds found among keepers — double-check before deleting.`);
  }

  if (!CONFIRM) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --confirm to delete the above.');
    return;
  }

  console.log(`\nDeleting ${victims.length} puzzles...`);
  let done = 0;
  for (const v of victims) {
    try {
      await pb.collection('puzzles').delete(v.id);
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${victims.length}`);
    } catch (e) {
      console.log(`  ✗ ${v.id} — ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\nDone. Deleted ${done}. Remaining: ${keepers.length}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
