# Konnectd

A daily word puzzle app with two modes: Groups, where you sort 16 words into hidden sets, and Next Steps, where you build ordered paths of connected words.

Built with Expo + React Native (web & mobile), PocketBase backend, and Docker for deployment.

## Features

- Daily puzzles with unlimited archive access
- Groups and Next Steps modes
- Hard mode
- Challenge a friend to beat your score
- Friends list, leaderboard, and match history
- Push notifications

## Stack

| Layer | Tech |
|---|---|
| Frontend | Expo / React Native (web + iOS + Android) |
| Backend | PocketBase |
| Deployment | Docker + nginx + Cloudflare Tunnel |

## Getting Started

```bash
npm install
npm start
```

Requires a running PocketBase instance. See [docker/](docker/) for the full stack setup.

## Deployment

```bash
cd docker
docker compose up -d
```

The web app is served on port 8080. PocketBase admin is on port 8092.
