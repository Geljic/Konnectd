# KonnectD — Product Roadmap

_Last updated: June 2026_

## Vision

> "The Connections game designed for how you actually play with other people."

NYT Connections is a solo daily ritual with bolted-on sharing. KonnectD is social-first — challenging, collaborating, and competing are built into the core loop. The competitor to beat is not NYT (unreachable brand moat) but **Connections Unlimited**, which has the right instincts but executes with web-first, Android-first, no-social mediocrity.

---

## Status Overview

| Phase | Focus | Status |
|---|---|---|
| 0 | Core game loop — grid, tiles, animations, SFX | ✅ Done |
| 1 | UX polish — dark mode, scoring, share, branding | ✅ Done |
| 2 | Challenge a Friend (in-app, friends-system) | ✅ Done |
| 3 | Social — usernames, friends, leaderboard, social hub, co-streaks | ✅ Done |
| 4 | Hints system + push notifications | 🚧 In progress |
| 5 | Monetisation — cosmetics, first puzzle pack, subscription | 🔲 Next |
| 6 | Blitz Mode — 90-second speed round, daily leaderboard | 🔲 Planned |
| 7 | Wordlines — ordered word-trail mode + mode-aware stats/matches | 🔲 Planned |

---

## Strategic Decisions

These choices were made in June 2026 and should guide all feature prioritisation:

### Retention
KonnectD already has strong retention hooks (daily habit, streaks, co-streaks, social graph, nemesis/frenemy labels). The gap is **content variety** and **a second reason to open the app after the daily puzzle**. New modes solve this — not more social features.

### Monetisation philosophy
- Core game is always free — never gate the daily puzzle, friend challenges, or leaderboard
- Sell **cosmetics** (tile themes, board colours, share card styles) and **extra content** (themed puzzle packs)
- Subscription = convenience + cosmetics vault, never a content paywall
- Rewarded video for hints (opt-in, not intrusive)

### New mode order
1. **Wordlines first** — original single-player word-trail mode, instant to play at launch, gives the app a second daily loop without requiring friends to be online
2. **Async co-op Wordlines second** — use the friends graph after the solo mode has proven the mechanic and built shared vocabulary
3. **Blitz Mode later** — paused for now because clock-based leaderboards invite cheating

### Why Wordlines over Codenames Duet for launch
- Single-player is easier to launch: users can install, play, understand, and share without needing a friend already in the app
- The mechanic is familiar but ownable: Connections asks "what belongs together?", Wordlines asks "what order do these ideas flow in?"
- Ordered paths differentiate it from word ladders, phrase chains, and Connections clones
- Curated content can ship immediately; AI generation can follow once the structure is proven
- Async co-op becomes a future extension of the same mechanic rather than a separate Codenames-shaped feature

---

## What's Built ✅

### Core Game
- 4×4 grid, tile selection, guess logic, 4-mistake limit, "One away…" toast
- Animations: shake on wrong guess, flip/reveal on solve, confetti on win
- Hard mode toggle (no colour hints shown during play)
- In-progress game save/restore (AsyncStorage)
- Daily puzzle (assigned date or deterministic fallback)
- NYT puzzle archive
- Curated puzzle library with difficulty badges + pagination
- Post-game category explanations (shown on loss)
- Puzzle rating (👍/👎 per play session)

### Accounts & Auth
- Email + password auth via PocketBase
- Guest play (no account required, prompts to sign up)
- Steam-style handles: `Simon#7911` — searchable by name or full handle
- Profile screen with handle copy, email, log out, delete account

### Scoring System
- Points per row by difficulty: Purple 400 / Blue 300 / Green 200 / Yellow 100
- Order bonus: +50 per step for unbroken hard-first chain (max +200)
- Time bonus: `max(50, 400 − floor(seconds/8))` — generous floor so slow players still score
- Mistake penalty: −75 per mistake
- Scores stored on `play_sessions` and `challenges`
- Score shown on ResultScreen, ChallengeResultScreen, StatsScreen (best score)
- GameCompleted modal shows hard mode flag + score; match history includes both

### Social & Friends
- `friendships` collection: send / accept / remove
- Snapchat-style Social hub (replaces old Friends screen)
  - Auto-calculated relationship labels: Friend / New Rival / Frenemy / Their Nemesis / Your Nemesis / Best Frenemy
  - Colour-coded badges per label
  - Collapsible search bar, pull-to-refresh
- Friend detail screen: profile card, open challenge button, match history, remove friend
- User search by display name or `Name#tag`
- Co-streaks: consecutive days both friends played the daily puzzle; badge shown on friend rows

### Leaderboard
- Friends leaderboard: sorted by win rate → total wins → streak
- Global leaderboard: top 100 with min 10 puzzles played
- Head-to-head modal per friend: W/L record, nemesis/dominance badges
- Badge dot on Home screen Friends button when there are pending challenges

### Challenge a Friend
- In-app challenge flow: pick a friend → challenge created → friend sees it in Social hub
- First-solve only (no re-challenging to cheat)
- Creates a challenge record in PocketBase
- Deep link: `https://konnectd.xyz/challenge/:id`
- Side-by-side result reveal with winner declaration
- Score-based winner (falls back to mistakes → time)
- Share button (separate from Challenge): emoji grid + score + game link, native share sheet

### Stats Screen
- Played / win % / wins / losses grid
- Current + best streak boxes
- Avg solve time + best score side by side
- Normal / Hard mode toggle
- Recent games list (tap to replay result modal)

### Dark Mode
- Full app dark mode with `useColors()` hook + `makeStyles(colors)` pattern
- Dark mode toggle in Settings
- All buttons fixed for contrast

### Branding & UI
- Animated KonnectD logo: 4 tiles that bob independently, blink, and wink
- KonnectD wordmark on Home, Game screen, and all share text
- Web layout: max 430px centred with dark `#0A120D` gutter
- Home screen footer nav anchored below scroll

### Backend / Infrastructure
- PocketBase on Docker (port 8092), nginx on 8080
- Cloudflare Tunnel → konnectd.xyz
- Migrations for all collections: users, puzzles, nyt_puzzles, play_sessions, friendships, challenges
- `updateUserStats` recomputes from session count on each game end (self-healing)
- `listRule` on users allows friend search while protecting private data

---

## Phase 4 — Hints + Notifications 🚧

### Hints System
Three tiers, cheapest first:
1. **Warm/cold** — "2 of your selected words belong together." No category revealed. Costs −100 pts.
2. **Word reveal** — "KAYAK belongs in the purple group." Direct but not the full category. Costs −150 pts.
3. **Category peek** — Reveals one category name (e.g., "PALINDROMES") without words. Costs −200 pts.

Rules: max 2–3 hints per game, deducted from score, shown on result screen. Hint button in game header. Rewarded video hook for monetisation (opt-in).

### Push Notifications
- PocketBase subscriptions + `expo-notifications`
- Notify when a friend sends you a challenge
- Notify when a friend accepts/completes your challenge
- Daily puzzle reminder (opt-in, user-set time)

### Offline Mode _(lower priority, do after monetisation if needed)_
- Cache puzzles after first fetch; serve from cache when network unavailable
- Queue failed session writes and flush on reconnect
- Show subtle "offline" indicator in game header

---

## WHERE WE ARE AT - Phase 5 — Monetisation 🔲

### Principles
- Free players get: full daily puzzle, all challenges, leaderboard, social features, 3 hints/day
- Paying players get: convenience, cosmetics, extra content — never exclusive gameplay

### Layers
| Layer | Details |
|---|---|
| **Cosmetics (IAP)** | Board themes, tile colour schemes, share card styles — $0.99–$2.99 each or in bundles |
| **Themed puzzle packs (IAP)** | $1.99 each: 🇦🇺 Australian, 🏏 Sports, 🎵 90s Music, 🍕 Food, 📺 Reality TV, 🏫 Classroom | PAUSED FOR NOW
| **Premium subscription** | ~$3–5/month: unlimited hints, streak freeze, cosmetics vault, early access to new modes | or One time purchase
| **Rewarded video** | Opt-in ad for a hint token (free players) |


### First milestone
Ship **one cosmetic pack** + **Reward Video for Hints** + **One time purhase to support development and hosting etc**

---

## Phase 6 — Blitz Mode 🔲 - PAUSED people will cheat for clock times 

### Concept
90-second solo speed round. Same daily puzzle, same rules, but the clock is the challenge. Daily leaderboard sorted by score (time bonus amplified in Blitz). No new content needed — re-uses the existing puzzle library.

### Why first
- Zero new infrastructure (no new collections, no new backend logic)
- Re-uses all existing animations, scoring, and leaderboard components
- Adds a second daily touchpoint (do the daily puzzle + do the daily Blitz)
- Ships fast — estimate 1–2 weeks

### Feature spec
- Blitz tab or mode toggle on Home screen
- Countdown timer (large, prominent) replacing the normal game header
- Score multiplier applied at end for fast clears
- Daily Blitz leaderboard (friends + global) — separate from standard leaderboard
- "Blitz streak" tracked separately from normal streak
- Share result includes Blitz badge to differentiate

---

## Phase 7 — Wordlines Mode 🔲

### Concept
Single-player ordered word-path puzzle. The player sees 16 mixed words and must untangle 4 hidden trails of 4 words. Each trail is ordered: every word connects to the next by meaning, cause/effect, phrase, hierarchy, process, place, or story logic.

Example:
- `SEED -> ROOT -> TREE -> FOREST`
- `MATCH -> SPARK -> FIRE -> SMOKE`
- `SCRIPT -> ACTOR -> STAGE -> APPLAUSE`
- `COURT -> JUDGE -> VERDICT -> SENTENCE`

Connections asks "what belongs together?" Wordlines asks "what order do these ideas flow in?"

### Launch content
- 50 curated puzzles added in `src/data/wordTrailsPuzzles.ts`
- Reusable creator/validation helpers added in `src/utils/wordTrails.ts` so future generator scripts can share the same schema
- Each puzzle has:
  - `id`
  - `title`
  - `difficulty` from 1-5
  - four ordered `trails`
  - per-trail `label` and `relation`
- Every puzzle should contain 16 unique visible words

### Rules
- Select 4 words, then arrange them into the intended trail order
- Correct trail locks in and reveals its relation label
- Wrong set or wrong order costs a mistake
- Difficulty rises through ambiguity, cross-associations, and less literal path logic
- Share result differentiates Wordlines from Connections

### First playable slice
- Home screen game switcher swaps Connections / Wordlines actions in-place with animation
- Daily / Random Wordlines route into `WordlinesGameScreen`
- Free Play routes into `WordlinesSelectScreen`
- Local completion state stored with AsyncStorage
- Wordlines play sessions record as `game_type = 'word_trails'`, `game_mode = 'classic'`

### Mode-aware stats and matches
From this phase onward, every play session and challenge must include:
- `game_type`: `connections`, `word_trails`, etc.
- `game_mode`: ruleset within that game type (`normal`, `hard`, `classic`, etc.)

This keeps future stats, leaderboards, match history, and challenge inboxes from mixing unrelated modes.

### Backend changes
- `play_sessions.game_type`
- `play_sessions.game_mode` remains ruleset, not product-level mode
- `challenges.game_type`
- `challenges.game_mode`
- Existing records backfill as `connections` / `normal`

### Future async co-op extension
Once the solo mode is proven, add co-op Wordlines using the existing friends graph:
- One friend gives a clue for a hidden trail
- The other friend tries to complete the trail
- PocketBase subscriptions notify when it is your turn
- Notification hub / bell badge should collect turns, challenges, and friend requests

---

## Competitive Positioning

| Feature | NYT | Connections Unlimited | **KonnectD** |
|---|---|---|---|
| Challenge a friend (in-app) | ❌ | ❌ | ✅ |
| Friends + social hub | ❌ | ❌ | ✅ |
| Relationship labels (Nemesis, Frenemy…) | ❌ | ❌ | ✅ |
| Scoring system | ❌ | ❌ | ✅ |
| Dark mode | ❌ | Partial | ✅ |
| Head-to-head stats | ❌ | ❌ | ✅ |
| Co-streaks | ❌ | ❌ | ✅ |
| Hints system | ❌ | Partial | 🚧 |
| Push notifications | ❌ | ❌ | 🚧 |
| Blitz mode | ❌ | ❌ | Paused |
| Wordlines ordered-path mode | ❌ | ❌ | 🔲 |
| Async co-op mode | ❌ | ❌ | 🔲 |
| Cosmetics / themes | ❌ | ❌ | 🔲 |
| Australian content pack | ❌ | ❌ | 🔲 |
| Branded image share | ❌ | ❌ | 🔲 |
| Offline mode | ❌ | ❌ | 🔲 |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54+ managed workflow |
| Language | TypeScript |
| Animations | React Native Reanimated 3 |
| State | Zustand |
| Backend | PocketBase (Docker, port 8092) |
| Tunnel | Cloudflare → konnectd.xyz |
| Deep links | `konnectd://` scheme + HTTPS URL |
| Realtime | PocketBase subscriptions (friends/challenges/duet turns) |
| Notifications | `expo-notifications` (Phase 4) |
| Puzzle AI | Claude API `claude-sonnet-4-6` (batch generation scripts) |

# Known Bugs
- When you click challenge again you then select a puzzle - it then loads the puzzle and looks like you can play before the screen changes too "Still waiting…
Your opponent hasn't accepted yet."
