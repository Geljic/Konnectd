# KonnectD

A daily word puzzle game inspired by NYT Connections. Group 16 words into 4 categories — but watch out, some words could fit more than one.

Built with Expo + React Native (web & mobile), PocketBase backend, and Docker for deployment.

## Features

- Daily puzzles with unlimited archive access
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
