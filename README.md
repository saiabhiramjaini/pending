# Pending

UPI-first expense assistant. Scan a merchant QR, pay in PhonePe / GPay / Paytm / BHIM, come back, the attempt is recorded.

## Folders

- `client` — Expo mobile app
- `server` — Node.js / Bun Express API

Each folder has its own `package.json`, lockfile, and `node_modules`. Install inside that folder — nothing is hoisted to the repo root.

## Server

```bash
cd server
cp .env.example .env   # or use the repo-root .env.example
# set DATABASE_URL (Neon) and JWT_SECRET
bun install
bun run db:push
bun run dev
```

Node.js: `bun run start:node` (`tsx`).

## Client

```bash
cd client
bun install
npx expo prebuild
npx expo run:android
```

Needs a physical Android phone for UPI. Do not use Expo Go.

See `server/README.md` and `docs/`.

## Agents

AI coding agents **must** follow [`AGENTS.md`](AGENTS.md) and the handbook [`docs/AGENTS.md`](docs/AGENTS.md). Catalog: [`docs/RULES.md`](docs/RULES.md). Cursor rules: `.cursor/rules/`.
