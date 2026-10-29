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

## Verification

Run `bun run typecheck` and `bun test` in both `server/` and `client/`.
CI also runs the Postgres integration tests for idempotency, status races,
atomic recording, account deletion, ownership, and pagination.

To run those tests locally, provision a **separate** Postgres database named
`pending_test`, apply the schema with `DATABASE_URL=<test-url> bun run db:push`,
then run `TEST_DATABASE_URL=<test-url> bun test`. Never use the application
database for integration tests. Without `TEST_DATABASE_URL`, the database
tests are skipped.

Transaction cursors are opaque strings containing a timestamp and row ID.
Pass `nextCursor` back unchanged; ordering includes the ID to handle timestamp
ties. The mobile client loads every page before calculating monthly totals.
Both local Postgres and Neon use the Postgres driver so payment recording and
account deletion can use interactive transactions.
