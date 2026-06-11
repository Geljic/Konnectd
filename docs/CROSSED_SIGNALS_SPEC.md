# Konnectd: Crossed Signals

_Working spec — June 2026_

## Implementation Status

First playable local slice is built:

- `src/data/crossedSignalsPuzzles.ts`
- `src/utils/crossedSignals.ts`
- `src/screens/CrossedSignalsGameScreen.tsx`
- `src/screens/CrossedSignalsSelectScreen.tsx`
- Home selector integration
- Stats tab integration
- Navigation routes

Still pending:

- Physical-device QA
- TypeScript check in an environment with Node/npm
- More puzzle content and playtesting for ambiguity/fairness
- Remote play-session support if we want leaderboards/friend challenges
- Dedicated result/review modal with row/column solution reveal
- Drop-target hover polish for drag-and-drop

## Positioning

Crossed Signals is Konnectd's tense semantic-deduction mode.

Tagline:

> Decode the grid where every word has two meanings.

It should feel adjacent to the social tension of Codenames, but not play like Codenames. The player is not guessing agents from a clue. They are reconstructing a 4x4 signal grid where every word belongs at the intersection of one row meaning and one column meaning.

## Prior-Art Notes

Nearby mechanics:

- Codenames: word association, hidden danger, one-word clue + number, team guessing.
- Nonograms/Kakuro: row/column constraints, deduction, grid logic.
- Semantle: semantic proximity, but open-ended word guessing.
- Clues by Sam: grid deduction with natural-language clues and progressive clue reveals.

Differentiation:

- No spymaster, agents, assassin, teams, or clue-number turns.
- No pure grouping or ordering.
- No open-ended word entry.
- The core move is placing a word at the crossing of two semantic signals.

## Core Loop

1. Player sees a 4x4 grid with 4 row signals and 4 column signals.
2. Sixteen word tiles are scrambled below/on the grid.
3. Player swaps/taps tiles into positions.
4. Player may spend limited scans to check one tile.
5. Player submits the board.
6. If the board is incorrect, Noise increases.
7. At 4 Noise, the signal collapses and the puzzle is lost.
8. Win when all 16 intersections are correct.

## Example Puzzle

Rows:

- Can be cracked
- Found in court
- Has a shell
- Can be streamed

Columns:

- Food
- Technology
- Sport
- Nature

Possible answers:

- `EGG` = can be cracked + food
- `PASSWORD` = can be cracked + technology
- `TENNIS` = found in court + sport
- `RIVER` = can be streamed + nature

## Interaction Model

Current v1:

- Tap a tile, tap a grid cell to swap/place.
- Filled cells can be tapped and swapped.
- Drag a tile toward another cell to swap it on native mobile, with lift/snap animation.
- Drag is disabled on web for now; web uses tap-select/tap-swap.
- Moved-word markers follow words that have already been swapped.
- Long-press a tile to lock/unlock that single tile.
- Tap a row clue or column clue to mark that line as `Ready`.
- Submit checks all `Ready` rows/columns before doing a full-board submit.
- Correct `Ready` lines become `Solved`, use the four Konnectd category colours, and stay fixed.
- Incorrect `Ready` lines stay editable, report their `x/4` correctness, and add Noise.
- Shuffle only moves tiles outside locked tiles and solved rows/columns.
- Scan arms a "tap any tile" mode if no tile is selected, or scans the selected tile immediately.
- Scan leaves visible text guidance for the scanned tile.
- Wrong submits leave visible `x/16 correct` guidance until the board changes.
- Failed games reveal the board with correct and incorrect tile borders.
- Submit validates the full board.

Keep tap-to-swap as the fallback. Drag should feel better on touch devices, but tap remains more accessible and more predictable for small screens.

## Risk System

### Noise

- Starts at 0.
- Wrong full-board submit: +1 Noise.
- 4 Noise = loss.
- Noise replaces "mistakes" in UI copy but can reuse the mistake indicator component visually.

### Scans

Each puzzle starts with 3 scans.

When scanning a tile in a cell, reveal one of:

- `Locked`: correct row and correct column.
- `Row`: correct row, wrong column.
- `Column`: correct column, wrong row.
- `Static`: neither row nor column.

Scans should cost score, not Noise.

## Scoring

Base:

- +1600 for solve.
- -150 per Noise.
- -100 per Scan.
- Time bonus: `max(50, 400 - floor(seconds / 8))`.
- Perfect bonus: +250 for 0 Noise and 0 Scans.

This keeps the mode comparable to Groups scoring without pretending the solving logic is identical.

## Puzzle Schema

```ts
export interface CrossedSignalsPuzzle {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  rows: SignalAxis[];
  columns: SignalAxis[];
  cells: CrossedSignalsCell[];
}

export interface SignalAxis {
  id: string;
  label: string;
}

export interface CrossedSignalsCell {
  rowId: string;
  columnId: string;
  word: string;
  explanation?: string;
}
```

Validation:

- Exactly 4 rows.
- Exactly 4 columns.
- Exactly 16 cells.
- Every row/column intersection has exactly one cell.
- All visible words are unique.
- Every word should plausibly satisfy both signals.
- Each puzzle should have at least 4 intentional ambiguity points.

## Content Guidelines

Good signals:

- Concrete enough to be fair.
- Broad enough to create overlap.
- Short enough for mobile labels.

Avoid:

- obscure trivia-only intersections
- phrase-only answers unless the phrase is common
- intersections that require one exact cultural assumption
- row/column labels that are synonyms of each other

Difficulty knobs:

- More ambiguous words.
- More abstract row/column signals.
- More near-fit decoys.
- Less literal intersections.
- Fewer obvious anchors.

## Generation Pipeline

Crossed Signals now mirrors the Connections puzzle pipeline:

- `scripts/learn_crossed_signals_style.ts` distils construction guidance from local hand-written Crossed Signals seeds, optional NYT Connections style principles, and optional NYT archive samples used only for association-quality calibration.
- `scripts/generate_crossed_signals_puzzles.ts` calls the LLM, validates the 4x4 structure, requires single-word answers and per-cell explanations, judges puzzle quality, rejects duplicates, and writes accepted candidates offline.
- Accepted candidates are written to `src/data/crossedSignalsGeneratedPuzzles.ts`, which is imported by `src/data/crossedSignalsPuzzles.ts`, so they automatically appear in freeplay and daily rotation.
- Candidate metadata and judge notes are also written to `scripts/data/crossed_signals_candidates.json` for review before PocketBase migration.

Recommended generation loop:

```sh
npx ts-node scripts/learn_crossed_signals_style.ts
npx ts-node scripts/generate_crossed_signals_puzzles.ts --count=20 --difficulty=mixed --min-score=7.5
```

Keep generated puzzles as review candidates until playtested. Difficulty labels should be treated as `easy`, `medium`, `hard`, and `expert`; the current app still stores them as numeric values for compatibility.

## UI Direction

Use Konnectd design language:

- Same app background and tile style.
- Same header/timer rhythm.
- Same bottom controls: Shuffle, Scan, Submit.
- Same result modal structure.
- Noise indicators use the existing mistake row style.
- Row and column signals should look like compact clue rails, not cards inside cards.

Mobile layout:

- Column signals across the top, each aligned to one grid column.
- Row signals down the left or as abbreviated pills beside each row.
- 4x4 tile grid occupies the same visual weight as Groups.
- Tap a row/column clue to highlight its line.

## Game Mode Registry Plan

Before adding Crossed Signals broadly, introduce a registry so new modes are not hand-wired everywhere.

```ts
export const GAME_MODES = {
  connections: {
    id: 'connections',
    label: 'Groups',
    accent: 'tileStrip',
    routes: { daily: 'Game', freeplay: 'PuzzleSelect' },
    rulesets: ['normal', 'hard'],
  },
  word_trails: {
    id: 'word_trails',
    label: 'Next Steps',
    accent: 'blue',
    routes: { daily: 'WordlinesGame', freeplay: 'WordlinesSelect' },
    rulesets: ['classic'],
  },
  crossed_signals: {
    id: 'crossed_signals',
    label: 'Crossed Signals',
    accent: 'purple',
    routes: { daily: 'CrossedSignalsGame', freeplay: 'CrossedSignalsSelect' },
    rulesets: ['classic'],
  },
} as const;
```

Affected surfaces should read from this registry:

- Home game selector.
- Stats game tabs.
- Leaderboard tabs.
- Friend match history mode pills.
- Challenge inbox labels.
- Result/share labels.
- Launch roadmap/status docs.

## Build Plan

### Phase 1 — Registry Foundation

- ✅ Add `crossed_signals` as a known game id.
- ✅ Add labels/ruleset normalization.
- 🚧 Deeper registry/adapters still needed before the next new mode.
- 🚧 Update all mode-aware surfaces to read from registry where practical.

### Phase 2 — Local MVP

- ✅ Add `src/data/crossedSignalsPuzzles.ts`.
- ✅ Add `src/utils/crossedSignals.ts` with validation, daily selection, result storage, scoring.
- ✅ Add `src/screens/CrossedSignalsGameScreen.tsx`.
- ✅ Add `src/screens/CrossedSignalsSelectScreen.tsx`.
- ✅ Use local AsyncStorage completion first, matching current Next Steps approach.

### Phase 3 — UI Polish

- ✅ Match Konnectd colors/type/buttons.
- ✅ Add row/column clue rails.
- ✅ Add scan feedback labels.
- ✅ Add Noise indicators.
- ✅ Add share text.
- ✅ Add drag-to-swap with lift/snap animation.
- ✅ Disable drag on web due to poor pointer feel.
- ✅ Add moved-word markers.
- ✅ Add individual tile locks.
- ✅ Add row/column `Ready` submission and `Solved` line locks with category colours.
- 🚧 Add scan feedback animation.
- 🚧 Add active drop-target highlight while dragging.
- 🚧 Add dedicated result modal support for Crossed Signals solution review.

### Phase 4 — App Integration

- ✅ Add to Home selector.
- ✅ Add to Stats tabs.
- ✅ Add free-play archive.
- 🚧 Add play session `game_type = 'crossed_signals'` when remote stats are ready.
- 🚧 Add leaderboard tab once remote sessions exist.

### Phase 5 — Content and QA

- Create 25 hand-curated puzzles.
- Validate all puzzles with a schema checker.
- Playtest for ambiguity/fairness.
- Add 30-60 days of daily queue before launch if this becomes a flagship mode.

## Open Decisions

- Should wrong submits reveal count of correct tiles, or only add Noise?
- Should scans reveal row/column status as text or icons?
- Should Crossed Signals support friend challenges in v1, or post-launch?
- Should it replace Next Steps as the second Home card, or sit as a third card?

Current recommendation:

- Wrong submits only add Noise for tension.
- Scans reveal compact text: `Locked`, `Row`, `Column`, `Static`.
- Friend challenges post-launch.
- Keep Next Steps and add Crossed Signals as a third mode after registry work.
