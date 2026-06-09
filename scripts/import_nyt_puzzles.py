#!/usr/bin/env python3
"""
Import NYT Connections puzzles from the Eyefyre community archive.
Source: https://github.com/Eyefyre/NYT-Connections-Answers

Usage:
  python3 scripts/import_nyt_puzzles.py [--dry-run] [--skip=N]

Env required:
  POCKETBASE_URL             (default: http://localhost:8094)
  POCKETBASE_ADMIN_EMAIL
  POCKETBASE_ADMIN_PASSWORD
"""

import json
import os
import random
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import urljoin

SOURCE_URL = "https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/main/connections.json"
COLLECTION = "nyt_puzzles"

PB_URL = os.environ.get("POCKETBASE_URL", "http://localhost:8092").rstrip("/")
ADMIN_EMAIL = os.environ.get("POCKETBASE_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("POCKETBASE_ADMIN_PASSWORD", "")

DRY_RUN = "--dry-run" in sys.argv
SKIP = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--skip=")), 0)

LEVEL_TO_COLOUR = {0: "yellow", 1: "green", 2: "blue", 3: "purple"}


def pb_request(path, method="GET", body=None, token=None):
    url = f"{PB_URL}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} {e.reason}: {body}")


def admin_auth():
    resp = pb_request(
        "/api/collections/_superusers/auth-with-password",
        method="POST",
        body={"identity": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    return resp["token"]


def ensure_collection(token):
    try:
        pb_request(f"/api/collections/{COLLECTION}", token=token)
        print(f'Collection "{COLLECTION}" already exists.')
    except RuntimeError as e:
        if "404" not in str(e):
            raise
        print(f'Creating collection "{COLLECTION}"...')
        pb_request(
            "/api/collections",
            method="POST",
            token=token,
            body={
                "name": COLLECTION,
                "type": "base",
                "fields": [
                    {"name": "nyt_id",     "type": "number", "required": True},
                    {"name": "nyt_date",   "type": "text",   "required": True},
                    {"name": "words",      "type": "json",   "required": True},
                    {"name": "categories", "type": "json",   "required": True},
                    {"name": "status",     "type": "text",   "required": False},
                    {"name": "play_count", "type": "number", "required": False},
                ],
            },
        )
        print(f'Collection "{COLLECTION}" created.')
        # Set public read access
        col_id = pb_request(f"/api/collections/{COLLECTION}", token=token)["id"]
        pb_request(f"/api/collections/{col_id}", method="PATCH", token=token,
                   body={"listRule": "", "viewRule": ""})


def build_record(puzzle):
    categories = [
        {
            "name": a["group"],
            "colour": LEVEL_TO_COLOUR.get(a["level"], "yellow"),
            "words": a["members"],
        }
        for a in puzzle["answers"]
    ]
    all_words = [w for cat in categories for w in cat["words"]]
    random.shuffle(all_words)
    return {
        "nyt_id": puzzle["id"],
        "nyt_date": puzzle["date"],
        "words": all_words,
        "categories": categories,
        "status": "published",
        "play_count": 0,
    }


def main():
    print("Fetching puzzle archive...")
    with urllib.request.urlopen(SOURCE_URL) as resp:
        puzzles = json.loads(resp.read())
    print(f"Fetched {len(puzzles)} NYT puzzles.")

    to_import = puzzles[SKIP:]
    label = f"(skipping first {SKIP})" if SKIP else ""
    mode = "[DRY RUN]" if DRY_RUN else f"→ {PB_URL} / {COLLECTION}"
    print(f"Importing {len(to_import)} puzzles {label} {mode}")

    if DRY_RUN:
        print("\nSample record (first puzzle):")
        print(json.dumps(build_record(to_import[0]), indent=2))
        return

    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        print("Error: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set.")
        sys.exit(1)

    print("Authenticating with PocketBase...")
    token = admin_auth()

    ensure_collection(token)

    imported = skipped = errors = 0
    for i, puzzle in enumerate(to_import):
        record = build_record(puzzle)
        try:
            pb_request(
                f"/api/collections/{COLLECTION}/records",
                method="POST",
                token=token,
                body=record,
            )
            imported += 1
        except RuntimeError as e:
            if "400" in str(e):
                skipped += 1  # duplicate nyt_id
            else:
                print(f"\nError on puzzle id={puzzle['id']}: {e}")
                errors += 1

        print(f"\r  {i+1}/{len(to_import)} — imported {imported}, skipped {skipped}, errors {errors}", end="", flush=True)
        time.sleep(0.05)

    print(f"\n\nDone. {imported} imported, {skipped} already existed, {errors} errors.")
    print(f"View at {PB_URL}/_/#/collections")


if __name__ == "__main__":
    main()
