/**
 * Local-only audit for existing Crossed Signals puzzles.
 *
 * Run:
 *   npx ts-node scripts/audit_crossed_signals_puzzles.ts [--only-fail]
 *
 * This script deliberately makes no network calls and does not require credentials.
 * It checks structural integrity and local authoring-risk heuristics, then writes:
 *   scripts/data/crossed_signals_audit.json
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CROSSED_SIGNALS_GENERATED_PUZZLES } from '../src/data/crossedSignalsGeneratedPuzzles';
import type { CrossedSignalsPuzzle } from '../src/data/crossedSignalsPuzzles';

const ONLY_FAIL = process.argv.includes('--only-fail');
const OUT_PATH = join(__dirname, 'data', 'crossed_signals_audit.json');

interface AuditResult {
  id: string;
  title: string;
  difficulty: number;
  status: 'pass' | 'review' | 'fail';
  errors: string[];
  warnings: string[];
  notes: string[];
  rowLabels: string[];
  columnLabels: string[];
  words: string[];
}

const MANUAL_REVIEW_NOTES: Record<string, string> = {
  cs_gen_024_run_fall_break: 'Manual review passed: each verb has a distinct canonical reading across Time, Body, Tech, and Nature.',
  cs_gen_039_current_words: 'Manual review passed: current, charge, flow, and resistance are separable across the four domains.',
  cs_gen_045_line_words: 'Manual review passed: each action has a clear domain-specific answer and no obvious cell swap improves the grid.',
  cs_gen_048_shadow_words: 'Manual review passed: intentionally harder polysemy grid; row verbs separate cleanly by column domain.',
  cs_gen_050_final_signal: 'Manual review passed after Software column rebuild; each row/column pair has a single canonical answer.',
};

function normalise(value: string) {
  return value.trim().toLowerCase();
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach(value => {
    const key = normalise(value);
    if (seen.has(key)) duplicates.add(value);
    seen.add(key);
  });
  return [...duplicates];
}

function getCellWords(puzzle: CrossedSignalsPuzzle, rowId: string, columnId: string) {
  return puzzle.cells
    .filter(cell => cell.rowId === rowId && cell.columnId === columnId)
    .map(cell => cell.word.trim().toUpperCase());
}

function auditPuzzle(puzzle: CrossedSignalsPuzzle): AuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const notes = MANUAL_REVIEW_NOTES[puzzle.id] ? [MANUAL_REVIEW_NOTES[puzzle.id]] : [];
  const rowLabels = puzzle.rows.map(row => row.label);
  const columnLabels = puzzle.columns.map(column => column.label);
  const words = puzzle.cells.map(cell => cell.word.trim().toUpperCase());

  if (puzzle.rows.length !== 4) errors.push(`Expected 4 row signals, found ${puzzle.rows.length}.`);
  if (puzzle.columns.length !== 4) errors.push(`Expected 4 column signals, found ${puzzle.columns.length}.`);
  if (puzzle.cells.length !== 16) errors.push(`Expected 16 cells, found ${puzzle.cells.length}.`);

  const duplicateRowIds = duplicateValues(puzzle.rows.map(row => row.id));
  const duplicateColumnIds = duplicateValues(puzzle.columns.map(column => column.id));
  const duplicateRowLabels = duplicateValues(rowLabels);
  const duplicateColumnLabels = duplicateValues(columnLabels);
  const duplicateWords = duplicateValues(words);

  if (duplicateRowIds.length) errors.push(`Duplicate row ids: ${duplicateRowIds.join(', ')}.`);
  if (duplicateColumnIds.length) errors.push(`Duplicate column ids: ${duplicateColumnIds.join(', ')}.`);
  if (duplicateRowLabels.length) errors.push(`Duplicate row labels: ${duplicateRowLabels.join(', ')}.`);
  if (duplicateColumnLabels.length) errors.push(`Duplicate column labels: ${duplicateColumnLabels.join(', ')}.`);
  if (duplicateWords.length) errors.push(`Duplicate words: ${duplicateWords.join(', ')}.`);

  const rowIds = new Set(puzzle.rows.map(row => row.id));
  const columnIds = new Set(puzzle.columns.map(column => column.id));

  puzzle.cells.forEach(cell => {
    const word = cell.word.trim();
    if (!word) errors.push('Found an empty word.');
    if (word !== word.toUpperCase()) warnings.push(`${word} is not uppercase.`);
    if (/\s/.test(word)) errors.push(`${word} contains whitespace; Crossed Signals cells must be single words.`);
    if (!rowIds.has(cell.rowId)) errors.push(`${word} references unknown row id ${cell.rowId}.`);
    if (!columnIds.has(cell.columnId)) errors.push(`${word} references unknown column id ${cell.columnId}.`);
  });

  puzzle.rows.forEach(row => {
    const rowWords = puzzle.cells.filter(cell => cell.rowId === row.id).map(cell => cell.word);
    if (rowWords.length !== 4) errors.push(`Row "${row.label}" has ${rowWords.length} cells.`);
  });

  puzzle.columns.forEach(column => {
    const columnWords = puzzle.cells.filter(cell => cell.columnId === column.id).map(cell => cell.word);
    if (columnWords.length !== 4) errors.push(`Column "${column.label}" has ${columnWords.length} cells.`);
  });

  puzzle.rows.forEach(row => {
    puzzle.columns.forEach(column => {
      const cellWords = getCellWords(puzzle, row.id, column.id);
      if (cellWords.length !== 1) {
        errors.push(`Intersection "${row.label}" x "${column.label}" has ${cellWords.length} cells.`);
      }
    });
  });

  const hasStartsWithAxis = [...rowLabels, ...columnLabels].some(label => /^starts with\b/i.test(label));
  if (hasStartsWithAxis) errors.push('Uses "Starts with" as an axis; this is too easy for Crossed Signals.');

  const canRows = rowLabels.filter(label => /^can\b/i.test(label)).length;
  const hasRows = rowLabels.filter(label => /^has\b/i.test(label)).length;
  if ((canRows >= 3 || hasRows >= 3) && !MANUAL_REVIEW_NOTES[puzzle.id]) {
    warnings.push('Predicate-heavy row set; manually confirm the verbs/properties separate cleanly.');
  }

  const longWords = words.filter(word => word.length > 12);
  if (longWords.length) warnings.push(`Very long words may need tile fitting review: ${longWords.join(', ')}.`);

  const status: AuditResult['status'] =
    errors.length > 0 ? 'fail' :
    warnings.length > 0 ? 'review' :
    'pass';

  return {
    id: puzzle.id,
    title: puzzle.title,
    difficulty: puzzle.difficulty,
    status,
    errors,
    warnings,
    notes,
    rowLabels,
    columnLabels,
    words,
  };
}

function main() {
  const results = CROSSED_SIGNALS_GENERATED_PUZZLES.map(auditPuzzle);
  results.sort((a, b) => {
    const rank = { fail: 0, review: 1, pass: 2 };
    return rank[a.status] - rank[b.status] || a.difficulty - b.difficulty || a.title.localeCompare(b.title);
  });

  console.log(`Auditing ${results.length} generated Crossed Signals puzzles locally.\n`);

  results.forEach(result => {
    if (ONLY_FAIL && result.status === 'pass') return;
    const label = result.status === 'fail' ? 'FAIL' : result.status === 'review' ? 'REVIEW' : 'PASS';
    console.log(`${label}  ${result.title} (${result.id})`);
    result.errors.forEach(error => console.log(`  - ${error}`));
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
    result.notes.forEach(note => console.log(`  - ${note}`));
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('  Structure is clean.');
    }
    console.log('');
  });

  const failed = results.filter(result => result.status === 'fail').length;
  const review = results.filter(result => result.status === 'review').length;
  const passed = results.filter(result => result.status === 'pass').length;
  console.log(`Summary: ${failed} failed, ${review} need manual review, ${passed} passed.`);

  mkdirSync(join(__dirname, 'data'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`Full results -> ${OUT_PATH}`);
}

main();
