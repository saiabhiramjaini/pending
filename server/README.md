# Pending API

Express + TypeScript on **Bun** (Node-compatible via `tsx`). PostgreSQL on Neon + Drizzle.

## Layout

```text
server/
  src/               # Express app
  packages/api-contract  # shared Zod + OpenAPI
```

## Run (Bun)

```bash
cp .env.example .env
# Neon DATABASE_URL, or: docker compose up -d  (local Postgres)
# set JWT_SECRET to a long random string
bun install
bun run db:push
bun run dev          # 0.0.0.0:3000 so a phone on the LAN can reach it
```

## Run (Node.js)

```bash
bun run start:node   # or: npx tsx src/index.ts
```

## URLs

- `GET /api/v1/health`
- `GET /api/v1/docs` — OpenAPI UI
- `POST /api/v1/auth/signup` `signin` `signout`
- `GET /api/v1/user/profile`
- `DELETE /api/v1/user` — delete account
- `POST/GET/PATCH /api/v1/payments`
- `GET /api/v1/transactions`
