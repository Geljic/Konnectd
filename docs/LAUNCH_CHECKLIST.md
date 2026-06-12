# Konnectd Launch Checklist

_Last updated: June 2026_

## Current Launch Decision

- Paid IAP is off for v1 (`EXPO_PUBLIC_IAP_ENABLED=false`).
- Garden Pop cosmetics are available for launch while purchases are paused.
- Ads/rewarded ads can remain if AdMob production IDs and store disclosures are verified.
- Legal/support pages should be hosted at:
  - `https://konnectd.xyz/privacy`
  - `https://konnectd.xyz/terms`
  - `https://konnectd.xyz/support`

Static starter pages live in `docs/static_site`.

If deploying with the Docker web container, rebuild the `web` image after editing these pages. The Dockerfile copies `docs/static_site` into nginx alongside the Expo web export.

## Pre-Build Checks

- Run `npm run typecheck`.
- Run the app on iOS and Android physical devices.
- Apply PocketBase migrations on a clean data directory.
- Apply PocketBase migrations on a production-like data copy.
- Confirm password reset SMTP and HTTPS reset URL.
- Confirm report/block records are visible to admin in PocketBase.
- Confirm account deletion succeeds for users with sessions, friends, challenges, reports, and blocks.
- Confirm AdMob test ads in dev and production IDs in release.
- Confirm no paid purchase buttons appear in release builds.

## Build Commands

Install and log in:

```sh
cd /DATA/apps/projects/game_apps/Connections_Game
npm install
npx eas-cli login
```

Android APK for device testing:

```sh
npx eas-cli build -p android --profile preview
```

Android Play Store build (`.aab`):

```sh
npx eas-cli build -p android --profile production
```

iOS simulator build for local review:

```sh
npx eas-cli build -p ios --profile preview
```

iOS App Store/TestFlight build:

```sh
npx eas-cli build -p ios --profile production
```

Submit with EAS after store records are ready:

```sh
npx eas-cli submit -p android --profile production
npx eas-cli submit -p ios --profile production
```

## Store Metadata Draft

### App Name
Konnectd

### Subtitle / Short Description
Daily word puzzles with friends

### Longer Description Draft
Konnectd is a daily word puzzle game built for solo play, friendly rivalry, and quick challenges. Solve the daily puzzle, explore curated archives, try Next Steps ordered-path puzzles, compare stats with friends, and send direct challenges to see who solves cleaner and faster.

### Keywords
word game, daily puzzle, brain game, connections, friends, challenge, vocabulary, logic, trivia, streak

### Support URL
`https://konnectd.xyz/support`

### Privacy Policy URL
`https://konnectd.xyz/privacy`

### Terms URL
`https://konnectd.xyz/terms`

### Review Notes
- Demo account: create before submission.
- Paid purchases are disabled for v1.
- The app includes optional ads/rewarded ads.
- Account deletion is available from Profile.
- Reporting/blocking is available from friend profiles; puzzle issue reporting is available from completed puzzle review.

## Screenshot Set Needed

- Home screen with Groups selected.
- Home screen with Next Steps selected.
- Groups gameplay board.
- Groups result/review modal.
- Next Steps gameplay board.
- Social hub/friends screen.
- Friend detail/challenge screen.
- Stats screen.
- Settings screen with support/legal links.

## App Review Console Fields

- Category: Games / Word or Puzzle.
- Age rating: complete questionnaire honestly; likely low age rating unless ads content or user interaction answers raise it.
- Ads declaration: Yes if AdMob remains in native builds.
- Data Safety / App Privacy: include account info, identifiers/push token, gameplay data, friends/social data, reports/blocks, diagnostics if added, and AdMob SDK data.
- App access: provide demo account if login-gated screens need review.

## Audit Findings — 12 June 2026

Prioritised follow-ups from the full codebase audit (bugs found during the
audit were fixed directly; these are the items that need a decision or
deeper work).

### Before launch (blocking or high risk)

1. **Move challenge push notifications server-side.** `src/utils/notifications.ts`
   sends pushes from the client: it reads the *recipient's* `push_token` from the
   `users` collection and posts directly to Expo's push API. That means API rules
   must expose every user's push token to any logged-in user — a privacy/abuse
   hole. Move this into a PocketBase hook (`docker/pb_hooks`) that fires on
   challenge create/update, and lock `push_token` down to owner-only.
2. **Audit PocketBase API rules.** Client-side leaderboards/stats read other
   users' records, and `play_count`/user stats are written from the client, so a
   motivated user can inflate stats via the raw API. Acceptable for a soft
   launch; verify rules at minimum prevent writing other users' records.
3. **Use `pb.filter()` for user-supplied search strings.** `searchUsers` escapes
   quotes as `''` (not PocketBase's escape), and other filters interpolate raw
   input. Names with apostrophes will break search; use the SDK's `pb.filter()`
   placeholder syntax everywhere a user-typed string enters a filter.
4. **Decide the daily-reset timezone.** Daily puzzles, streaks and "done today"
   all use the UTC date, so for NSW players the day flips at ~10 am local time.
   Either accept (NYT-style fixed reset) and document it, or switch to local
   dates consistently (app + any server logic).

### Soon after launch

5. **Crossed Signals content is bundled in the app.** Next Steps already loads
   from PocketBase with a static fallback; mirror that for Crossed Signals so
   new puzzles don't require an app release. Its results are also local-only
   (AsyncStorage), so progress doesn't sync across devices and there's no
   Crossed Signals leaderboard.
6. **Account deletion is incomplete.** It deletes sessions, friendships and
   challenges *created* by the user, but not challenges where they're the
   opponent/recipient, nor reports/blocks; their handle also lives on in
   denormalised `challenger_name`/`opponent_name` fields. Fine for v1 if
   documented, but tighten before scale (store-policy relevant).
7. **Haptics toggle does nothing.** There is no expo-haptics usage anywhere in
   the app; either implement haptic feedback or remove the Settings row.
8. **Add crash/error reporting** (e.g. Sentry for Expo) before real users hit
   edge cases you can't reproduce.
9. **Monetisation is a stub.** `purchaseProduct` fake-grants products after a
   delay and web rewarded ads always "succeed". Hidden while
   `EXPO_PUBLIC_IAP_ENABLED=false`; integrate RevenueCat/expo-iap before ever
   flipping it on.

### Web performance (done + optional next steps)

- Done in this audit: gzip + build-time precompression (main bundle
  2.03 MB → 479 KB), immutable caching for hashed assets, no-cache
  index.html, non-blocking session restore, loading indicator at boot.
- Optional later: route-level code splitting (needs expo-router or manual
  `import()` boundaries), and verifying Cloudflare edge caching picks up the
  new Cache-Control headers.
- Domain check: `WEB_BASE_URL` defaults to `https://konnectd.xyz` while infra
  docs reference `connections.gigglebooth.online` — make sure share links and
  deep-link prefixes match the domain you actually launch on.
