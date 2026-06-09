# Connections Game — Project Rules

NYT-style Connections word puzzle game. Singleplayer, unlimited puzzles, Threes-inspired visual design.
iOS + Android via Expo managed workflow.

## Stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 54+ managed workflow |
| Language | TypeScript |
| Animations | React Native Reanimated 3 |
| Audio | expo-audio |
| State | Zustand |
| Navigation | React Navigation 7 (native stack) |
| Storage | AsyncStorage (puzzle cache) + PocketBase (account, sessions) |
| Ads | react-native-google-mobile-ads (banner only, menus only) |
| Backend | PocketBase on ZimaOS via Docker (port 8094) |
| Tunnel | Cloudflare → connections.gigglebooth.online |
| Puzzle AI | Claude API claude-sonnet-4-6 (batch generation script) |

## Phases

| Phase | Scope | Status |
|---|---|---|
| 1 | Core game: grid, tile selection, guess logic, hardcoded puzzle, win/lose | Planned |
| 2 | Animations + SFX: Reanimated 3 shake/flip/confetti, expo-audio | Planned |
| 3 | Navigation + auth: all screens, PocketBase auth, stats | Planned |
| 4 | Backend: Docker PocketBase, API client, offline cache, daily puzzle | Planned |
| 5 | Puzzle pipeline: Claude generation, embed validation, admin review | Planned |
| 6 | Launch: EAS Build, icons, App Store/Play Store, AdMob live IDs | Planned |

## Docs

- `docs/PLAN.md` — Full app plan (mechanics, animations, SFX, infrastructure)

## Architecture

```
Mobile App (Expo iOS/Android)
    │ HTTPS via Cloudflare Tunnel
    ▼
nginx :80 (host: 8083)
   /         → Expo web static
   /api/     → pocketbase:8090
   /_/       → pocketbase:8090 (admin)
         │
         ▼
  pocketbase:8090 (host: 8094)
  Auth + puzzles + play_sessions
```

No game-server — singleplayer only, no WebSockets needed.

## Design System

See `src/constants/colors.ts` — Threes-inspired light/airy card aesthetic.
- Light teal-mint background
- White tile cards with subtle shadows
- NYT category colours: yellow / green / blue / purple
- Typography: Inter or DM Sans, uppercase tile words

## Key Rules

- **No ads on GameScreen ever**
- Banners only on: Home, PuzzleSelect, Result, Stats
- 4 mistakes = game over (NYT behaviour)
- Show "One away…" toast when 3/4 correct
- All animations on UI thread via Reanimated 3 (no JS thread jank)
- Auth via PocketBase email+password; token persisted via PB SDK

## Docker Ports (ZimaOS)

| Container | Internal | Host |
|---|---|---|
| web (nginx) | 80 | 8080 |
| pocketbase | 8090 | 8092 |

## File Structure

```
src/
  App.tsx
  constants/
    colors.ts
    config.ts
  api/
    pb.ts           ← PocketBase singleton
    puzzles.ts      ← fetch, cache, mark-played
  components/
    Tile.tsx
    GameBoard.tsx
    MistakeDots.tsx
    CategoryReveal.tsx
    Confetti.tsx
    OneAwayToast.tsx
    BannerAd.tsx
  screens/
    WelcomeScreen.tsx
    LoginScreen.tsx
    SignUpScreen.tsx
    HomeScreen.tsx
    PuzzleSelectScreen.tsx
    GameScreen.tsx
    ResultScreen.tsx
    StatsScreen.tsx
    ProfileScreen.tsx
    SettingsScreen.tsx
  store/
    gameStore.ts    ← active puzzle state
    authStore.ts    ← user + auth token
  hooks/
    useSound.ts
    usePuzzle.ts
  utils/
    shareGrid.ts    ← emoji grid for share
    shuffle.ts
assets/
  sounds/           ← .mp3 SFX
  images/           ← icon, splash, adaptive-icon
  fonts/
scripts/
  generate_puzzles.ts ← Claude API batch generator
docker/
  docker-compose.yml
  Dockerfile.web
  nginx.conf
  pb_data/          ← gitignored
  pb_migrations/
```
