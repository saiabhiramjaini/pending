---
paths:
  - "server/src/db/**"
  - "server/src/repositories/**"
  - "server/drizzle.config.ts"
---

# Data layer

Schema lives in [`schema.ts`](../../server/src/db/schema.ts). Postgres is Neon in production; Docker Postgres is only for running the API locally without a Neon URL. Do not use Prisma, a second ORM, or Render free Postgres.

**Repositories are the only callers of `db`.** Services work with what repositories return. [`sourceGuards.test.ts`](../../server/src/sourceGuards.test.ts) fails on Drizzle in a route, controller, service or middleware. Integration tests are the exception, because they arrange rows directly.

**Creating a payment inserts `payment_attempts` and `transactions` (`type: "unknown"`) in one database transaction.** An attempt without its transaction would never show up in History. [`paymentRepository.create`](../../server/src/repositories/paymentRepository.ts) is the exemplar and `payment.integration.test.ts` covers atomic recording.

**`(userId, idempotencyKey)` is unique, and the same key returns the existing attempt.** A retry after a lost response must not record a second payment.

**Status updates compare the previous status in the `WHERE`,** as `paymentRepository.updateStatus` does, so two racing updates cannot both win. The allowed moves live in [`upi-payments.md`](upi-payments.md).

**Lists use a cursor, newest first, limited by `API_PAGE_LIMIT`. Never offset.** The guard test fails on `.offset(`. A cursor holds a timestamp and the row ID, so ordering survives timestamp ties, and callers pass `nextCursor` back unchanged.

**Amounts are stored as integer-rupee strings** matching `amountRupeesSchema`.
