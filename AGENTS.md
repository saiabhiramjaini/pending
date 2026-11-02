# AGENTS.md

This file is **binding** for every AI coding agent (Claude, Codex, Copilot, etc.). If a request conflicts with a rule, follow the rule and explain the conflict.

Pending is a **payment-first** recorder: the user starts UPI in our app, pays in PhonePe / GPay / Paytm / BHIM, returns, and we have a record. We are not a UPI PSP, not a bank, and not an expense spreadsheet that asks for ₹500 to be typed in afterwards.

## Repo map

```text
client/     Expo app. Install here.
server/     Express API. Install here.
  packages/api-contract   shared Zod + OpenAPI
docs/       product and design references
```

**There is no root `package.json` or `node_modules`, and never a Bun workspace at the root.** `client` and `server` install separately, and `client` reads the contract through a `file:` dependency.

## Non-negotiables

- **We initiate UPI. We never take a PIN, OTP, card or bank secret.** The PIN stays in the UPI app.
- **Returning from a UPI app is not SUCCESS** unless the PSP result says SUCCESS explicitly.
- **PaymentAttempt is not Transaction.** A UPI transfer is not always an expense, so a new transaction's type is `unknown`.
- **Amounts are integer rupees as strings, ₹1–₹1,00,000.** Never do float money math. "This month" is `Asia/Kolkata`.
- **If the HTTP shape changes, change `server/packages/api-contract` first.**

## Never add

NestJS, Prisma, Datadog, Redis, BullMQ, Expo Go, Figma, Material UI, Paper, Tamagui, Geist, a second font or icon pack, microservices, Orval, Maestro, or a second error format, pagination helper or page size.

Not in v1: a pay-by-VPA screen, bank linking, Account Aggregator, an AI chatbot, family accounts, Hindi i18n, refresh tokens. See [docs/TECH_STACK.md](docs/TECH_STACK.md) for what we use instead.

## Coding principles

- TypeScript strict. `any` needs a same-line `// any: <why>`.
- One rule, one place: pagination, error maps and page size each have a single owner.
- Limits and durations are named constants in [`constants.ts`](server/packages/api-contract/src/constants.ts). Do not copy their values.
- A `switch` on a status handles every status.
- Comments state the enduring rule ("Returning from a UPI app is not SUCCESS"), not ticket history.
- Do not log tokens, a full QR that may hold PII, or a password hash. `JWT_SECRET` and `DATABASE_URL` are server-only; `EXPO_PUBLIC_*` is public.
- Do not commit `.env`, keystores or secrets. Do not `git commit` unless the user asked.

## Commands

```bash
cd server && bun install --cwd packages/api-contract && bun install
bun run dev
bun run db:push
bun run typecheck && bun test

cd client && bun install --cwd ../server/packages/api-contract && bun install
bun run typecheck && bun test
```

UPI needs a physical Android phone and a dev build: `npx expo prebuild && npx expo run:android`. An emulator or Expo Go cannot prove it.

## What is gated vs. what is judgment

CI runs `bun run typecheck` and `bun test` in `client/` and `server/`. There is no linter. These tests carry the mechanical rules, so fix the code, do not reword the rule:

- [`client/sourceGuards.test.ts`](client/sourceGuards.test.ts): off-scale classes, hex and `fontFamily` in UI, `fetch` outside `lib/api`, native stores in screens, `any`, banned dependencies.
- [`server/src/sourceGuards.test.ts`](server/src/sourceGuards.test.ts): Drizzle outside repositories, Express in services, offset pagination, middleware order, `any`, banned dependencies.
- [`server/src/agentRules.test.ts`](server/src/agentRules.test.ts): this file's wiring, rule paths and pointers, and relative links in every rule and doc.

Everything else in the rules is carried by review.

## Path-scoped rules

`.claude/rules/` holds the rules for each area, scoped by the paths they govern. Claude Code loads them by path. Other agents must read the one for the area they are touching.

| Rule | Read it when you touch |
|---|---|
| [`server.md`](.claude/rules/server.md) | `server/src/` |
| [`data.md`](.claude/rules/data.md) | The schema or a repository |
| [`api-contract.md`](.claude/rules/api-contract.md) | `server/packages/api-contract/`, envelopes, error codes |
| [`client.md`](.claude/rules/client.md) | `client/` code |
| [`design-system.md`](.claude/rules/design-system.md) | Screens, `components/ui`, tokens |
| [`upi-payments.md`](.claude/rules/upi-payments.md) | QR parsing, native handoff, the payment draft, payment status |
| [`observability.md`](.claude/rules/observability.md) | PostHog events, Sentry setup |

## Longer references

Nothing loads these for you. Read one when the work calls for it:

- [docs/IDEA.md](docs/IDEA.md): product, the loop, payment vs expense. Read it for product-facing changes.
- [docs/TECH_STACK.md](docs/TECH_STACK.md): the locked stack.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the layers and navigation fit together.
- [docs/DESIGN.md](docs/DESIGN.md): type, color and spacing values, and locked copy.
- [docs/DEVICE_TEST.md](docs/DEVICE_TEST.md): building the APK and the physical Android checklist.
- [docs/PRIVACY.md](docs/PRIVACY.md): what we store and never collect.
- [server/README.md](server/README.md): running the API and the integration tests.

## Changing the rules

Existing code, tooling and configuration are the primary guide. Document only what a reader cannot reliably infer from them. If examples conflict, ask.

- **A machine can check it:** add a guard test, not prose.
- **The whole repo needs it:** this file. **One area needs it:** a rule file. **It is long reference material:** `docs/`.
- **A new rule file** gets `paths:` and a row in the table above.
- **Write the rule in bold as a final statement**, then what breaks without it, a real file that shows it, the bounded exception, and what enforces it.
- **Each rule has one home,** so there is no precedence order. If two files disagree, one is stale: check the code and fix the wrong file.
- **Update a rule in the same change as the code it describes.** Write one down when review or a failure would otherwise teach it again.

## Before you finish

- The change touches one concern (a status transition **or** UI, not both unless required).
- Layers are respected, and the contract is updated if HTTP changed.
- Pure logic has a test next to it.
- `bun run typecheck` and `bun test` pass in each package you touched.
