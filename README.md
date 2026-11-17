# Deadlock Companion

Next.js + TypeScript + Tailwind companion for Deadlock. Uses [deadlock-api](https://api.deadlock-api.com).

## Seams

| Module | Contract |
| --- | --- |
| `@/lib/identity` | `getAccountId()`, `setAccountIdFromInput(raw)`, `clearAccountId()` (+ hydrate/subscribe for React) |
| `@/lib/steamid` | SteamID64 ↔ SteamID3 parse helpers |
| `@/lib/deadlock-api` | Typed helpers + `deadlockApi` / `createDeadlockApi({ mocks })` |
| `@/types/deadlock` | Shared DTOs |
| `@/lib/assets` | Local paths under `/deadlock-assets/...` |
| `@/lib/hero-assets` | Manifest + schematic reader (Hero pages) |
| `@/types/schematic` | Ability schematic shape / hints DTOs |

Routes: `/` (profile), `/live` (active match), `/heroes` (roster), `/heroes/[id]` (ability teaching).

`account_id` = SteamID3 = SteamID64 − `76561197960265728`. No Steam OpenID in v1 (vanity resolves via `/api/steam/resolve-vanity`).

## Setup

```bash
npm install
npm run dev
```

Optional: copy `.env.example` → `.env.local` for `NEXT_PUBLIC_DEADLOCK_API_BASE`.

## Scripts

| Command | What |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run assets:pull -- --hero <id>` | Download portrait + ability icons locally |

## Hero ability assets

See [docs/ASSET_INGEST.md](docs/ASSET_INGEST.md) and `public/deadlock-assets/manifest.json`.
