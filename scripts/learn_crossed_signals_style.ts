/**
 * Stage 1 for Crossed Signals: LEARN.
 *
 * Distils construction rules for Crossed Signals from:
 * - local hand-written Crossed Signals seed puzzles
 * - optional NYT Connections design principles from learn_nyt_style.ts
 * - optional NYT archive samples from PocketBase as association-quality calibration
 *
 * Legal posture: this learns technique and quality standards, not content. It writes
 * abstract construction guidance plus one-way hashes used to reject duplicate local
 * Crossed Signals boards later.
 *
 * Run:
 *   npx ts-node scripts/learn_crossed_signals_style.ts
 *
 * Outputs:
 *   scripts/data/crossed_signals_style.json
 *   scripts/data/crossed_signals_index.json
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *
 * Env optional:
 *   POCKETBASE_URL              (default: http://localhost:8092)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 *   ANALYSIS_MODEL              (default: claude-opus-4-8)
 *   NYT_SAMPLE_SIZE             (default: 80)
 */

import Anthropic from '@anthropic-ai/sdk';
import PocketBase from 'pocketbase';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CROSSED_SIGNALS_SEED_PUZZLES, type CrossedSignalsPuzzle } from '../src/data/crossedSignalsPuzzles';

const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';
const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL ?? 'claude-opus-4-8';
const NYT_SAMPLE_SIZE = parseInt(process.env.NYT_SAMPLE_SIZE ?? '80', 10);

const DATA_DIR = join(__dirname, 'data');
const NYT_PRINCIPLES_PATH = join(DATA_DIR, 'nyt_design_principles.json');
const STYLE_PATH = join(DATA_DIR, 'crossed_signals_style.json');
const INDEX_PATH = join(DATA_DIR, 'crossed_signals_index.json');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pb = new PocketBase(PB_URL);

interface NytCategory { name: string; colour?: string; words: string[] }
interface NytPuzzle { nyt_id: number; nyt_date: string; categories: NytCategory[] }

function normalise(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

function boardSignature(puzzle: CrossedSignalsPuzzle): string {
  const rows = puzzle.rows.map(row => normalise(row.label)).sort().join('|');
  const columns = puzzle.columns.map(column => normalise(column.label)).sort().join('|');
  const words = puzzle.cells.map(cell => normalise(cell.word)).sort().join('|');
  return createHash('sha1').update(`${rows}::${columns}::${words}`).digest('hex').slice(0, 16);
}

function axisSignature(labels: string[]) {
  return createHash('sha1').update(labels.map(normalise).sort().join('|')).digest('hex').slice(0, 16);
}

function formatCrossedPuzzle(puzzle: CrossedSignalsPuzzle) {
  const rowLabels = puzzle.rows.map(row => row.label).join(' | ');
  const columnLabels = puzzle.columns.map(column => column.label).join(' | ');
  const cells = puzzle.rows.map(row => {
    const words = puzzle.columns.map(column => {
      const cell = puzzle.cells.find(c => c.rowId === row.id && c.columnId === column.id);
      return `${column.label}: ${cell?.word ?? '?'}`;
    });
    return `${row.label} => ${words.join(', ')}`;
  });
  return [
    `Title: ${puzzle.title}`,
    `Difficulty number: ${puzzle.difficulty}`,
    `Rows: ${rowLabels}`,
    `Columns: ${columnLabels}`,
    ...cells,
  ].join('\n');
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

async function loadNytSamples(): Promise<NytPuzzle[]> {
  if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) return [];
  try {
    await pb.collection('_superusers').authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL,
      process.env.POCKETBASE_ADMIN_PASSWORD,
    );
    const records = await pb.collection('nyt_puzzles').getFullList({
      fields: 'nyt_id,nyt_date,categories',
      sort: 'nyt_id',
      requestKey: null,
    });
    return sample(records as unknown as NytPuzzle[], NYT_SAMPLE_SIZE);
  } catch (error) {
    console.warn('Could not load NYT samples; continuing with local seeds only.');
    console.warn(error instanceof Error ? error.message : error);
    return [];
  }
}

const ANALYST_SYSTEM = `You are a senior word-puzzle editor designing a style guide for a new mode called Crossed Signals.

Crossed Signals rules:
- 4 row signals and 4 column signals.
- 16 unique single-word answers.
- Each answer belongs at the intersection of one row meaning and one column meaning.
- The fun comes from semantic double-fit, near-misses, and row/column constraint solving.
- Difficulty labels should be easy, medium, hard, expert, not numeric 1-5.

Produce construction technique only. Do not copy example content.`;

function analystPrompt(params: {
  seeds: CrossedSignalsPuzzle[];
  nytPrinciples: any | null;
  nytSamples: NytPuzzle[];
}) {
  const seedText = params.seeds.map((p, i) => `Seed ${i + 1}\n${formatCrossedPuzzle(p)}`).join('\n\n');
  const nytPrinciples = params.nytPrinciples
    ? JSON.stringify({
      category_archetypes: params.nytPrinciples.category_archetypes,
      difficulty_ladder: params.nytPrinciples.difficulty_ladder,
      trap_techniques: params.nytPrinciples.trap_techniques,
      purple_tricks: params.nytPrinciples.purple_tricks,
      word_selection_rules: params.nytPrinciples.word_selection_rules,
      anti_patterns: params.nytPrinciples.anti_patterns,
      construction_checklist: params.nytPrinciples.construction_checklist,
    }, null, 1)
    : 'Not available.';
  const nytSamples = params.nytSamples.map(p =>
    p.categories.map(c => `${(c.colour ?? '?').toUpperCase()}: ${c.name} = [${c.words.join(', ')}]`).join(' ; ')
  ).join('\n');

  return `Local Crossed Signals seeds:

${seedText}

NYT Connections style principles for association craft:
${nytPrinciples}

Optional NYT sample boards for quality calibration only:
${nytSamples || 'No archive samples loaded.'}

Return ONLY valid JSON:
{
  "mode_summary": "one paragraph",
  "difficulty_ladder": {
    "easy": "what makes an easy Crossed Signals puzzle",
    "medium": "...",
    "hard": "...",
    "expert": "..."
  },
  "row_signal_patterns": [
    { "id": "kebab-name", "description": "pattern for row clues", "best_for": "easy|medium|hard|expert" }
  ],
  "column_signal_patterns": [
    { "id": "kebab-name", "description": "pattern for column clues", "best_for": "easy|medium|hard|expert" }
  ],
  "intersection_patterns": [
    { "id": "kebab-name", "description": "how a single word can satisfy row + column", "example_shape": "abstract template, no copied examples" }
  ],
  "trap_techniques": [ "specific ways to create near-misses without making the answer ambiguous" ],
  "word_selection_rules": [ "rules for single-word answers, length, familiarity, proper nouns, repeated stems" ],
  "explanation_rules": [ "what every cell explanation must prove" ],
  "anti_patterns": [ "things to reject" ],
  "construction_checklist": [ "ordered steps to build one board" ],
  "judge_rubric": {
    "semantic_fit": "0-10 grading notes",
    "constraint_quality": "0-10 grading notes",
    "trap_fairness": "0-10 grading notes",
    "difficulty_fit": "0-10 grading notes",
    "originality": "0-10 grading notes"
  }
}

Aim for practical detail a generator can follow. No commentary outside JSON.`;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const nytPrinciples = existsSync(NYT_PRINCIPLES_PATH)
    ? JSON.parse(readFileSync(NYT_PRINCIPLES_PATH, 'utf8'))
    : null;
  const nytSamples = await loadNytSamples();

  const boardSignatures = CROSSED_SIGNALS_SEED_PUZZLES.map(boardSignature);
  const rowAxisSignatures = CROSSED_SIGNALS_SEED_PUZZLES.map(p => axisSignature(p.rows.map(row => row.label)));
  const columnAxisSignatures = CROSSED_SIGNALS_SEED_PUZZLES.map(p => axisSignature(p.columns.map(column => column.label)));
  const wordSignatures = CROSSED_SIGNALS_SEED_PUZZLES.map(p =>
    axisSignature(p.cells.map(cell => cell.word)),
  );

  writeFileSync(INDEX_PATH, JSON.stringify({
    built_at: new Date().toISOString(),
    seed_count: CROSSED_SIGNALS_SEED_PUZZLES.length,
    board_signatures: boardSignatures,
    row_axis_signatures: rowAxisSignatures,
    column_axis_signatures: columnAxisSignatures,
    word_signatures: wordSignatures,
  }, null, 2));

  console.log(`Analysing ${CROSSED_SIGNALS_SEED_PUZZLES.length} local seeds and ${nytSamples.length} NYT calibration samples with ${ANALYSIS_MODEL}...`);
  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 8000,
    system: ANALYST_SYSTEM,
    messages: [{ role: 'user', content: analystPrompt({ seeds: CROSSED_SIGNALS_SEED_PUZZLES, nytPrinciples, nytSamples }) }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON in analysis response:\n', text);
    process.exit(1);
  }

  const style = JSON.parse(jsonMatch[0]);
  writeFileSync(STYLE_PATH, JSON.stringify({
    generated_at: new Date().toISOString(),
    model: ANALYSIS_MODEL,
    seed_count: CROSSED_SIGNALS_SEED_PUZZLES.length,
    nyt_sample_count: nytSamples.length,
    used_nyt_principles: !!nytPrinciples,
    ...style,
  }, null, 2));

  console.log(`Style guide -> ${STYLE_PATH}`);
  console.log(`Originality index -> ${INDEX_PATH}`);
  console.log('Next: npx ts-node scripts/generate_crossed_signals_puzzles.ts --count=20 --difficulty=medium');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
