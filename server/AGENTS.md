# Server agents

You are in the Express API. Binding spec: repo-root [`AGENTS.md`](../AGENTS.md) and [`docs/AGENTS.md`](../docs/AGENTS.md). Architecture: [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Pipeline (do not reorder)

`json → cors → cookieParser → health/docs → routers → notFound → errorHandler`

## Layers (do not skip)

Route → `authMiddleware`? → `validate(Zod)` → `asyncHandler` → Controller → Service → Repository → Drizzle.

- Controllers: no `db.`, no business rules.
- Services: throw `AppError`. Never `res`.
- Repositories: Drizzle only. No HTTP strings.
- Payment status: only `src/services/paymentStatus.ts`.

## Contract first

Change [`packages/api-contract`](packages/api-contract) before handlers. Register OpenAPI. Envelopes:

- Success `{ success: true, message, data }`
- Error `{ success: false, code, message, details }`

Lists: cursor + `API_PAGE_LIMIT` (50). Ownership: `row.userId === req.auth.userId`.

Auth: Bearer then cookie. bcrypt 12. Strip `password`.

Create payment: attempt + transaction (`type: unknown`) in **one** DB transaction. Idempotency `(userId, idempotencyKey)`.

## Commands

```bash
bun install
bun run db:push
bun run dev
bun test
```

Never commit `.env` or `JWT_SECRET`.
