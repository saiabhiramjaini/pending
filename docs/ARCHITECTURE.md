# Architecture

Pending is two independently installed packages plus a shared Zod contract.

```text
client/     Expo (TypeScript, Expo Router, NativeWind)
server/     Express on Bun (tsx for Node)
  src/      HTTP + domain
  packages/api-contract
docs/       spec agents must follow
```

No root `package.json`. Do not reintroduce a hoisted workspace.

## Product data

```text
PaymentAttempt  (the UPI transfer we initiated)
    ↓
Transaction     (interpretation: unknown | expense | transfer | refund | other)
```

Never treat every UPI pay as an expense. Default `type = unknown`.

Status:

```text
created → upi_app_launched → returned → success | failed | unknown
```

Return from the UPI app is not success by itself.

## HTTP

Prefix `/api/v1`. Envelopes in `docs/AGENTS.md` §5.

Auth: `Authorization: Bearer`. Cookie optional for a future web client.

## Client navigation

```text
(tabs) Home | Scan | History
Scan → Payment (stack) → UPI app → Payment confirm → History
(auth) signin | signup
```

Payment draft: Zustand, not query params.

## Server layers

```text
Route → Middleware (auth, Zod) → Controller → Service → Repository → Drizzle → Neon
```

See `docs/AGENTS.md` for ownership and the new-endpoint recipe.

## Client layers

```text
app/ screen → hooks → lib/api | lib/storage | lib/upi | lib/native | lib/design
components/ui  presentational only — token classes, no hex/px
```

## Time and money

Timezone for totals: `Asia/Kolkata`. Amounts: decimal strings of integer rupees, ₹1–₹1,00,000.
