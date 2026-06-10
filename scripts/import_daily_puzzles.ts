/**
 * Schedule the daily Groups puzzles (src/data/dailyPuzzles.ts) into PocketBase.
 * Each seed gets a sequential daily_date starting from --start (default the
 * DAILY_PUZZLE_LAUNCH_DATE, 2026-06-09): seed[0] → start, seed[1] → start+1, …
 *
 * fetchDailyPuzzle serves the puzzle whose daily_date = today; once a date
 * passes it stays playable in Free Play's Daily archive (daily_date <= today).
 * Future-dated puzzles stay hidden until their day. Imported source 'daily'.
 *
 * Run:
 *   npx ts-node scripts/import_daily_puzzles.ts                       # from 2026-06-09
 *   npx ts-node scripts/import_daily_puzzles.ts --start=2026-06-10
 *   npx ts-node scripts/import_daily_puzzles.ts --replace             # refresh in place
 *
 * Env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
import { DAILY_PUZZLE_SEEDS } from '../src/data/dailyPuzzles';
import type { CuratedSeed } from '../src/data/connectionsPuzzles';

const arg = (name: string, def: string) =>
  process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const START = arg('start', '2026-06-09');
const REPLACE = process.argv.includes('--replace');
const pb = new PocketBase(PB_URL);

const COLOUR_ORDER: Record<string, number> = { yellow: 0, green: 1, blue: 2, purple: 3 };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
function wordKey(words: string[]): string {
  return words.map(w => String(w).trim().toUpperCase()).sort().join('|');
}
function dateForIndex(i: number): string {
  const d = new Date(START + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
}

function buildRecord(seed: CuratedSeed, dailyDate: string) {
  return {
    words: shuffle(seed.categories.flatMap(c => c.words)),
    categories: seed.categories.map(c => ({ name: c.name, colour: c.colour, words: c.words, explanation: c.explanation })),
    difficulty_min: seed.difficulty,
    difficulty_order: COLOUR_ORDER[seed.difficulty],
    // NOT 'published' — keeps future-dated dailies out of the Curated list until
    // their day. fetchDailyPuzzle + the Daily tab find them by date regardless.
    status: 'daily',
    daily_date: dailyDate,
    play_count: 0,
    source: 'daily',
    tags: seed.tags ?? ['daily'],
  };
}

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  if (REPLACE) {
    const seedKeys = new Set(DAILY_PUZZLE_SEEDS.map(s => wordKey(s.categories.flatMap(c => c.words))));
    const existing = await pb.collection('puzzles').getFullList({ fields: 'id,words', requestKey: null });
    const stale = existing.filter(r => seedKeys.has(wordKey((r as any).words ?? [])));
    console.log(`--replace: deleting ${stale.length} existing daily puzzle(s)...`);
    for (const r of stale) await pb.collection('puzzles').delete(r.id);
  }

  console.log(`Scheduling ${DAILY_PUZZLE_SEEDS.length} daily puzzles from ${START}...`);
  let created = 0;
  for (let i = 0; i < DAILY_PUZZLE_SEEDS.length; i++) {
    const seed = DAILY_PUZZLE_SEEDS[i];
    const date = dateForIndex(i);
    try {
      await pb.collection('puzzles').create(buildRecord(seed, date));
      created++;
      console.log(`  ✓ ${date}  ${seed.id} "${seed.title}" [${seed.difficulty}]`);
    } catch (e) {
      console.log(`  ✗ ${seed.id} — ${e instanceof Error ? e.message : e}`);
    }
  }

  const last = dateForIndex(DAILY_PUZZLE_SEEDS.length - 1);
  console.log(`\nDone. ${created}/${DAILY_PUZZLE_SEEDS.length} scheduled (${START} → ${last}).`);
}

main().catch(e => { console.error(e); process.exit(1); });
