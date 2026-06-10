# Next Steps — Puzzle Design Framework

_Established June 2026 after auditing the first 50 puzzles._

---

## The Core Problem: Theme Pollution

Next Steps puzzles break when all 16 words live in the same semantic domain (e.g. all space words, all music words, all sports words). This creates **grouping ambiguity** — the player cannot determine which words form a path because every word feels like it belongs to every path.

**The rule:** difficulty must come from ordering, never from grouping ambiguity.

A player should always be able to make progress on grouping. If they're stuck because they can't separate words at all — not because the order is hard — the puzzle is broken.

---

## The Two Constraints

Every Next Steps puzzle has two puzzles inside it:

1. **Grouping** — which 4 words form a path
2. **Ordering** — what sequence they go in

Grouping should always feel solvable (even if imperfect on first try). Ordering is where the real challenge lives.

---

## Difficulty Scaling

| Level | Grouping | Ordering | Example |
|---|---|---|---|
| **1 Easy** | 4 clearly different domains | Obvious — size, time, ABC, well-known process | SEED → ROOT → TREE → FOREST |
| **2 Medium** | 4 different domains | Less obvious — cause/effect, process steps | SYMPTOM → DOCTOR → TEST → DIAGNOSIS |
| **3 Hard** | Different domains + 1–2 deliberate cross-path bait words | Ordering requires real thought | COURT (legal) vs COURT (tennis) as bait |
| **4 Expert** | Domains are loosely related but paths are distinct | Multiple plausible orders; only one is right | DEMAND → PRICE → SUPPLY → SHORTAGE |
| **5 Master** | One anchor word (e.g. PITCH, WAVE, LINE) appears across all 4 paths in 4 different meanings | Ordering is subtle and non-obvious | PITCH: sound / camp / business / baseball |

---

## The Red Herring Technique (Level 3–4 difficulty lever)

Place words across paths that share a surface meaning but belong to different domains:

- SPARK in a creativity path: `IDEA → SPARK → INVENTION → PATENT`
- FLAME in a romance path: `GLANCE → FLAME → KISS → WEDDING`

The player sees SPARK and FLAME and wants to group them. They've correctly used domain intuition but been baited. The ordering constraint confirms which path each belongs to. This is **good hard** — the player can still make progress, they just have to think harder.

---

## The Level 5 Structure

All Level 5 puzzles should use the **anchor word** pattern: one word that means 4 completely different things, each path exploring one meaning.

Good anchor words found so far: PITCH, WAVE, LINE, KEY, CHANGE, ROOT, LIGHT, POINT, PAPER

Each path must be from a completely different domain. The paths should not share any supporting words.

---

## What Makes a Good Path

A path's ordering logic should be one of:

| Logic type | Example |
|---|---|
| **Size / scale** | SEED → TREE → FOREST → BIOME |
| **Time / sequence** | COUNTDOWN → LAUNCH → ORBIT → SPLASHDOWN |
| **Cause and effect** | MATCH → SPARK → FIRE → SMOKE |
| **Process steps** | FLOUR → DOUGH → BAKE → BREAD |
| **Hierarchy (small to large)** | ATOM → MOLECULE → CELL → TISSUE |
| **Story arc** | HERO → QUEST → TRIAL → RETURN |
| **Phrase / idiom** | SILVER → LINING → ... |

The ordering logic should be **unambiguous** — there should only be one defensible order. If you can argue for two orders, the path needs reworking.

---

## Validation Checklist

Before adding a puzzle, check each word against every *other* path:

- [ ] Could this word plausibly belong to a different path? If yes → either remove it or make the ordering constraint tighter
- [ ] Does any word appear thematically in more than one path's domain? If yes → replace one instance
- [ ] Is the ordering logic for each path clear and unambiguous?
- [ ] Are at least 3 of the 4 paths from clearly different domains?
- [ ] For Level 3+: is there at least one deliberate cross-path bait word?
- [ ] For Level 5: does each path use the anchor word's meaning in a completely different context?

---

## Known Broken Puzzles (first 50 — need path replacement)

These have theme pollution and should be fixed before featuring in daily rotation:

| ID | Title | Issue |
|---|---|---|
| wt-007 | School Day | All school words — PENCIL, BOOK, BELL, QUESTION overlap |
| wt-008 | Sports Basics | All sports — PASS, HIT, POINT, SERVE cross paths |
| wt-012 | Music Room | All music — NOTE, TRACK, CHORD, MIC swap freely |
| wt-013 | Weather Map | All weather — RAIN, CLOUD, FROST, WIND fit anywhere |
| wt-015 | Garden Work | All garden — SEED, ROOT, BEE, SOIL overlap |
| wt-017 | Hospital Route | All hospital — CAST, DOCTOR, TEST, WARD feel interchangeable |
| wt-019 | Ocean Logic | All ocean — WAVE, CURRENT, SAIL, MOON could go anywhere |
| wt-023 | Tech Stack | All tech — UPDATE, REQUEST, TOKEN, LOG swap freely |
| wt-024 | Science Lab | All science — HEAT, SAMPLE, ATOM, QUESTION fit multiple paths |
| wt-027 | Space Program | All space — original example that prompted this framework |

Fix strategy: keep the strongest single path per puzzle, replace the other 3 with unrelated domains.

---

## Puzzle Generation Prompt Guidance

When using Claude to generate new puzzles, include these constraints:

> Each of the 4 paths must come from a clearly different domain or topic area. No two paths should share the same theme. Every word in the puzzle must obviously belong to only one path — a player should never look at a word and think "that could be in path 2 or path 3". Difficulty comes entirely from the ordering within each path, not from ambiguity about which path a word belongs to. For levels 1–2, use completely unrelated domains. For levels 3–4, you may use loosely related domains if each path has a distinct ordering logic. For level 5, use one anchor word that means four different things across four different domains.

---

## External research corroboration (June 2026)

Reviewed adjacent puzzle genres; our framework holds up:

- **NYT Connections — red herrings.** Editor Wyna Liu deliberately plants words that *look* like they fit multiple groups but belong to one; the trick is overlap, not obscurity. This is exactly our **bait word** lever (Level 3–4). A useful construction test from Connections: _"if I remove these four, does it make the rest easier?"_ — a good path/group should clarify the remainder, not muddy it.
- **Word ladders — progression clarity.** The genre's rule is that each step changes *minimally and unambiguously*; if a step is arguable, the ladder is broken. Our equivalent: **each path must have exactly one defensible order.** Word-ladder lore also warns against reusing a word and against words that are too short/long — mirrors our "16 unique words" and readable-length rules.
- **Takeaway:** keep difficulty in the **ordering and the bait**, never in "which path does this even go in." Wide, recognisable domains (idiom, process, pop culture, science) keep it fresh.

Sources: [Connections red herrings](https://ladypuzzle.pro/connections-two-years-red-herrings) · [Word ladder best practices](https://www.sporcle.com/blog/2011/03/sporcle-word-ladders-best-practices/) · [Word ladder (Wikipedia)](https://en.wikipedia.org/wiki/Word_ladder)

---

## Authoring workflow (the "puzzle creator")

1. Write puzzles in `src/data/wordTrailsPuzzles.ts` (4 paths, distinct domains, ordered logic, bait at L3+).
2. `python3 scripts/validate_word_trails.py` — checks 4 trails × 4 words, 16 unique, valid difficulty/relation, unique ids (structure only; ordering/fairness is human-judged).
3. `npx ts-node scripts/import_word_trails.ts --publish --replace` — push to the `word_trails` DB collection. The app reads from there (cached), so no rebuild needed for content changes.

Batch 2 (`wt-051`…`wt-062`, June 2026) was authored to this framework: 4 distinct domains each, deliberate cross-path bait at Level 3+ (e.g. SPARK/FLAME split across creativity vs romance in wt-055; COURT/VERDICT/SENTENCE across tennis/law/grammar in wt-056; VAULT across bank vs gymnastics in wt-061).
