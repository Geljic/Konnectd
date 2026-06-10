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
