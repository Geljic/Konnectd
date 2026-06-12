#!/usr/bin/env python3
"""
Validate src/data/nextStepsPuzzles.ts WITHOUT node.

Each Next Steps puzzle must have: a difficulty 1-5, exactly 4 trails, 4 words per
trail, 16 unique words total, a valid relation per trail, and a unique id.
(Ordering correctness is a human judgement — this only checks structure.)
Run: python3 scripts/validate_word_trails.py
"""
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "src", "data", "nextStepsPuzzles.ts")
RELATIONS = {"cause", "sequence", "growth", "process", "place", "phrase", "hierarchy", "story", "association"}

src = open(DATA, encoding="utf-8").read()
parts = re.split(r"(id:\s*'[^']+')", src)


def words_of(raw):
    return [w.strip().strip("'\"").upper() for w in raw.split(",") if w.strip()]


errors, seen_ids = [], set()
spread = Counter()
count = 0
print("Validating Next Steps puzzles from nextStepsPuzzles.ts\n")

for i in range(1, len(parts), 2):
    pid = re.search(r"'([^']+)'", parts[i]).group(1)
    block = parts[i + 1]
    count += 1

    diff_m = re.search(r"difficulty:\s*(\d+)", block)
    diff = int(diff_m.group(1)) if diff_m else 0
    trails = re.findall(r"words:\s*\[([^\]]*)\]", block)[:4]
    relations = re.findall(r"relation:\s*'(\w+)'", block)[:4]
    words = [w for t in trails for w in words_of(t)]

    issues = []
    if pid in seen_ids:
        issues.append("duplicate id")
    seen_ids.add(pid)
    if diff < 1 or diff > 5:
        issues.append(f"bad difficulty {diff}")
    if len(trails) != 4:
        issues.append(f"{len(trails)} trails (need 4)")
    for t in trails:
        n = len(words_of(t))
        if n != 4:
            issues.append(f"a trail has {n} words (need 4)")
    if len(words) != 16:
        issues.append(f"{len(words)} words (need 16)")
    dupes = sorted({w for w in words if words.count(w) > 1})
    if dupes:
        issues.append(f"repeated: {', '.join(dupes)}")
    bad_rel = [r for r in relations if r not in RELATIONS]
    if bad_rel:
        issues.append(f"bad relation(s): {', '.join(bad_rel)}")

    spread[diff] += 1
    status = "OK  " if not issues else "FAIL"
    print(f"  [{status}] {pid}  L{diff}  ({len(set(words))} unique)" + ("" if not issues else "  -> " + "; ".join(issues)))
    errors.extend(f"{pid}: {x}" for x in issues)

print("\nDifficulty spread: " + ", ".join(f"L{k}={spread[k]}" for k in sorted(spread)))
print()
if errors:
    print(f"{len(errors)} problem(s):")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print(f"All {count} Next Steps puzzles structurally valid.")
