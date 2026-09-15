# Client agents

You are in the Expo app. Binding spec: repo-root [`AGENTS.md`](../AGENTS.md) and [`docs/AGENTS.md`](../docs/AGENTS.md). Design: [`docs/DESIGN.md`](../docs/DESIGN.md).

## Own this tree

| Path | Owns |
|---|---|
| `app/` | Screens and layouts. Compose hooks + `components/ui`. |
| `components/ui/` | Dumb primitives. No API, MMKV, UPI parse. |
| `hooks/` | Data and flow. |
| `lib/upi/` | Parse/build URI only (tested). |
| `lib/native/` | TS wrapper for `modules/upi-handoff`. |
| `lib/api/` | HTTP client, unwrap, session. |
| `lib/storage/` | MMKV. |
| `lib/design/` | Visual tokens. Only file allowed to contain px/hex (`tokens.cjs`). |
| `stores/` | Zustand payment draft. |
| `modules/upi-handoff` | Kotlin + Swift. PIN stays in the UPI app. |

## Must

- NativeWind **token classes** (`type-title`, `type-body`, `min-h-tap`). Amounts `type-amount`. No hex, no `text-[20px]`, no extra `fontFamily` in `app/`. New sizes go in `lib/design/tokens.cjs` first.
- `unwrapSuccess` / `unwrapApiResponse` is the only JSON→type seam. Query keys `["api", …]`.
- `enabled: status === "ready" && client !== null` for authenticated queries.
- First sign-in: `discardLocalPayments()`. Do not dual-write after sign-in.
- Returning from a UPI app is not SUCCESS unless the PSP result is explicit SUCCESS.

## Commands

```bash
bun install
bun test
npx expo prebuild && npx expo run:android   # physical device, not Expo Go
```
