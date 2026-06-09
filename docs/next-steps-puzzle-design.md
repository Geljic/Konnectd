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
