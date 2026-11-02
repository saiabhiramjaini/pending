---
paths:
  - "server/src/**"
---

# Working in `server/`

Express API on Bun (Node through `tsx`). Every request crosses the same layers and every failure leaves in the same envelope, so a new endpoint never needs its own error handling.

## The pipeline does not change

```text
json → cookieParser → cors → health/docs → routers → notFound → errorHandler
  route: auth? → validate(schema) → asyncHandler(controller)
    controller → service → repository → Postgres
```

**`errorHandler` stays last.** A failure that bypasses it reaches the client in a shape `unwrapSuccess` cannot read. [`sourceGuards.test.ts`](../../server/src/sourceGuards.test.ts) fails on a reordered [`app.ts`](../../server/src/app.ts).

## Each layer owns one job

| Path | Owns | Never |
|---|---|---|
| `src/index.ts` | listen, Sentry process handlers | |
| `src/app.ts` | middleware order | |
| `src/config/env.ts` | dotenv | |
| `src/errors/` | `AppError` | |
| `src/middlewares/` | `asyncHandler`, `validate`, auth, `notFound`, `errorHandler` | |
| `src/routes/` | path + middleware | business rules |
| `src/controllers/` | req/res, cookies, call service, success envelope | `db`, business rules |
| `src/services/` | rules, `AppError`, status machine | `res` |
| `src/repositories/` | Drizzle queries | HTTP, user-facing strings |
| `src/db/` | connection and schema | |

**Drizzle stays in repositories and `res` stays out of services.** The guard test fails on either.

```ts
// BAD: Drizzle in a controller
const rows = await db.select().from(users);

// GOOD
const user = await userRepository.findById(id);
```

```ts
// BAD: a 500 in every handler, which is a second error format
} catch (e) { res.status(500).json({ message: "Internal server error" }); }

// GOOD
export const get = asyncHandler(async (req, res) => { ... });
```

Services throw `new AppError(status, code, message, details?)`. Unknown exceptions become a 500 with no stack in the body, logged and sent to Sentry. See [`errorHandler.ts`](../../server/src/middlewares/errorHandler.ts).

## New endpoint

1. Add the Zod request and response to the contract ([`api-contract.md`](api-contract.md)), and register the OpenAPI path if it is public.
2. Route: `authMiddleware` if needed, `validate(schema)`, `asyncHandler(controller)`.
3. Controller: call the service, then `res.status().json({ success: true, message, data })`.
4. Service: rules and `AppError`. Check ownership: `row.userId === userId` or `403 FORBIDDEN`, as [`paymentService.get`](../../server/src/services/paymentService.ts) does.
5. Repository: queries only. Return rows or let database errors throw.

## Auth

- `Authorization: Bearer` first, then the `token` cookie, as [`authMiddleware.ts`](../../server/src/middlewares/authMiddleware.ts) reads them. The cookie is optional for a future web client, never the only mobile auth.
- bcrypt `BCRYPT_ROUNDS` and JWT `JWT_EXPIRES_IN` come from the contract constants.
- Sign-in failures always say "Invalid email or password", so a response never reveals which accounts exist.
- Never return `password`. There is no email verify or reset in the MVP.

## Tests

**Integration tests never run against the application database,** because they create and delete rows. They need a separate `pending_test` database through `TEST_DATABASE_URL`, and they skip without it. [server/README.md](../../server/README.md#verification) has the setup; CI always runs them.
