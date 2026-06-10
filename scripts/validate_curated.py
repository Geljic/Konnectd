#!/usr/bin/env python3
"""
Validate src/data/connectionsPuzzles.ts WITHOUT needing node.

Mirrors validateCuratedSeeds() in src/utils/connectionsPuzzles.ts: every seed must
have a valid difficulty, 4 categories (one of each colour), 4 words each, 16 unique
words, and unique ids. Exits non-zero if anything fails.
Run: python3 scripts/validate_curated.py
"""
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
# Optional path arg, e.g. `validate_curated.py src/data/dailyPuzzles.ts`.
DATA = (sys.argv[1] if len(sys.argv) > 1
        else os.path.join(HERE, "..", "src", "data", "connectionsPuzzles.ts"))
COLOURS = {"yellow", "green", "blue", "purple"}

src = open(DATA, encoding="utf-8").read()

ids = re.findall(r"id:\s*'([^']+)'", src)
# Seed-level difficulty is quoted (`difficulty: 'blue'`); the interface decl isn't.
difficulties = re.findall(r"difficulty:\s*'(\w+)'", src)
# Each category entry: colour immediately precedes its words array.
cat_pairs = re.findall(r"colour:\s*'(\w+)'\s*,\s*words:\s*\[([^\]]*)\]", src)

if len(cat_pairs) != len(ids) * 4:
    print(f"FAIL: {len(ids)} seeds but {len(cat_pairs)} categories (expected {len(ids) * 4}).")
    sys.exit(1)
if len(difficulties) != len(ids):
    print(f"FAIL: {len(ids)} seeds but {len(difficulties)} difficulty tags.")
    sys.exit(1)


def words_of(raw):
    return [w.strip().strip("'\"").upper() for w in raw.split(",") if w.strip()]


errors = []
seen_ids = set()
spread = Counter()
print(f"Validating {len(ids)} curated puzzles from {os.path.basename(DATA)}\n")

for i, pid in enumerate(ids):
    block = cat_pairs[i * 4:(i + 1) * 4]
    diff = difficulties[i]
    colours = [c for c, _ in block]
    words = [w for _, raw in block for w in words_of(raw)]

    issues = []
    if pid in seen_ids:
        issues.append("duplicate id")
    seen_ids.add(pid)
    if diff not in COLOURS:
        issues.append(f"bad difficulty '{diff}'")
    if set(colours) != COLOURS:
        issues.append(f"colours {colours} != yellow/green/blue/purple")
    for c, raw in block:
        n = len(words_of(raw))
        if n != 4:
            issues.append(f"{c} has {n} words (need 4)")
    if len(words) != 16:
        issues.append(f"{len(words)} total words (need 16)")
    dupes = sorted({w for w in words if words.count(w) > 1})
    if dupes:
        issues.append(f"repeated words: {', '.join(dupes)}")

    spread[diff] += 1
    status = "OK  " if not issues else "FAIL"
    print(f"  [{status}] {pid}  {diff:<7} ({len(set(words))} unique words)"
          + ("" if not issues else "  -> " + "; ".join(issues)))
    errors.extend(f"{pid}: {x}" for x in issues)

label = {"yellow": "Easy", "green": "Medium", "blue": "Hard", "purple": "Expert"}
print("\nDifficulty spread: " + ", ".join(f"{label.get(k, k)}={spread[k]}" for k in ['yellow', 'green', 'blue', 'purple']))

print()
if errors:
    print(f"{len(errors)} problem(s) found:")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print(f"All {len(ids)} puzzles valid.")
