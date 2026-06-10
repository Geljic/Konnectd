/**
 * Stages 2-4 of the puzzle pipeline: GENERATE → SCREEN → JUDGE → QUEUE.
 *
 * Uses the style guide from learn_nyt_style.ts to generate ORIGINAL puzzles,
 * rejects any that overlap the NYT archive (originality index), grades survivors
 * with a separate self-critique pass, and saves only high-scoring boards to
 * PocketBase as `status: 'draft'` with their score + critique attached, so you
 * review the best candidates first and publish with one click.
 *
 * Run (after learn_nyt_style.ts):
 *   npx ts-node scripts/generate_puzzles_v2.ts --count=10 --min-score=7
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
import { readFileSync } from 'fs';
import { join } from 'path';

const arg = (name: string, def: string) =>
  process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;

const COUNT = parseInt(arg('count', '10'));
const MIN_SCORE = parseFloat(arg('min-score', '7'));
const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const GEN_MODEL = process.env.GEN_MODEL ?? 'claude-sonnet-4-6';
const JUDGE_MODEL = process.env.JUDGE_MODEL ?? 'claude-sonnet-4-6';

const DATA_DIR = join(__dirname, 'data');
const PRINCIPLES_PATH = join(DATA_DIR, 'nyt_design_principles.json');
const INDEX_PATH = join(DATA_DIR, 'nyt_index.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pb = new PocketBase(PB_URL);

type Colour = 'yellow' | 'green' | 'blue' | 'purple';
const COLOURS: Colour[] = ['yellow', 'green', 'blue', 'purple'];
const DIFFICULTY_ORDER: Record<Colour, number> = { yellow: 0, green: 1, blue: 2, purple: 3 };

interface GenCategory { name: string; colour: Colour; words: [string, string, string, string]; connection_explanation: string }
interface GenPuzzle { categories: GenCategory[] }
interface Judgement { trap_quality: number; purple_cleverness: number; category_tightness: number; solvability: number; originality: number; overall: number; verdict: string; issues: string[] }

function categorySignature(words: string[]): string {
  const norm = words.map(w => w.trim().toUpperCase()).sort().join('|');
  return createHash('sha1').update(norm).digest('hex').slice(0, 16);
}

function extractJson(text: string): any | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function buildSystemPrompt(principles: any): string {
  return `You are an expert Connections puzzle constructor. Build ORIGINAL puzzles that match NYT quality.
You have been given a distilled STYLE GUIDE reverse-engineered from the genre. Follow it.

STYLE GUIDE (JSON):
${JSON.stringify({
    category_archetypes: principles.category_archetypes,
    difficulty_ladder: principles.difficulty_ladder,
    trap_techniques: principles.trap_techniques,
    purple_tricks: principles.purple_tricks,
    word_selection_rules: principles.word_selection_rules,
    anti_patterns: principles.anti_patterns,
    construction_checklist: principles.construction_checklist,
  }, null, 1)}

Hard rules:
- Exactly 4 categories (yellow/green/blue/purple), exactly 4 words each, 16 unique words total.
- Every word belongs to EXACTLY ONE category within the puzzle (no genuine ambiguity in the answer).
- Plant deliberate trap words that LOOK like they fit another category — this is the fun.
- Be ORIGINAL. Do NOT reproduce any known NYT board or category. Invent fresh themes and word-sets.`;
}

function buildUserPrompt(examples: string[]): string {
  return `Here are a few real puzzles purely as quality calibration (DO NOT reuse their themes or words):
${examples.map((e, i) => `Example ${i + 1}: ${e}`).join('\n')}

Now construct ONE brand-new, original puzzle of similar craft. Vary the archetypes you pick.
Return ONLY valid JSON, no commentary:
{
  "categories": [
    { "name": "Short display name", "colour": "yellow", "words": ["W1","W2","W3","W4"], "connection_explanation": "why these connect" },
    { "colour": "green", ... }, { "colour": "blue", ... }, { "colour": "purple", ... }
  ]
}
All words UPPERCASE.`;
}

function validate(p: GenPuzzle): boolean {
  if (!p?.categories || p.categories.length !== 4) return false;
  const colours = p.categories.map(c => c.colour);
  if (!COLOURS.every(c => colours.includes(c))) return false;
  const words = p.categories.flatMap(c => c.words?.map(w => w?.trim().toUpperCase()) ?? []);
  if (words.length !== 16) return false;
  return new Set(words).size === 16;
}

/** Reject boards that overlap the NYT archive at category or board level. */
function originalityViolation(p: GenPuzzle, index: { category_signatures: string[]; board_signatures: string[] }): string | null {
  const catSet = new Set(index.category_signatures);
  const boardSet = new Set(index.board_signatures);
  const sigs = p.categories.map(c => categorySignature(c.words)).sort();
  for (let i = 0; i < sigs.length; i++) {
    if (catSet.has(sigs[i])) return `category "${p.categories[i].name}" duplicates an NYT category`;
  }
  const boardSig = createHash('sha1').update(sigs.join('+')).digest('hex').slice(0, 16);
  if (boardSet.has(boardSig)) return 'whole board matches an NYT puzzle';
  return null;
}

const JUDGE_SYSTEM = `You are a ruthless Connections puzzle editor. Grade a candidate puzzle on a 0-10 scale per axis.
Be harsh: a 7+ overall should mean "publishable at NYT standard". Penalise ambiguous answers, weak/forced
purple wordplay, loose categories, and any word that genuinely fits two categories.`;

async function judge(p: GenPuzzle): Promise<Judgement | null> {
  const board = p.categories.map(c => `${c.colour.toUpperCase()}: ${c.name} = [${c.words.join(', ')}] (${c.connection_explanation})`).join('\n');
  const res = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1024,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: `Grade this puzzle:\n${board}\n\nReturn ONLY JSON:
{ "trap_quality": 0-10, "purple_cleverness": 0-10, "category_tightness": 0-10, "solvability": 0-10, "originality": 0-10, "overall": 0-10, "verdict": "one sentence", "issues": ["..."] }` }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  return extractJson(text) as Judgement | null;
}

async function generate(system: string, user: string): Promise<GenPuzzle | null> {
  const res = await client.messages.create({
    model: GEN_MODEL,
    max_tokens: 1200,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  return extractJson(text) as GenPuzzle | null;
}

function buildRecord(p: GenPuzzle, j: Judgement) {
  const allWords = p.categories.flatMap(c => c.words.map(w => w.trim().toUpperCase()));
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  const difficultyMin = p.categories.reduce((min, c) =>
    DIFFICULTY_ORDER[c.colour] < DIFFICULTY_ORDER[min] ? c.colour : min, p.categories[0].colour);
  return {
    words: shuffled,
    categories: p.categories.map(c => ({ name: c.name, colour: c.colour, words: c.words })),
    difficulty_min: difficultyMin,
    difficulty_order: DIFFICULTY_ORDER[difficultyMin],
    status: 'draft',
    daily_date: null,
    play_count: 0,
    source: 'generated',
    tags: [],
    gen_score: j.overall,
    gen_review: j,
  };
}

async function main() {
  let principles: any, index: any;
  try {
    principles = JSON.parse(readFileSync(PRINCIPLES_PATH, 'utf8'));
    index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
  } catch {
    console.error('Missing style guide / index. Run scripts/learn_nyt_style.ts first.');
    process.exit(1);
  }

  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? '',
  );

  // A few real boards as quality calibration (sent to the API only, never stored).
  const total = await pb.collection('nyt_puzzles').getList(1, 1, { requestKey: null });
  const fewShot: string[] = [];
  for (let i = 0; i < 3 && total.totalItems > 0; i++) {
    const page = Math.floor(Math.random() * total.totalItems) + 1;
    const r = await pb.collection('nyt_puzzles').getList(page, 1, { sort: 'nyt_id', requestKey: null });
    const cats = (r.items[0] as any)?.categories as NytCategoryLike[] | undefined;
    if (cats) fewShot.push(cats.map(c => `${c.name} = [${c.words.join(', ')}]`).join(' ; '));
  }

  const system = buildSystemPrompt(principles);
  console.log(`Generating up to ${COUNT} puzzles (min score ${MIN_SCORE}) with ${GEN_MODEL}, judged by ${JUDGE_MODEL}...`);

  let saved = 0, attempts = 0;
  const maxAttempts = COUNT * 5;
  while (saved < COUNT && attempts < maxAttempts) {
    attempts++;
    process.stdout.write(`[${attempts}] `);
    try {
      const puzzle = await generate(system, buildUserPrompt(fewShot));
      if (!puzzle || !validate(puzzle)) { console.log('✗ invalid structure'); continue; }

      const overlap = originalityViolation(puzzle, index);
      if (overlap) { console.log(`✗ not original — ${overlap}`); continue; }

      const verdict = await judge(puzzle);
      if (!verdict) { console.log('✗ judge failed'); continue; }
      if (verdict.overall < MIN_SCORE) { console.log(`✗ scored ${verdict.overall} (<${MIN_SCORE})`); continue; }

      await pb.collection('puzzles').create(buildRecord(puzzle, verdict));
      saved++;
      console.log(`✓ saved draft (${saved}/${COUNT}) — score ${verdict.overall}: ${verdict.verdict}`);
    } catch (e) {
      console.log('✗ error:', e instanceof Error ? e.message : e);
    }
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${saved} drafts saved (from ${attempts} attempts).`);
  console.log(`Review highest-scoring first at ${PB_URL}/_/ — sort puzzles by gen_score desc, set status=published.`);
}

interface NytCategoryLike { name: string; words: string[] }

main().catch(e => { console.error(e); process.exit(1); });
