---
paths:
  - "client/**/*.ts"
  - "client/**/*.tsx"
  - "client/metro.config.js"
---

# Working in `client/`

Expo dev client with Expo Router. Screens compose hooks and `components/ui`; everything else lives below them.

## Each folder owns one job

| Path | Owns | Never |
|---|---|---|
| `app/` | Screens and layouts | QR parsing, `fetch`, SecureStore, MMKV |
| `components/ui/` | Dumb primitives | API, MMKV, UPI parsing |
| `hooks/` | Data and flow (`useScanUpi`, `usePayHandoff`, `usePayments`) | |
| `hooks/api/` | `useApiQuery` and mutations | |
| `lib/api/` | HTTP client, unwrap, errors, session provider | |
| `lib/payments/` | Recording logic behind `usePayments` and `usePayHandoff` | |
| `lib/storage/` | MMKV | |
| `lib/upi/`, `lib/native/`, `modules/upi-handoff/`, `stores/` | See [`upi-payments.md`](upi-payments.md) | |
| `lib/design/`, `global.css` | See [`design-system.md`](design-system.md) | |

[`sourceGuards.test.ts`](../../client/sourceGuards.test.ts) fails on `fetch` outside `lib/api`, on native stores or `upi://` in screens, on global `crypto` (use `expo-crypto`), and on a primitive importing `lib/api`, `lib/storage`, `lib/upi`, `lib/native`, `hooks` or `stores`. A type-only import is allowed.

## Use the locked library for each job

| Use | Not |
|---|---|
| Expo Router in `client/app` | ad-hoc React Navigation trees |
| TanStack Query for server data | `fetch` in screens |
| React Hook Form + Zod for forms | hand-rolled validation |
| MMKV for local payments | AsyncStorage |
| SecureStore for the JWT | AsyncStorage |

## Server data goes through the session

```text
Screen → hook → (local MMKV | ApiSession client)
```

```ts
// BAD
useEffect(() => { fetch(process.env.EXPO_PUBLIC_API_URL + "/api/v1/transactions"); }, []);

// GOOD
useApiQuery(["api", "transactions"], (client) => client.listTransactions());
```

- **`unwrapSuccess` / `unwrapApiResponse` is the only JSON→type seam. No `as` on API bodies,** because a cast hides a contract change until it fails at runtime.
- **Query keys start with `"api"`,** because sign-out clears everything under `["api"]`. A key outside it would keep one user's data after sign-out.
- Authenticated queries wait for `status === "ready" && client !== null`. [`useApiQuery`](../../client/hooks/api/useApiQuery.ts) handles this, so use it.
- Mutations set `retry: false`. A 401 on a signed-in call signs the user out.
- Screens never see the token or SecureStore. `ApiSessionProvider` status is `loading | signed_out | ready`.

## Signed-in and unsigned users have one source of truth each

Unsigned payments live in MMKV. First sign-in calls `discardLocalPayments()`. **Never dual-write after sign-in,** because two stores would disagree about what happened.

## History

The client loads every page through [`listAllTransactions`](../../client/lib/api/transactions.ts) before calculating monthly totals, because a total from the first page alone would be too low. Mutations only mark history stale; it reloads once when a list is shown again.

Home and History each handle empty, error and loading.

## The contract reaches Metro through config

[`metro.config.js`](../../client/metro.config.js) watches `server/packages/api-contract` and resolves `@pending/api-contract` to it. Keep both, because the preview APK's JS bundle does not compile without them.
