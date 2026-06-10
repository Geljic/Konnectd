/**
 * Stage 1 of the puzzle pipeline: LEARN.
 *
 * Reads the full NYT archive from PocketBase and distils it into a *style guide*
 * (design principles, not content) plus a local originality index used later to
 * reject any generated board that overlaps a real NYT one.
 *
 * IMPORTANT — legal posture: this learns *technique* from the archive the way a
 * constructor studies the genre. It never republishes NYT boards. Its outputs
 * are (a) abstract principles and (b) one-way hashes of category word-sets used
 * only to *avoid* accidental overlap. Neither output ships in the app.
 *
 * Run:
 *   npx ts-node scripts/learn_nyt_style.ts
 *
 * Outputs (gitignored, local only):
 *   scripts/data/nyt_design_principles.json
 *   scripts/data/nyt_index.json
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *   POCKETBASE_URL              (default: http://localhost:8092)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import Anthropic from '@anthropic-ai/sdk';
import PocketBase from 'pocketbase';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const DATA_DIR = join(__dirname, 'data');
const PRINCIPLES_PATH = join(DATA_DIR, 'nyt_design_principles.json');
const INDEX_PATH = join(DATA_DIR, 'nyt_index.json');

// Deep one-time analysis — worth the strongest model.
const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL ?? 'claude-opus-4-8';
// How many real boards to show the analyst as concrete evidence.
const SAMPLE_SIZE = parseInt(process.env.SAMPLE_SIZE ?? '120');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pb = new PocketBase(PB_URL);

interface NytCategory { name: string; colour?: string; words: string[] }
interface NytPuzzle { nyt_id: number; nyt_date: string; categories: NytCategory[] }

/** Stable signature for a category: its sorted, normalised word-set. */
function categorySignature(words: string[]): string {
  const norm = words.map(w => w.trim().toUpperCase()).sort().join('|');
  return createHash('sha1').update(norm).digest('hex').slice(0, 16);
}

function sample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const ANALYST_SYSTEM = `You are a senior puzzle editor reverse-engineering the craft behind NYT Connections.
You are given a large sample of real puzzles. Produce a reusable DESIGN STYLE GUIDE that another
constructor could follow to make ORIGINAL puzzles of the same quality. Capture *technique*, never
specific boards. Be concrete and specific — name the patterns, don't speak in generalities.`;

function analystPrompt(puzzles: NytPuzzle[]): string {
  const lines = puzzles.map(p =>
    p.categories.map(c => `${(c.colour ?? '?').toUpperCase()}: ${c.name} = [${c.words.join(', ')}]`).join(' ; ')
  );
  return `Here are ${puzzles.length} real Connections puzzles (one per line, 4 categories each):

${lines.join('\n')}

Analyse them and return ONLY valid JSON in this schema:
{
  "category_archetypes": [
    { "id": "kebab-name", "description": "what the category does", "example_template": "e.g. ___ + BALL", "typical_colour": "yellow|green|blue|purple", "frequency": "common|occasional|rare" }
  ],
  "difficulty_ladder": { "yellow": "...", "green": "...", "blue": "...", "purple": "..." },
  "trap_techniques": [ "specific ways a word is made to look like it belongs to the wrong category" ],
  "purple_tricks": [ "specific wordplay devices used in the hardest category" ],
  "word_selection_rules": [ "rules about word length, proper nouns, ambiguity, phrase length" ],
  "anti_patterns": [ "things these puzzles deliberately avoid" ],
  "construction_checklist": [ "ordered steps a constructor should follow to build one board" ]
}

Make category_archetypes thorough (aim for 12-20). No commentary outside the JSON.`;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  console.log('Loading NYT archive...');
  const records = await pb.collection('nyt_puzzles').getFullList({
    fields: 'nyt_id,nyt_date,categories',
    sort: 'nyt_id',
    requestKey: null,
  });
  const puzzles = records as unknown as NytPuzzle[];
  console.log(`  ${puzzles.length} puzzles loaded.`);

  // Build the originality index: every category word-set + every full board.
  const categorySigs = new Set<string>();
  const boardSigs = new Set<string>();
  for (const p of puzzles) {
    const sigs = p.categories.map(c => categorySignature(c.words)).sort();
    sigs.forEach(s => categorySigs.add(s));
    boardSigs.add(createHash('sha1').update(sigs.join('+')).digest('hex').slice(0, 16));
  }
  writeFileSync(INDEX_PATH, JSON.stringify({
    built_at: new Date().toISOString(),
    source_count: puzzles.length,
    category_signatures: [...categorySigs],
    board_signatures: [...boardSigs],
  }, null, 2));
  console.log(`  Originality index: ${categorySigs.size} category signatures, ${boardSigs.size} boards → ${INDEX_PATH}`);

  // Distil the style guide from a representative sample.
  const sampled = sample(puzzles, SAMPLE_SIZE);
  console.log(`Analysing a sample of ${sampled.length} with ${ANALYSIS_MODEL}...`);
  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 8000,
    system: ANALYST_SYSTEM,
    messages: [{ role: 'user', content: analystPrompt(sampled) }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { console.error('No JSON in analysis response:\n', text); process.exit(1); }

  const principles = JSON.parse(jsonMatch[0]);
  writeFileSync(PRINCIPLES_PATH, JSON.stringify({
    generated_at: new Date().toISOString(),
    model: ANALYSIS_MODEL,
    sample_size: sampled.length,
    ...principles,
  }, null, 2));
  console.log(`Style guide → ${PRINCIPLES_PATH}`);
  console.log(`  ${principles.category_archetypes?.length ?? 0} archetypes captured.`);
  console.log('\nNext: scripts/generate_puzzles_v2.ts --count 10');
}

main().catch(e => { console.error(e); process.exit(1); });
