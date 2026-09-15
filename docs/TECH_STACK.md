# Pending — Tech stack

Locked choices. Do not reopen NestJS, Prisma, Datadog, Expo Go, or Figma.

| Piece | Choice |
|---|---|
| Language | TypeScript (strict) |
| Mobile | Expo + RN, **dev builds** |
| Routing | Expo Router `app/` |
| UI | NativeWind token classes (`type-*`). No hex/px in screens. |
| Type | Inter (`@expo-google-fonts/inter`), tabular nums for ₹ |
| Theme | Ink + lime, dark mode |
| Forms | React Hook Form + Zod |
| Client state | Zustand |
| Server state | TanStack Query (keys start with `api`) |
| Persistence (P1) | MMKV |
| Token store (P2) | expo-secure-store |
| Android UPI | Kotlin Expo module |
| iOS UPI | Swift Expo module |
| API | Express |
| Runtime | Bun |
| ORM | Drizzle |
| Postgres | Neon (prod). Local Docker Postgres allowed only to run the API without a Neon URL. |
| Contract | Zod in `server/packages/api-contract` |
| Spec | OpenAPI from Zod (`/api/v1/docs`) |
| Auth | JWT 7d, bcrypt 12, Bearer first |
| Analytics | PostHog |
| Errors | Sentry |
| API host | Later (local Bun + Neon) |
| Monorepo | Separate `client` and `server` installs (no root `node_modules`) |
| Amounts | ₹1–₹1,00,000, IST (`Asia/Kolkata`) |
| Pagination | Cursor, `API_PAGE_LIMIT = 50` |

Identity: display name **Pending**, Android `com.pending.app`, API prefix `/api/v1`.

See `docs/DESIGN.md` for tokens, `docs/STANDARDS.md` for rules, `docs/ARCHITECTURE.md` and `docs/AGENTS.md` for agents. Root `AGENTS.md` is binding.
