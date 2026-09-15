# Agent rules catalog

Mandatory reading order is in the repo-root [`AGENTS.md`](../AGENTS.md). This page lists **where** each rule lives.

## Precedence

1. Product and architecture in `docs/` (`IDEA`, `TECH_STACK`, `DESIGN`, `STANDARDS`, `ARCHITECTURE`, `PRIVACY`, `DEVICE_TEST`).
2. Long handbook [`docs/AGENTS.md`](AGENTS.md).
3. Root [`AGENTS.md`](../AGENTS.md) (index + non-negotiables).
4. Cursor summaries in [`.cursor/rules/`](../.cursor/rules/).

If a `.mdc` shortcut disagrees with `docs/`, **docs win**. Do not “just this once” violate a locked principle.

## Markdown (all agents)

| File | Role |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | Binding index |
| [`CLAUDE.md`](../CLAUDE.md) | Pointer for Claude/Codex |
| [`docs/AGENTS.md`](AGENTS.md) | How to change the repo |
| [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) | Folders, data, HTTP, navigation |
| [`docs/IDEA.md`](IDEA.md) | Product |
| [`docs/TECH_STACK.md`](TECH_STACK.md) | Locked stack |
| [`docs/DESIGN.md`](DESIGN.md) | Ink + lime + Inter; `type-*` classes; tokens.cjs |
| [`docs/STANDARDS.md`](STANDARDS.md) | S/B/C/A coding standards |
| [`docs/PRIVACY.md`](PRIVACY.md) | What we never collect |
| [`docs/DEVICE_TEST.md`](DEVICE_TEST.md) | Physical Android UPI |
| [`client/AGENTS.md`](../client/AGENTS.md) | Mobile ownership |
| [`server/AGENTS.md`](../server/AGENTS.md) | API ownership |

## Cursor (`.cursor/rules/*.mdc`)

| File | When |
|---|---|
| `pending-core.mdc` | Always |
| `server-architecture.mdc` | `server/src/**/*.ts` |
| `client-architecture.mdc` | `client/**/*.{ts,tsx}` |
| `design-system.mdc` | `client/{app,components}/**` |
| `api-contract.mdc` | `server/packages/api-contract/**` |
| `upi-payments.mdc` | Parse, native module, payment screens, status machine |
| `drizzle-data.mdc` | `server/src/db/**`, repositories |
| `observability.mdc` | Analytics / Sentry files |

Agents must follow **all** of these, not pick a subset.
