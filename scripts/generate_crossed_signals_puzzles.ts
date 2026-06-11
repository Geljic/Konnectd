/**
 * Crossed Signals generator: GENERATE -> VALIDATE -> JUDGE -> WRITE OFFLINE PACK.
 *
 * Run after scripts/learn_crossed_signals_style.ts:
 *   npx ts-node scripts/generate_crossed_signals_puzzles.ts --count=20 --difficulty=medium --min-score=7.5
 *
 * Outputs:
 *   src/data/crossedSignalsGeneratedPuzzles.ts
 *   scripts/data/crossed_signals_candidates.json
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *
 * Env optional:
 *   GEN_MODEL               (default: claude-sonnet-4-6)
 *   JUDGE_MODEL             (default: claude-sonnet-4-6)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  CROSSED_SIGNALS_PUZZLES,
  type CrossedSignalsDifficulty,
  type CrossedSignalsPuzzle,
} from '../src/data/crossedSignalsPuzzles';

type DifficultyLabel = 'easy' | 'medium' | 'hard' | 'expert' | 'mixed';

const arg = (name: string, def: string) =>
  process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;

const COUNT = parseInt(arg('count', '10'), 10);
const REQUESTED_DIFFICULTY = arg('difficulty', 'mixed') as DifficultyLabel;
const MIN_SCORE = parseFloat(arg('min-score', '7.5'));
const GEN_MODEL = process.env.GEN_MODEL ?? 'claude-sonnet-4-6';
const JUDGE_MODEL = process.env.JUDGE_MODEL ?? 'claude-sonnet-4-6';

const DATA_DIR = join(__dirname, 'data');
const STYLE_PATH = join(DATA_DIR, 'crossed_signals_style.json');
const INDEX_PATH = join(DATA_DIR, 'crossed_signals_index.json');
const CANDIDATES_PATH = join(DATA_DIR, 'crossed_signals_candidates.json');
const GENERATED_MODULE_PATH = join(__dirname, '..', 'src', 'data', 'crossedSignalsGeneratedPuzzles.ts');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DIFFICULTY_LABELS: Exclude<DifficultyLabel, 'mixed'>[] = ['easy', 'medium', 'hard', 'expert'];
const ALL_DIFFICULTY_LABELS: DifficultyLabel[] = [...DIFFICULTY_LABELS, 'mixed'];
const DIFFICULTY_TO_NUMBER: Record<Exclude<DifficultyLabel, 'mixed'>, CrossedSignalsDifficulty> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};

interface GenAxis {
  id: string;
  label: string;
}

interface GenCell {
  rowId: string;
  columnId: string;
  word: string;
  explanation: string;
}

interface GenPuzzle {
  title: string;
  difficulty: Exclude<DifficultyLabel, 'mixed'>;
  rows: [GenAxis, GenAxis, GenAxis, GenAxis];
  columns: [GenAxis, GenAxis, GenAxis, GenAxis];
  cells: GenCell[];
  editor_notes?: string;
}

interface Judgement {
  semantic_fit: number;
  constraint_quality: number;
  trap_fairness: number;
  difficulty_fit: number;
  originality: number;
  overall: number;
  verdict: string;
  issues: string[];
}

interface SavedCandidate {
  puzzle: CrossedSignalsPuzzle;
  generated: GenPuzzle;
  judgement: Judgement;
}

function normalise(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'puzzle';
}

function axisId(label: string, fallback: string) {
  return slug(label) || fallback;
}

function boardSignature(puzzle: Pick<CrossedSignalsPuzzle, 'rows' | 'columns' | 'cells'>): string {
  const rows = puzzle.rows.map(row => normalise(row.label)).sort().join('|');
  const columns = puzzle.columns.map(column => normalise(column.label)).sort().join('|');
  const words = puzzle.cells.map(cell => normalise(cell.word)).sort().join('|');
  return createHash('sha1').update(`${rows}::${columns}::${words}`).digest('hex').slice(0, 16);
}

function wordSignature(words: string[]) {
  return createHash('sha1').update(words.map(normalise).sort().join('|')).digest('hex').slice(0, 16);
}

function extractJson(text: string): any | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function difficultyForAttempt(attempt: number): Exclude<DifficultyLabel, 'mixed'> {
  if (REQUESTED_DIFFICULTY !== 'mixed') return REQUESTED_DIFFICULTY as Exclude<DifficultyLabel, 'mixed'>;
  return DIFFICULTY_LABELS[attempt % DIFFICULTY_LABELS.length];
}

function assertValidArgs() {
  if (!ALL_DIFFICULTY_LABELS.includes(REQUESTED_DIFFICULTY)) {
    console.error(`Invalid --difficulty="${REQUESTED_DIFFICULTY}". Use easy, medium, hard, expert, or mixed.`);
    process.exit(1);
  }
  if (!Number.isFinite(COUNT) || COUNT < 1) {
    console.error('--count must be a positive number.');
    process.exit(1);
  }
  if (!Number.isFinite(MIN_SCORE) || MIN_SCORE < 0 || MIN_SCORE > 10) {
    console.error('--min-score must be between 0 and 10.');
    process.exit(1);
  }
}

function loadStyleAndIndex() {
  if (!existsSync(STYLE_PATH) || !existsSync(INDEX_PATH)) {
    console.error('Missing Crossed Signals style guide/index. Run scripts/learn_crossed_signals_style.ts first.');
    process.exit(1);
  }
  return {
    style: JSON.parse(readFileSync(STYLE_PATH, 'utf8')),
    index: JSON.parse(readFileSync(INDEX_PATH, 'utf8')),
  };
}

function buildSystemPrompt(style: any) {
  return `You are an expert word-puzzle constructor creating ORIGINAL Crossed Signals puzzles.

Crossed Signals rules:
- Exactly 4 row signals and exactly 4 column signals.
- Exactly 16 unique answers.
- Every answer must be a SINGLE WORD in uppercase.
- Each answer must fit BOTH its row signal and its column signal.
- Every cell must include a concise explanation proving both fits.
- The grid must be fair: no answer should be better suited to a different intersection.
- Use mixed signal styles: some direct labels, some phrase clues, harder puzzles may use more cryptic/lateral clue wording.

Learned style guide:
${JSON.stringify({
    mode_summary: style.mode_summary,
    difficulty_ladder: style.difficulty_ladder,
    row_signal_patterns: style.row_signal_patterns,
    column_signal_patterns: style.column_signal_patterns,
    intersection_patterns: style.intersection_patterns,
    trap_techniques: style.trap_techniques,
    word_selection_rules: style.word_selection_rules,
    explanation_rules: style.explanation_rules,
    anti_patterns: style.anti_patterns,
    construction_checklist: style.construction_checklist,
  }, null, 1)}

Hard rejection rules:
- No phrases.
- No duplicate words.
- No obscure trivia-only answers.
- No proper nouns unless extremely common.
- No row/column labels that are synonyms of each other.
- No repeated answer stem like LOCK/LOCKED/LOCKER.`;
}

function buildUserPrompt(difficulty: Exclude<DifficultyLabel, 'mixed'>) {
  return `Create ONE brand-new Crossed Signals puzzle at difficulty "${difficulty}".

Difficulty intent:
- easy: literal/familiar intersections, many anchors.
- medium: clear but lateral, a few near-misses.
- hard: abstract rows/columns, stronger traps, fewer immediate anchors.
- expert: cryptic/lateral signals, very fair explanations, still single-word and solvable.

Return ONLY valid JSON:
{
  "title": "Short puzzle title",
  "difficulty": "${difficulty}",
  "rows": [
    { "id": "short_snake_id", "label": "Row signal" },
    { "id": "short_snake_id", "label": "Row signal" },
    { "id": "short_snake_id", "label": "Row signal" },
    { "id": "short_snake_id", "label": "Row signal" }
  ],
  "columns": [
    { "id": "short_snake_id", "label": "Column signal" },
    { "id": "short_snake_id", "label": "Column signal" },
    { "id": "short_snake_id", "label": "Column signal" },
    { "id": "short_snake_id", "label": "Column signal" }
  ],
  "cells": [
    { "rowId": "row_id", "columnId": "column_id", "word": "WORD", "explanation": "WORD fits row because ... and column because ..." }
  ],
  "editor_notes": "Why this puzzle is fun and fair"
}

The cells array must contain exactly every row/column intersection once, in row-major order.`;
}

function validateGenerated(puzzle: GenPuzzle): string[] {
  const errors: string[] = [];
  if (!puzzle?.title?.trim()) errors.push('missing title');
  if (!DIFFICULTY_LABELS.some(label => label === puzzle?.difficulty)) errors.push('invalid difficulty');
  if (!Array.isArray(puzzle?.rows) || puzzle.rows.length !== 4) errors.push('must have 4 rows');
  if (!Array.isArray(puzzle?.columns) || puzzle.columns.length !== 4) errors.push('must have 4 columns');
  if (!Array.isArray(puzzle?.cells) || puzzle.cells.length !== 16) errors.push('must have 16 cells');

  const rowIds = new Set((puzzle.rows ?? []).map(row => row.id));
  const columnIds = new Set((puzzle.columns ?? []).map(column => column.id));
  if (rowIds.size !== 4) errors.push('row ids must be unique');
  if (columnIds.size !== 4) errors.push('column ids must be unique');

  const words = (puzzle.cells ?? []).map(cell => normalise(cell.word));
  if (new Set(words).size !== words.length) errors.push('words must be unique');
  for (const word of words) {
    if (!/^[A-Z]+$/.test(word)) errors.push(`word must be a single uppercase word: ${word}`);
    if (word.length < 2 || word.length > 12) errors.push(`word length looks bad: ${word}`);
  }

  const seenIntersections = new Set<string>();
  for (const cell of puzzle.cells ?? []) {
    if (!rowIds.has(cell.rowId)) errors.push(`cell has unknown rowId: ${cell.rowId}`);
    if (!columnIds.has(cell.columnId)) errors.push(`cell has unknown columnId: ${cell.columnId}`);
    const key = `${cell.rowId}/${cell.columnId}`;
    if (seenIntersections.has(key)) errors.push(`duplicate intersection: ${key}`);
    seenIntersections.add(key);
    if (!cell.explanation?.trim()) errors.push(`missing explanation for ${cell.word}`);
    if (cell.explanation && cell.explanation.length < 24) errors.push(`weak explanation for ${cell.word}`);
  }
  for (const row of puzzle.rows ?? []) {
    for (const column of puzzle.columns ?? []) {
      if (!seenIntersections.has(`${row.id}/${column.id}`)) {
        errors.push(`missing intersection: ${row.id}/${column.id}`);
      }
    }
  }

  return errors;
}

function originalityViolation(puzzle: GenPuzzle, index: any, accepted: CrossedSignalsPuzzle[]): string | null {
  const candidate = toAppPuzzle(puzzle, 'tmp');
  const sig = boardSignature(candidate);
  const existingSigs = new Set([
    ...(index.board_signatures ?? []),
    ...CROSSED_SIGNALS_PUZZLES.map(boardSignature),
    ...accepted.map(boardSignature),
  ]);
  if (existingSigs.has(sig)) return 'board duplicates an existing Crossed Signals puzzle';

  const words = candidate.cells.map(cell => cell.word);
  const wordSig = wordSignature(words);
  const wordSigs = new Set([
    ...(index.word_signatures ?? []),
    ...CROSSED_SIGNALS_PUZZLES.map(p => wordSignature(p.cells.map(cell => cell.word))),
    ...accepted.map(p => wordSignature(p.cells.map(cell => cell.word))),
  ]);
  if (wordSigs.has(wordSig)) return 'word set duplicates an existing puzzle';

  return null;
}

function toAppPuzzle(puzzle: GenPuzzle, id: string): CrossedSignalsPuzzle {
  const rowIdMap = new Map<string, string>();
  const columnIdMap = new Map<string, string>();
  const rows = puzzle.rows.map((row, index) => {
    const id = axisId(row.id || row.label, `row_${index + 1}`);
    rowIdMap.set(row.id, id);
    return { id, label: row.label.trim() };
  });
  const columns = puzzle.columns.map((column, index) => {
    const id = axisId(column.id || column.label, `column_${index + 1}`);
    columnIdMap.set(column.id, id);
    return { id, label: column.label.trim() };
  });

  return {
    id,
    title: puzzle.title.trim(),
    difficulty: DIFFICULTY_TO_NUMBER[puzzle.difficulty],
    rows,
    columns,
    cells: puzzle.cells.map(cell => ({
      rowId: rowIdMap.get(cell.rowId) ?? axisId(cell.rowId, 'row'),
      columnId: columnIdMap.get(cell.columnId) ?? axisId(cell.columnId, 'column'),
      word: normalise(cell.word),
      explanation: cell.explanation.trim(),
    })),
  };
}

const JUDGE_SYSTEM = `You are a ruthless Crossed Signals editor. Grade the puzzle 0-10 per axis.
Reject loose intersections, real ambiguity, phrase answers, obscure trivia, weak explanations, and fake cleverness.
A score of 7.5+ should mean worth playtesting.`;

async function judge(puzzle: GenPuzzle): Promise<Judgement | null> {
  const response = await client.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 1400,
    system: JUDGE_SYSTEM,
    messages: [{
      role: 'user',
      content: `Judge this Crossed Signals puzzle:
${JSON.stringify(puzzle, null, 2)}

Return ONLY JSON:
{
  "semantic_fit": 0-10,
  "constraint_quality": 0-10,
  "trap_fairness": 0-10,
  "difficulty_fit": 0-10,
  "originality": 0-10,
  "overall": 0-10,
  "verdict": "one sentence",
  "issues": ["..."]
}`,
    }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return extractJson(text) as Judgement | null;
}

async function generate(system: string, difficulty: Exclude<DifficultyLabel, 'mixed'>): Promise<GenPuzzle | null> {
  const response = await client.messages.create({
    model: GEN_MODEL,
    max_tokens: 2200,
    system,
    messages: [{ role: 'user', content: buildUserPrompt(difficulty) }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return extractJson(text) as GenPuzzle | null;
}

function renderGeneratedModule(candidates: SavedCandidate[]) {
  const puzzles = candidates.map(candidate => candidate.puzzle);
  return `import type { CrossedSignalsPuzzle } from './crossedSignalsPuzzles';

// Generated by scripts/generate_crossed_signals_puzzles.ts.
// Review before publishing or migrating to PocketBase.
export const CROSSED_SIGNALS_GENERATED_PUZZLES: CrossedSignalsPuzzle[] = ${JSON.stringify(puzzles, null, 2)};
`;
}

function loadExistingCandidates(): SavedCandidate[] {
  if (!existsSync(CANDIDATES_PATH)) return [];
  try {
    return JSON.parse(readFileSync(CANDIDATES_PATH, 'utf8')) as SavedCandidate[];
  } catch {
    return [];
  }
}

function saveCandidates(candidates: SavedCandidate[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CANDIDATES_PATH, JSON.stringify(candidates, null, 2));
  writeFileSync(GENERATED_MODULE_PATH, renderGeneratedModule(candidates));
}

async function main() {
  assertValidArgs();
  const { style, index } = loadStyleAndIndex();
  const system = buildSystemPrompt(style);
  const candidates = loadExistingCandidates();
  const accepted = candidates.map(candidate => candidate.puzzle);

  console.log(`Generating ${COUNT} Crossed Signals puzzle(s), difficulty=${REQUESTED_DIFFICULTY}, min-score=${MIN_SCORE}`);
  console.log(`Models: gen=${GEN_MODEL}, judge=${JUDGE_MODEL}`);

  let saved = 0;
  let attempts = 0;
  const maxAttempts = COUNT * 8;
  while (saved < COUNT && attempts < maxAttempts) {
    attempts++;
    const difficulty = difficultyForAttempt(attempts - 1);
    process.stdout.write(`[${attempts}] ${difficulty}... `);

    try {
      const generated = await generate(system, difficulty);
      if (!generated) {
        console.log('invalid JSON');
        continue;
      }

      const structuralErrors = validateGenerated(generated);
      if (structuralErrors.length > 0) {
        console.log(`structure rejected: ${structuralErrors.slice(0, 2).join('; ')}`);
        continue;
      }

      const overlap = originalityViolation(generated, index, accepted);
      if (overlap) {
        console.log(`originality rejected: ${overlap}`);
        continue;
      }

      const judgement = await judge(generated);
      if (!judgement) {
        console.log('judge failed');
        continue;
      }
      if (judgement.overall < MIN_SCORE) {
        console.log(`score ${judgement.overall} rejected: ${judgement.verdict}`);
        continue;
      }

      const id = `cs_gen_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${slug(generated.title)}_${candidates.length + 1}`;
      const puzzle = toAppPuzzle(generated, id);
      candidates.push({ puzzle, generated, judgement });
      accepted.push(puzzle);
      saveCandidates(candidates);
      saved++;
      console.log(`saved (${saved}/${COUNT}) score ${judgement.overall}: ${generated.title}`);
    } catch (error) {
      console.log(error instanceof Error ? error.message : error);
    }

    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  console.log(`\nDone. Saved ${saved} new puzzle(s) from ${attempts} attempt(s).`);
  console.log(`Candidate log -> ${CANDIDATES_PATH}`);
  console.log(`App data -> ${GENERATED_MODULE_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
