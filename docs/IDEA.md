# Pending — Idea

A payment-first financial assistant that lets users pay through their preferred UPI app while automatically building a real-time understanding of their spending.

## Problem

Traditional expense apps fail in two ways.

**Manual tracking.** User pays, then later types `₹500 → Food → Save`. Friction kills the habit.

**Bank-account tracking.** The app imports after the fact. Still reactive: payment happens → statement/SMS → user checks later.

Competitors already scan QR and initiate UPI. Competing on “we can scan a QR and pay” is not enough.

## Solution

The expense app is the **starting point** for UPI, not the place you log after.

We do **not** replace PhonePe / Google Pay / Paytm / BHIM. Those apps still take UPI PIN and complete the transfer. We own: QR entry, merchant/amount context, handoff, recording, later intelligence.

```text
Open our app → Scan merchant UPI QR → Read merchant + amount
  → Choose installed UPI app → Pay there → Return → Transaction recorded
```

Traditional capture: Payment → bank/SMS → expense app → analysis.

Ours: Payment **intention** → our app → UPI app → payment → record → analysis.

## Product stages

**Stage 1 — Capture.** Automatically create the record when payment starts in-app.

**Stage 2 — Understand.** Patterns, categories, recurring, merchants, unusual spend, cash-flow.

**Stage 3 — Act.** Proactive insights. Deterministic code computes totals; AI only narrates structured context after the loop is proven.

## MVP goal

Answer: **Will users start UPI from our app if the expense is recorded automatically?**

North-star: share of the user’s UPI payments that went through our app.

Also track: first successful payment; QR → launched → completed; payments per active user; D3/D7; “would you keep opening us instead of PhonePe?”

## Must-haves

Home (Scan & Pay, totals, recent), QR scanner, UPI app picker, handoff, record, history.

Screens: Home, Scan, Payment, History. Tabs: Home | Scan | History. Payment is a stack screen.

## Out of MVP

Bank linking, Account Aggregator, investments, loans, cards, bill pay, rewards, family accounts, advanced budgets, AI chatbot, forecasting, microservices, Datadog, Redis, BullMQ, NestJS, Prisma, Expo Go, Figma.

## Payment vs expense

A UPI transfer is not always an expense. Keep **PaymentAttempt** and **Transaction interpretation** separate. Default type `unknown`.

## Status machine

```text
CREATED → UPI_APP_LAUNCHED → RETURNED → SUCCESS | FAILED | UNKNOWN
```

Returning from the UPI app is **not** success. Never collect UPI PIN, OTP, bank passwords, or card data.

## Philosophy

1. Zero manual expense entry after a pay started in-app.
2. Do not replace existing UPI apps.
3. Recording is the start; value is understand → predict → help.
