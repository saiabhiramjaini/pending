# Pending — Coding standards

If a rule and a shortcut conflict, the rule wins. Comments state the enduring rule, not ticket history.

Full agent handbook: [docs/AGENTS.md](AGENTS.md). Architecture diagram: [docs/ARCHITECTURE.md](ARCHITECTURE.md). Cursor rules: `.cursor/rules/`.

## Types (S)

- **S1** TypeScript `strict`. No `any` unless a one-line comment says why.
- **S2** One rule, one place (pagination, error maps, page size).
- **S3** No `as` on API bodies. Zod then `z.infer`.
- **S5** Pure UPI parse in `lib/upi`. Native module only launches.
- **S7** Named constants: bcrypt `12`, JWT `7d`, `API_PAGE_LIMIT = 50`.
- **S9** Exhaustive status switches.
- **S10** Amounts as decimal strings, never float money math.

## Backend (B)

- Controllers → services → repositories. No Drizzle in controllers. No `res` in services.
- `asyncHandler` on every async controller. Services throw `AppError`.
- Middleware: json → cors → cookieParser → health → routers → notFound → errorHandler.
- Status transitions only in `paymentService`. Create attempt + transaction in one DB transaction.
- Ownership: token `userId` must match. Generic sign-in errors. Strip password from JSON.

## Frontend (C)

- Screens compose hooks + UI. `components/ui` is dumb.
- Session lifted in `ApiSessionProvider`. Draft in Zustand.
- NativeWind token classes (`type-*`, `min-h-tap`). Amounts `type-amount`. No hex, no `text-[20px]`, no extra `fontFamily` in `app/` or `components/ui`.
- Empty / error / loading on Home and History.
- Do not log tokens, full QR PII, or PIN (we never have PIN).

## API client (A)

- Single client from session. `unwrapApiResponse` is the only JSON→type seam.
- Authenticated hooks wait for `status === "ready"`.
- Query keys `["api", …]`. Discard MMKV on first sign-in. No dual write.

## Security

JWT_SECRET and DATABASE_URL are server-only. `EXPO_PUBLIC_*` are public. We are not a PSP.

## Testing

Table tests for UPI parse/build. Payment transition tests. Device test required for UPI (emulator is not enough).
