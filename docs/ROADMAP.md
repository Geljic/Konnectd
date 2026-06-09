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
| 2 | Challenge a Friend | ✅ Done |
| 3 | Social — usernames, friends, leaderboard, social hub | ✅ Done |
| 4 | Hints, offline mode, notifications, growth | 🚧 In progress |
| 5 | Monetisation — IAP, subscription, cosmetics | 🔲 Planned |

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

### Social & Friends
- `friendships` collection: send / accept / remove
- Snapchat-style Social hub (replaces old Friends screen)
  - Auto-calculated relationship labels: Friend / New Rival / Frenemy / Their Nemesis / Your Nemesis / Best Frenemy
  - Colour-coded badges per label
  - Collapsible search bar, pull-to-refresh
- Friend detail screen: profile card, open challenge button, match history, remove friend
- User search by display name or `Name#tag`

### Leaderboard
- Friends leaderboard: sorted by win rate → total wins → streak
- Global leaderboard: top 100 with min 10 puzzles played
- Head-to-head modal per friend: W/L record, nemesis/dominance badges
- Badge dot on Home screen Friends button when there are pending challenges

### Challenge a Friend
- First-solve only (no re-challenging to cheat)
- Creates a challenge record in PocketBase
- Deep link: `https://konnectd.xyz/challenge/:id`
- Side-by-side result reveal with winner declaration
- Score-based winner (falls back to mistakes → time)
- Share text includes score and challenge link

### Share
- Emoji grid + score + game link or challenge link
- Native share sheet on mobile, clipboard fallback on web

### Stats Screen
- Played / win % / wins / losses grid
- Current + best streak boxes
- Avg solve time + best score side by side
- Normal / Hard mode toggle
- Recent games list (tap to replay result modal)

### Dark Mode
- Full app dark mode with `useColors()` hook + `makeStyles(colors)` pattern
- Dark mode toggle in Settings
- All buttons fixed for contrast (no white-on-white or white-on-light-green)

### Branding & UI
- Animated KonnectD logo: 4 tiles that bob independently, blink, and wink
- KonnectD wordmark on Home, Game screen, and all share text
- Web layout: max 430px centred with dark `#0A120D` gutter
- Home screen footer nav anchored below scroll (no overlap on short screens)

### Backend / Infrastructure
- PocketBase on Docker (port 8092), nginx on 8080
- Cloudflare Tunnel → konnectd.xyz
- Migrations for all collections: users, puzzles, nyt_puzzles, play_sessions, friendships, challenges
- `updateUserStats` recomputes from session count on each game end (self-healing)
- `listRule` on users allows friend search while protecting private data

---

## What's Left 🔲

### Phase 4 — Hints System
Three tiers, cheapest hint first:
1. **Warm/cold** — "2 of your selected words belong together." No category revealed. Costs −100 pts.
2. **Word reveal** — "KAYAK belongs in the purple group." Direct but not the full category. Costs −150 pts.
3. **Category peek** — Reveals one category name (e.g., "PALINDROMES") without words. Costs −200 pts.

Rules: max 2–3 hints per game, deducted from score, shown on result screen. Hint button in game header. Optional "watch ad for a hint" rewarded video hook for monetisation.

### Phase 4 — Offline Mode
Infrastructure is partially there (AsyncStorage cache written, not yet wired as fallback):
- Cache puzzles after first fetch; serve from cache when network unavailable
- Queue failed session writes and flush on reconnect
- Show subtle "offline" indicator in game header

### Phase 4 — In-App Challenge Notifications
- Pick a friend from list → creates challenge → real-time push notification via PocketBase subscriptions + `expo-notifications`
- Keep link sharing as fallback for non-friends

### Phase 4 — Co-Streaks
- Track consecutive days both friends played the daily puzzle
- Show co-streak badge on friend rows in Social hub
- "Simon and you have a 🔥 12-day co-streak"

### Phase 1 Remaining
| Feature | Description |
|---|---|
| Branded share image | Visual card via `react-native-view-shot` (grid + score + handle + app CTA) |
| Streak freeze | Spend a freeze token to protect streak on a missed day |
| Accessibility | Colour-blind patterns, high contrast toggle, font size slider |

### Phase 5 — Monetisation
| Layer | Details |
|---|---|
| Premium subscription | ~$3–5/month: unlimited hints, streak freeze, custom puzzles, cosmetics |
| Themed puzzle packs (IAP) | $1.99 each: 🇦🇺 Australian, 🏏 Sports, 🎵 90s Music, 🍕 Food, 📺 Reality TV, 🏫 Classroom |
| Cosmetics | Board themes, tile colour schemes, share card styles |
| Rewarded video | Opt-in ads for a hint token |

---

## Phase 2 — Challenge a Friend ✅

**Flow:**
1. Complete a puzzle → tap "⚡ Challenge" on result screen (first solve only)
2. App creates a challenge record with your result (hidden from opponent)
3. Share link (WhatsApp, iMessage, etc.) or pick a friend in-app
4. Friend opens link → plays the same puzzle independently
5. Side-by-side results revealed — fewer mistakes wins, score as tiebreaker, time as final tiebreaker

---

## Competitive Positioning

| Feature | NYT | Connections Unlimited | **KonnectD** |
|---|---|---|---|
| Challenge a friend | ❌ | ❌ | ✅ |
| Friends + social hub | ❌ | ❌ | ✅ |
| Relationship labels (Nemesis, Frenemy…) | ❌ | ❌ | ✅ |
| Scoring system | ❌ | ❌ | ✅ |
| Dark mode | ❌ | Partial | ✅ |
| Head-to-head stats | ❌ | ❌ | ✅ |
| Daily co-streaks | ❌ | ❌ | 🚧 Planned |
| Hints system | ❌ | Partial | 🚧 Planned |
| Offline mode | ❌ | ❌ | 🚧 Planned |
| Custom puzzle creation | Editorial only | Web only | 🔲 Planned |
| Branded image share | ❌ | ❌ | 🔲 Planned |
| iOS widget | ❌ | ❌ | 🔲 Planned |
| Co-op mode | ❌ | ❌ | 🔲 Planned |
| Australian content | ❌ | ❌ | 🔲 Planned |

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
| Realtime | PocketBase subscriptions (friends/challenges) |
| Notifications | `expo-notifications` (Phase 4) |
