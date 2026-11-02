---
paths:
  - "client/lib/upi/**"
  - "client/lib/native/**"
  - "client/lib/payments/**"
  - "client/modules/upi-handoff/**"
  - "client/stores/**"
  - "client/hooks/usePayHandoff.ts"
  - "client/hooks/useResumePayment.ts"
  - "client/hooks/useScanUpi.ts"
  - "client/app/payment.tsx"
  - "client/app/**/scan.tsx"
  - "server/src/services/paymentStatus.ts"
  - "server/src/services/paymentService.ts"
  - "server/src/repositories/paymentRepository.ts"
---

# UPI payments

We start the payment and record what we can honestly know. The user's PIN and the transfer stay in PhonePe / GPay / Paytm / BHIM.

## Parsing

**QR strings are parsed only in [`parse.ts`](../../client/lib/upi/parse.ts), with table tests in `parse.test.ts`.** Require `upi://pay` and `pa=`. Reject `am=0` and out-of-range amounts. A bad QR shows a user-visible error and never crashes.

## Handoff

**The native module launches; it never parses a QR.** JS-only UPI is not the real path. [`modules/upi-handoff`](../../client/modules/upi-handoff/index.ts) holds the Kotlin and Swift, and `lib/native` wraps it.

- Android lists packages for `upi://pay`, uses `startActivityForResult`, and maps SUCCESS, FAIL and empty.
- iOS opens URL schemes, and the result is `unknown` until the user confirms.
- Debounce Pay with `PAY_DEBOUNCE_MS`, so a double tap cannot open two payments.
- No manual VPA screen in v1.

**Only a physical Android phone proves a handoff.** Follow [docs/DEVICE_TEST.md](../../docs/DEVICE_TEST.md).

## Status honesty

**Returning from the UPI app is not SUCCESS unless the Android extra says SUCCESS.** Anything else is `returned` or `unknown`, followed by "Confirm in your UPI app" and Paid / Failed / Cancelled. Never show a green check on return alone, because the money may not have moved.

## The status machine

```text
created          → upi_app_launched | returned | success | failed | unknown
upi_app_launched → returned | success | failed | unknown
returned         → success | failed | unknown
unknown          → success | failed
success, failed  → terminal
```

**The allowed moves live only in [`paymentStatus.ts`](../../server/src/services/paymentStatus.ts), tested in `paymentStatus.test.ts`.** `paymentService.patch` calls `canTransition` and does not repeat the table. Moving to the current status is allowed, so a retry after a lost response is safe.

Abandoned attempts become `unknown`, never `failed`: launched after `ABANDONED_LAUNCHED_MS` (15 min), created and unused after `ABANDONED_CREATED_MS` (60 min). The constants exist, but no job or read path applies them yet.

## The draft survives the app being killed

**The draft is Zustand persisted to MMKV, never URL params.** Android may kill the app while a UPI app is in front, so [`paymentDraft.ts`](../../client/stores/paymentDraft.ts) persists through `lib/storage/draft` and `useResumePayment` reopens a recorded payment that still needs its outcome.

- A newer scan owns the draft, so write through `updateSession` and `clearSession`. An older in-flight payment must not overwrite it.
- Save the retry key to the draft before any request can commit remotely, as [`records.ts`](../../client/lib/payments/records.ts) does.
