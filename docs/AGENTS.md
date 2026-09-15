# Agent handbook — Pending

**Status: mandatory.** Implement features by extending this architecture. Do not invent a parallel stack, a second error format, a second pagination helper, or a second design language.

Cursor also loads `.cursor/rules/*.mdc`. Those rules summarize this file. If they disagree, **this handbook and `docs/` win**.

---

## 1. Mission

Pending is a **payment-first** recorder: the user starts UPI in our app, pays in PhonePe / GPay / Paytm / BHIM, returns, we have a record.

We are **not** a UPI PSP, not a bank, not an expense spreadsheet that requires typing ₹500 after the fact.

North-star: fraction of the user’s UPI payments that started in Pending.

---

## 2. How to start any task

1. Read `docs/IDEA.md` if the change is product-facing.
2. Identify the layer: `client/app` (screen), `client/components/ui`, `client/lib`, `client/hooks`, `server/src/routes` … `repositories`, or `server/packages/api-contract`.
3. Put code **only** in the layer that owns it (tables below).
4. If the HTTP shape changes, change **Zod in `server/packages/api-contract` first**, then `validate()`, then client `unwrapSuccess` + schema.
5. Add or extend a test next to the pure logic (`parse.test.ts`, `paymentStatus.test.ts`, `unwrap.test.ts`, `app.test.ts`).
6. Do not commit `.env`, keystores, or secrets. Do not `git commit` unless the user asked.

---

## 3. Locked stack (do not reopen)

| Use | Do not use |
|---|---|
| TypeScript strict | `any` without a one-line why |
| Expo + **dev client** | Expo Go |
| Expo Router `client/app` | ad-hoc React Navigation trees |
| NativeWind + Inter token classes (`type-*`) | Paper, Tamagui, Geist, hex / `text-[20px]` in `app/` |
| Zustand draft | stuffing QR fields in the URL |
| TanStack Query for server data | `fetch` in screens |
| MMKV local (unsigned) | AsyncStorage for payments |
| SecureStore for JWT | JWT in AsyncStorage |
| Kotlin/Swift `client/modules/upi-handoff` | JS-only UPI as the real path |
| Express + Bun (Node via `tsx`) | NestJS |
| Drizzle + Neon (Docker Postgres for local only) | Prisma, Render free Postgres |
| Zod contract package | hand-written OpenAPI YAML as source of truth |
| JWT Bearer + bcrypt 12 | cookies as the only mobile auth |
| PostHog + Sentry | Datadog |
| Separate `client` / `server` installs | root workspace `node_modules` |

---

## 4. Folder ownership

```text
client/
  app/                 screens + layouts ONLY (compose hooks + ui)
  components/ui/       dumb primitives (no fetch, no MMKV, no UPI parse)
  hooks/               data + flow (useScanUpi, usePayHandoff, usePayments)
  hooks/api/           useApiQuery / mutations
  lib/upi/             parse + build URI (pure, unit-tested)
  lib/native/          thin TS wrapper around native module
  lib/storage/         MMKV
  lib/api/             client, unwrap, errors, session provider
  lib/design/          tokens.cjs (only px/hex) + chrome/icon for native APIs
  lib/analytics.ts     PostHog event names from the spec only
  stores/              Zustand paymentDraft
  modules/upi-handoff  Kotlin + Swift
  global.css           RGB CSS variables + `type-*` classes

server/
  src/index.ts         listen, Sentry process handlers
  src/app.ts           middleware order
  src/config/env.ts    dotenv
  src/errors/          AppError only
  src/middlewares/     asyncHandler, validate, auth, notFound, errorHandler
  src/routes/          path + middleware; no business rules
  src/controllers/     req/res, cookies, call service, envelope JSON
  src/services/        rules, AppError, status machine
  src/repositories/    Drizzle only
  src/db/              connect + schema
  packages/api-contract  Zod + OpenAPI registry
```

**Forbidden placements**

- Drizzle / `db.` in a controller or route.
- `res.status` in a service or repository.
- `parseUpiQr` regex in a `.tsx` screen.
- `fetch(EXPO_PUBLIC_API_URL + …)` in `app/`.
- New hex colors or `text-[20px]` / `min-h-[44px]` in `app/` or `components/ui`.
- Random `fontFamily: "…"`.
- A second `ERROR_MESSAGES` table.
- A second page-size constant besides `API_PAGE_LIMIT`.

---

## 5. Server request pipeline (must not change)

```text
json → cors → cookieParser → health/docs → routers
  route: auth? → validate(schema) → asyncHandler(controller)
    controller → service → repository → Neon
unmatched → notFound → errorHandler (LAST)
```

### Envelopes

Success:

```json
{ "success": true, "message": "…", "data": {} }
```

Error (always):

```json
{ "success": false, "code": "NOT_FOUND", "message": "…", "details": [] }
```

Codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UPI_STATUS_UNKNOWN`, `INTERNAL_ERROR`.

Unknown exceptions → 500, **no stack in production body**. Log + Sentry. Scrub `Authorization`.

### New endpoint recipe

1. Add Zod request/response to `server/packages/api-contract`.
2. Register OpenAPI path if it is public API.
3. Route: `validate` + `authMiddleware` if needed + `asyncHandler`.
4. Controller: call service, `res.status().json({ success: true, … })`.
5. Service: throw `new AppError(status, code, message, details?)`.
6. Repository: queries only; return rows or throw DB errors (not HTTP).
7. Ownership: `row.userId === req.auth.userId` or `FORBIDDEN`.
8. Lists: cursor + `API_PAGE_LIMIT` (50), newest first. No offset pagination.

### Status machine (payments)

```text
created → upi_app_launched | returned | success | failed | unknown
upi_app_launched → returned | success | failed | unknown
returned → success | failed | unknown
success → (terminal)
failed → (terminal)
unknown → success | failed
```

Logic lives **only** in `server/src/services/paymentStatus.ts`. Tests in `paymentStatus.test.ts`.

Creating a payment **must** insert `payment_attempts` and `transactions` (type `unknown`) in **one** DB transaction.

Idempotency: unique `(userId, idempotencyKey)`. Same key returns the existing attempt.

Abandoned (when you implement a job or on read): launched + 15 min → `unknown`; created unused 60 min → `unknown`. Never auto-`failed`.

### Auth

- bcrypt 12, JWT 7d HS256, `JWT_SECRET` server-only.
- Bearer first, then cookie.
- Sign-in errors: generic “Invalid email or password”.
- Never return `password`.
- No email verify / reset in MVP.

---

## 6. Client data flow (must not change)

```text
Screen → hook → (local MMKV | ApiSession client)
ApiSessionProvider: status loading | signed_out | ready
ready → Authorization Bearer from memory (SecureStore persist)
unwrapSuccess(schema, json, httpStatus)
queryKey: ["api", resource, …]
sign-out: removeQueries { queryKey: ["api"] }
first sign-in: discardLocalPayments()
```

Screens **never** know about `/auth.token`, SecureStore, or Drizzle.

`enabled: status === "ready" && client !== null` on authenticated queries.

Mutations: `retry: false`. HTTP 401 on a signed-in call → `signOut`.

Do not dual-write two sources of truth after sign-in. Unsigned users: MMKV only.

---

## 7. UPI (must not change)

- Parse/build only in `client/lib/upi/parse.ts`. Table-test it.
- QR: `upi://pay` + `pa=` required. Else user-visible error, no crash.
- Amount: whole rupees, ₹1–₹1,00,000.
- Native module launches; it does not parse QR.
- Android: list packages for `upi://pay`, `startActivityForResult`, map SUCCESS/FAIL/empty.
- iOS: URL schemes; result is `unknown` until the user confirms.
- **Returning from the UPI app is not SUCCESS** unless the PSP extra is explicit SUCCESS.
- Confirm copy: “Confirm in your UPI app” + Paid / Failed / Cancelled.
- Never collect PIN, OTP, cards.
- Debounce Pay 800ms (`PAY_DEBOUNCE_MS`).
- Device test: `docs/DEVICE_TEST.md`. Emulator is not enough.

---

## 8. Design system (must not change)

Tokens: `client/lib/design/tokens.cjs` → `client/global.css` + `client/tailwind.config.js`. See `docs/DESIGN.md`.

- Screens use **`type-caption` / `type-label` / `type-body` / `type-title` / `type-display` / `type-amount`**. Never `text-[20px]`, `text-base`, or `fontFamily`.
- CTA: lime background, **ink** text (not white on lime).
- Display (`type-display`) only for Home month total. Amounts `type-amount`.
- Primitives: Button, Card, Input, Screen, StatusBadge, EmptyState, ErrorState, ScreenSkeleton. Extend these; don’t one-off a new card in the screen file.
- Icons: `lucide-react-native` via `icon.size` / `icon.stroke` from `lib/design/tokens.ts`. Tab bar colors via `chrome(scheme)`.
- Tabs: Home | Scan | History. Payment is a stack screen.
- Empty/error copy is locked (see DESIGN.md). Do not invent cheeky copy.
- Space keys `0 1 2 3 4 6 8 12` only. Radius `sm md lg full`. Hit `min-h-tap`. Disabled `opacity-disabled`.
- Dark: `.dark` on root + `useColorScheme`. Keep splash until fonts load.
- New token → edit `tokens.cjs` first. No Figma. No second icon pack.

---

## 9. Contract-first HTTP

`server/packages/api-contract` is the spec.

- Change schemas there before handlers or hooks.
- Generate OpenAPI from Zod (`/api/v1/docs`). Do not maintain a separate YAML as source.
- Client: `unwrapSuccess` / `unwrapApiResponse` with those schemas. **No `as` on API JSON.**
- Prefix query keys with `"api"`.

---

## 10. Observability

PostHog events (only these names unless the spec is updated):

`scan_opened`, `qr_parsed`, `upi_app_selected`, `upi_launched`, `payment_returned`, `status_confirmed`, `transaction_recorded`.

Identify `userId` after auth. No PIN. Prefer merchant name + amount, not raw QR dumps.

Sentry: Expo wrap + `errorHandler`. Scrub Authorization. No Datadog.

---

## 11. Security

- `JWT_SECRET`, `DATABASE_URL`, server Sentry DSN: server-only.
- `EXPO_PUBLIC_*` are public.
- Never log tokens or full QR if it includes extra PII.
- We are not a PSP.

---

## 12. What not to build (v1)

Manual VPA pay screen, NestJS, Prisma, Datadog, Redis, BullMQ, microservices, bank linking, AA, AI chatbot, family accounts, Hindi i18n, Orval, Maestro, refresh tokens, root Bun workspace.

---

## 13. Definition of a good PR from an agent

- Touches one concern (e.g. status transition **or** UI, not both unless required).
- Layers respected.
- Contract updated if HTTP changed.
- Tests for pure logic.
- No new hex, no `text-[20px]`, no new error envelope, no new page size.
- Comments state the **rule** (“Returning from a UPI app is not SUCCESS”), not ticket IDs.
