---
paths:
  - "client/lib/analytics.ts"
  - "client/hooks/**"
  - "client/app/_layout.tsx"
  - "server/src/index.ts"
  - "server/src/middlewares/errorHandler.ts"
---

# Observability

PostHog for product analytics, Sentry for errors. No Datadog.

## PostHog

**Event names are the union on `track` in [`analytics.ts`](../../client/lib/analytics.ts), so typecheck fails on any other name.** PostHog is imported only there, and [`sourceGuards.test.ts`](../../client/sourceGuards.test.ts) fails elsewhere. Do not invent an event; a new one changes the union and this list together.

`scan_opened` → `qr_parsed` → `upi_app_selected` → `upi_launched` → `payment_returned` → `status_confirmed` → `transaction_recorded`

Identify `userId` after auth. Send merchant name and amount, not a raw QR that may hold extra PII. Never send a PIN or OTP.

## Sentry

Expo wraps the root layout and Express reports through `errorHandler`.

**Both `beforeSend` hooks delete the `Authorization` header,** as [`_layout.tsx`](../../client/app/_layout.tsx) and [`index.ts`](../../server/src/index.ts) do, so a JWT never reaches Sentry. Keep them when you change either init.
