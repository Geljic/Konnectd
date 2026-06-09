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
| 7 | Codenames Duet — async co-op mode using existing friends graph | 🔲 Planned |

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
1. **Blitz Mode first** — zero new content required, re-uses all existing puzzles and infrastructure, ships fast, adds a daily leaderboard hook
2. **Codenames Duet second** — the big social differentiator; async turn-based so no WebSockets needed; AI-generated word grids fit the existing puzzle pipeline

### Why Codenames Duet over other variants
- Existing social graph (friends system) makes it immediately playable at launch
- Async turn-based fits PocketBase without real-time infrastructure changes
- Genuinely different feel from Connections — co-op rather than solo/competitive
- Mobile UX on the web version is poor — real opportunity to own this space
- Content (25-word grids + clue maps) can be AI-generated like Connections puzzles

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

## Phase 7 — Codenames Duet Mode 🔲

### Concept
Async co-op word association game for 2 players, built on the existing friends graph. Based on Codenames Duet mechanics: both players share a 5×5 grid of 25 words, each has a secret map of which words their partner needs to guess. One player gives a one-word clue + number, the other guesses. Win together or lose together.

### Why this over other variants
- Existing friends system means instant social context at launch
- Async turn-based = no real-time server needed (PocketBase handles it)
- Genuinely different feel from Connections — co-op not competitive
- Current mobile UX for Codenames Duet online is poor — opportunity to own the space
- AI-generated word grids fit the existing Claude puzzle pipeline

### Architecture (async turn-based)
No WebSockets needed. Each game is a `duet_games` record with:
- `grid`: 25 words
- `map_a`, `map_b`: each player's secret map (which words their partner must find)
- `turns`: array of `{ player, clue, number, guesses[], result }`
- `status`: waiting / in_progress / won / lost
- `current_turn`: whose turn it is

PocketBase subscriptions notify the other player when a turn is played (same pattern as challenges). Push notification on your turn.
Requires notification menu / icon at top right of home screen -> show notications and have bell with badge number of notifications. Then show game turns, challenges, friend requests etc

### Content pipeline
- Claude generates 25-word grids grouped into loose themes
- Each grid has 9 words assigned to Player A, 9 to Player B, 3 shared (both must find), 1 assassin (instant loss if guessed)
- Admin review queue (same pattern as Connections puzzles)
- Difficulty: number of shared words + assassin placement

### Feature spec
- New "Duet" section in Social hub or dedicated Duet tab
- Start a game: pick a friend → they get notified → both see the grid
- Each turn: give a clue (text input) + number → opponent sees clue and guesses
- Codename map is hidden — you can see your assignments, not your partner's
- Win condition: all green words found without hitting the assassin
- Result screen: co-op style celebration, shared score
- Match history on Friend Detail screen includes Duet games

### Phased delivery
1. Core game loop (grid, maps, turn submission, guess logic)
2. Push notifications on your turn
3. Scoring + result screen
4. Content pipeline + first puzzle set
5. Match history integration

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
| Blitz mode | ❌ | ❌ | 🔲 |
| Codenames Duet mode | ❌ | ❌ | 🔲 |
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