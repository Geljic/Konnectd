/**
 * Push the static Next Steps puzzles (src/data/wordTrailsPuzzles.ts) into the
 * PocketBase `word_trails` collection (created by migration 1781120000).
 *
 * The app still reads the static file today; this gives DB parity with
 * Connections so the set can be managed/expanded server-side. Each record keeps
 * its static id as `slug`. Validates 16 unique words per puzzle before inserting.
 *
 * Run:
 *   npx ts-node scripts/import_word_trails.ts                     # draft
 *   npx ts-node scripts/import_word_trails.ts --publish           # published
 *   npx ts-node scripts/import_word_trails.ts --publish --replace # refresh in place
 *
 * Env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
import { WORD_TRAILS_PUZZLES, type WordTrailsPuzzle } from '../src/data/wordTrailsPuzzles';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const PUBLISH = process.argv.includes('--publish');
const REPLACE = process.argv.includes('--replace');
const pb = new PocketBase(PB_URL);

function validate(p: WordTrailsPuzzle): string | null {
  if (p.trails.length !== 4) return '4 trails required';
  const words: string[] = [];
  for (const t of p.trails) {
    if (t.words.length !== 4) return `trail "${t.label}" needs 4 words`;
    words.push(...t.words.map(w => w.trim().toUpperCase()));
  }
  if (new Set(words).size !== 16) return '16 unique words required';
  return null;
}

function buildRecord(p: WordTrailsPuzzle) {
  return {
    slug: p.id,
    title: p.title,
    difficulty: p.difficulty,
    trails: p.trails,
    status: PUBLISH ? 'published' : 'draft',
    source: 'curated',
    play_count: 0,
  };
}

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  if (REPLACE) {
    const existing = await pb.collection('word_trails').getFullList({ fields: 'id,slug', requestKey: null });
    const slugs = new Set(WORD_TRAILS_PUZZLES.map(p => p.id));
    const stale = existing.filter(r => slugs.has((r as any).slug));
    console.log(`--replace: deleting ${stale.length} existing puzzle(s)...`);
    for (const r of stale) await pb.collection('word_trails').delete(r.id);
  }

  console.log(`Importing ${WORD_TRAILS_PUZZLES.length} Next Steps puzzles as ${PUBLISH ? 'PUBLISHED' : 'draft'}...`);
  let created = 0, invalid = 0;
  for (const p of WORD_TRAILS_PUZZLES) {
    const err = validate(p);
    if (err) { console.log(`  ✗ ${p.id} invalid — ${err}`); invalid++; continue; }
    try {
      await pb.collection('word_trails').create(buildRecord(p));
      created++;
    } catch (e) {
      console.log(`  ✗ ${p.id} — ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nDone. ${created}/${WORD_TRAILS_PUZZLES.length} imported${invalid ? `, ${invalid} invalid` : ''}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
