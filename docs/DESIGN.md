# Pending — Design system

Code-only. No Figma. **Hex and px exist in one place:** `client/lib/design/tokens.cjs` (copied into `client/global.css` as RGB channels). Tailwind maps those tokens in `client/tailwind.config.js`.

This file holds the values. The rules for using them are in [`design-system.md`](../.claude/rules/design-system.md).

## Type

| Class | Also | Size / line | Weight | Use |
|---|---|---|---|---|
| `type-caption` / `text-xs` / `text-caption` | | 13 / 18 | 400 | VPA, helper, “this month” |
| `type-label` | | 13 / 18 | 500 | Field labels, badge text |
| `type-body` / `text-sm` / `text-body` | | 16 / 24 | 400 | Copy, buttons |
| `type-title` / `text-md` / `text-title` | | 20 / 28 | 600 | Screen titles |
| `type-display` / `text-lg` / `text-display` | | 32 / 40 | 700 | Home month total only |
| `type-amount` | | (adds `tabular-nums`) | | Every rupee figure |

`text-xs` … `text-lg` are the same scale (xs=caption, sm=body, md=title, lg=display).

Inter only: 400 body, 500 labels, 600 titles/buttons, 700 display.

## Color

CTA = `bg-lime` + `text-on-lime` (never white on lime; `text-ink` turns light in dark mode). Paid `success`, failed `danger`, unknown `warning`.

| Token class | Light | Dark |
|---|---|---|
| `paper` | `#F6F7F4` | `#0B0F0C` |
| `ink` | `#0B0F0C` | `#F6F7F4` |
| `ink-muted` | `#5C635E` | `#9AA39C` |
| `line` | `#E2E6E1` | `#242A26` |
| `surface` | `#FFFFFF` | `#161B17` |
| `lime` | `#C8F54A` | `#C8F54A` |
| `on-lime` | `#0B0F0C` | `#0B0F0C` |
| `success` | `#0F7B4B` | `#3DDC84` |
| `danger` | `#C0362C` | `#FF6B62` |
| `warning` | `#C47B16` | `#F5A524` |

Native chrome that cannot take classNames (tab bar, lucide `color`) must import `chrome(scheme)` and `icon` from `client/lib/design/tokens.ts` — still no hex literals in the file.

## Space, radius, tap

Spacing keys (px behind the token): `0 1 2 3 4 6 8 12` → 0 / 4 / 8 / 12 / 16 / 24 / 32 / 48.

- `min-h-tap` / `h-tap` — 44pt hit target
- `h-skeleton` / `h-skeleton-lg` — loading blocks
- `rounded-sm` 8, `rounded-md` 12 (cards, buttons, inputs), `rounded-lg` 16, `rounded-full` pills
- `opacity-disabled` for disabled controls

Do not invent `p-5`, `mt-7`, `h-16`, `rounded-xl`.

## Primitives

`Button`, `Card`, `Chip`, `Input`, `Screen`, `ScreenHeader`, `StatusBadge`, `EmptyState`, `ErrorState`, `ScreenSkeleton`, `PaymentRow`, `BucketIcon`, `BucketPicker`, `BucketSheet`, `BucketBars`.

Icons: `lucide-react-native` with `icon.size` and `icon.stroke` from tokens (24 / 2).

Chrome: tabs Home | Scan | History. Payment is a stack screen.

Dark: `dark` class on root + `useColorScheme`. CSS variables flip with `.dark`.

## Copy

- Home empty: “No payments yet. Scan a UPI QR to start.”
- History empty: “Nothing recorded.”
- Error: “Something went wrong. Try again.”
- Unknown status: “Confirm in your UPI app.”
