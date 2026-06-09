# App Infrastructure Guide

Standard stack for Simon's mobile/web apps hosted on ZimaOS.

---

## Overview

All apps in this monorepo share the same backend infrastructure pattern:
- **Frontend**: Expo (React Native) for iOS + Android, or Next.js for web
- **Backend**: PocketBase running in Docker on ZimaOS (home server)
- **Tunnel**: Cloudflare Tunnel exposes backend publicly — no port forwarding, no cloud costs
- **AI features**: Claude API (Anthropic) via the `@anthropic-ai/sdk` package
- **Monetisation**: AdMob (mobile) — banner ads in menus only, never mid-session

This keeps monthly costs near-zero: only Apple Developer ($99/yr) and per-use Claude API fees.

---

## ZimaOS Home Server

**SSH access**: `simontgn@ssh.gigglebooth.online`

Files sync via rsync from the monorepo root:
```bash
rsync -avz /home/simon/Documents/Apps/ simontgn@ssh.gigglebooth.online:~/apps/
```

All Docker services live in `~/apps/` on the ZimaOS server. Each project gets its own subdirectory with a `docker-compose.yml`.

---

## Backend: PocketBase

PocketBase is a single-binary open-source BaaS with:
- SQLite database
- REST + realtime API (auto-generated per collection)
- Admin dashboard at `/_/`
- File storage
- Auth (if needed)

### Docker Compose template

Create `projects/<name>/docker/docker-compose.yml` on the ZimaOS server:

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    volumes:
      - ./pb_data:/pb/pb_data
    ports:
      - "8090:8090"   # change port if running multiple apps
```

Start with:
```bash
cd ~/apps/projects/<name>/docker
docker compose up -d
```

Admin dashboard: `http://localhost:8090/_/` (local) or via tunnel URL.

### Port allocation (avoid conflicts)

| App | PocketBase Port |
|---|---|
| Connections Game | 8091 |
| _(next app)_ | 8092 |

---

## Cloudflare Tunnel

Already configured on ZimaOS. To expose a new service:

1. Go to Cloudflare Zero Trust dashboard → Access → Tunnels
2. Edit the existing tunnel → Add a new Public Hostname:
   - Subdomain: `api.connections` (or whatever fits)
   - Domain: your Cloudflare domain
   - Service: `http://localhost:8091`
3. The tunnel client on ZimaOS picks this up automatically — no restart needed

The app then talks to `https://api.connections.yourdomain.com` (HTTPS handled by Cloudflare).

### Security

- PocketBase collections should be set to **public read** for puzzle data, **private write**
- Sensitive admin routes (`/_/`) are only accessible locally (not exposed via tunnel) — or add a Cloudflare Access policy
- No secrets in the app bundle — the PocketBase API is intentionally public-read for game data

---

## Frontend: Expo (React Native)

### Init a new project

```bash
cd projects/<name>
npx create-expo-app src --template blank-typescript
```

### Standard dependencies

```bash
npx expo install \
  react-native-reanimated \
  expo-audio \
  expo-secure-store \
  @react-native-async-storage/async-storage \
  react-native-google-mobile-ads

npm install zustand @react-navigation/native @react-navigation/native-stack
```

### EAS Build (App Store + Play Store)

```bash
npm install -g eas-cli
eas login
eas build:configure   # creates eas.json
```

`eas.json` profile pattern:
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

Build for both platforms before submitting:
```bash
eas build --platform all --profile preview
```

---

## AI Features: Claude API

Use Claude for content generation (puzzles, summaries, etc.) in batch scripts — not in the live app hot-path.

### Setup

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: yourPrompt }],
});
```

Store `ANTHROPIC_API_KEY` in a local `.env` file (never commit). Run generation scripts locally or as a ZimaOS scheduled agent (see `schedules/`).

### Cost control

- Generate content in batches (weekly), not on-demand per user request
- Use `claude-haiku-4-5` for validation/classification tasks (cheaper)
- Use `claude-sonnet-4-6` for creative generation (better quality)

---

## Monetisation: AdMob (mobile apps)

Use `react-native-google-mobile-ads` for banner ads only.

```bash
npx expo install react-native-google-mobile-ads
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXX~XXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXX~XXXXXXX"
        }
      ]
    ]
  }
}
```

### Rules

- Banner ads in: Home, List/Browse, Result, Stats screens
- **Never** in the core session/game/editor screen
- Never use interstitials or rewarded video — user experience over revenue
- Use `TestIds.BANNER` during development

```tsx
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

<BannerAd
  unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-xxx/xxx'}
  size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
/>
```

---

## Project Checklist (new app)

- [ ] Copy `projects/_template/` → `projects/<name>/`
- [ ] Register in root `CLAUDE.md` Project Index
- [ ] Create `docker/docker-compose.yml`, assign a free port (8092, 8093…)
- [ ] Add Cloudflare tunnel hostname for the new service
- [ ] `npx create-expo-app` and install standard deps
- [ ] Create AdMob app in Google AdMob console, add IDs to `app.json`
- [ ] Add `ANTHROPIC_API_KEY` to local `.env` if using Claude
- [ ] Configure EAS Build (`eas build:configure`)
- [ ] Register Apple App ID + Google Play listing before first build

---

## Cost Reference

| Item | Cost |
|---|---|
| ZimaOS electricity (always-on) | ~$3–5/mo estimate |
| Cloudflare Tunnel | Free |
| Cloudflare domain | ~$10/yr |
| Claude API (batch generation) | ~$0.10–1.00/run |
| Apple Developer Program | $99/yr (~$8.25/mo) |
| Google Play Developer | $25 one-time |
| **Per-app marginal cost** | **~$0 backend + Apple/Play fees** |
