# AGENTS.md

This file is **binding** for every AI coding agent (Cursor, Copilot, Claude, Codex, etc.).

If a request conflicts with these rules, **follow the rules** and explain the conflict. Do not “just this once” add NestJS, Prisma, Datadog, Expo Go, Figma, hex or `text-[20px]` in screens, Drizzle in controllers, or treat UPI return as SUCCESS.

## Required reading (in order)

1. [docs/IDEA.md](docs/IDEA.md) — product, loop, payment vs expense
2. [docs/TECH_STACK.md](docs/TECH_STACK.md) — locked stack
3. [docs/DESIGN.md](docs/DESIGN.md) — ink + lime + Inter
4. [docs/STANDARDS.md](docs/STANDARDS.md) — S/B/C/A codes
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, folders, request/data flow
6. [docs/AGENTS.md](docs/AGENTS.md) — how to change this repo (this is the long handbook)

Also: [docs/PRIVACY.md](docs/PRIVACY.md), [docs/DEVICE_TEST.md](docs/DEVICE_TEST.md), [docs/RULES.md](docs/RULES.md), [server/README.md](server/README.md), [client/AGENTS.md](client/AGENTS.md), [server/AGENTS.md](server/AGENTS.md).

Cursor loads [`.cursor/rules/`](.cursor/rules/). Those files **summarize**; `docs/` is the source of truth.

## Repo map

```text
client/     Expo app — install here (`bun install`)
server/     Express API — install here
  packages/api-contract   shared Zod + OpenAPI
docs/       spec agents must obey
```

There is **no** root `package.json` or root `node_modules`. Never recreate a Bun workspace at the repo root.

## Non-negotiables (one screen)

- We initiate UPI; we do **not** take PIN/OTP/bank secrets. Return from UPI app ≠ SUCCESS.
- PaymentAttempt ≠ Transaction (default type `unknown`).
- Server: Route → validate(Zod) → Controller → Service → Repository → Drizzle. `AppError` + `asyncHandler` + last `errorHandler`.
- Client: screens compose hooks; `components/ui` is dumb; NativeWind **token classes only** (`type-*`, never `text-[20px]` or hex); Inter; tabular amounts via `type-amount`; `unwrapApiResponse` / `unwrapSuccess` is the only JSON→type seam; query keys `["api", …]`.
- Amounts: integer rupees ₹1–₹1,00,000 as strings, IST for “this month”.
- Do not add: NestJS, Prisma, Datadog, Redis, Expo Go, Figma, Material UI, a second font, pay-by-VPA screen (v1).

## Commands

```bash
cd server && bun install && bun run dev
cd client && bun install && bun test
```

UPI: physical Android + `npx expo prebuild` + `npx expo run:android`. Not Expo Go.
