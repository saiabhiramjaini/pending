---
paths:
  - "client/app/**"
  - "client/components/**"
  - "client/lib/design/**"
  - "client/global.css"
  - "client/tailwind.config.js"
---

# Design system

Ink + lime + Inter, in code only. The values and locked copy are in [docs/DESIGN.md](../../docs/DESIGN.md). This file says how to use them.

**Hex and px exist only in [`tokens.cjs`](../../client/lib/design/tokens.cjs).** `global.css` and `tailwind.config.js` map them, so one edit retints the app in both themes. Need a new size or color? Add it to `tokens.cjs` first, then use the class.

## Screens and `components/ui` use token classes only

[`sourceGuards.test.ts`](../../client/sourceGuards.test.ts) fails on all of these in `app/` and `components/`:

- Arbitrary values: `text-[20px]`, `min-h-[44px]`, any `-[…]`
- Off-scale sizes: `h-24`, `leading-10`, `p-5`, `mt-7`, `text-base`, `text-xl`, `rounded-xl`
- Hex and `fontFamily`
- `style={{ fontSize, color, padding, margin }}`

```tsx
// BAD
<Text className="font-sans text-[20px] font-semibold text-ink">Pay</Text>

// GOOD
<Text className="type-title text-ink">Pay</Text>
```

**Use `type-*` for text.** `text-xs` to `text-lg` are aliases of the same scale. No screen uses them, so do not start.

- `type-display` is only for the Home month total. Every rupee figure uses `type-amount` for tabular numbers.
- A CTA is `bg-lime` with `text-ink`, never white on lime.
- Paid is `success`, failed is `danger`, unknown is `warning`.
- Hit targets are `min-h-tap`. Disabled controls use `opacity-disabled`.

## Reuse the primitives

`Button`, `Card`, `Input`, `Screen`, `StatusBadge`, `EmptyState`, `ErrorState`, `ScreenSkeleton`. Extend these; do not build a one-off card in a screen file.

- Icons are `lucide-react-native` sized with `icon` from [`tokens.ts`](../../client/lib/design/tokens.ts). The tab bar and other native chrome that cannot take a class use `chrome(scheme)`.
- Tabs are Home | Scan | History. Payment is a stack screen.
- Dark mode is `.dark` on the root plus `useColorScheme`. Keep the splash up until fonts load.

**Empty, error and unknown-status copy is locked** in [docs/DESIGN.md](../../docs/DESIGN.md#copy). Do not write new or cheeky versions.
