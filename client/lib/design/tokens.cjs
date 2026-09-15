/**
 * Single source for Pending visual tokens.
 * Hex and px live here (and as CSS variables copied into global.css).
 * Screens and ui primitives must use class names / JS exports — never raw px or hex.
 */

function swatch(hex, r, g, b) {
  return { hex, rgb: `${r} ${g} ${b}` };
}

const color = {
  light: {
    paper: swatch("#F6F7F4", 246, 247, 244),
    ink: swatch("#0B0F0C", 11, 15, 12),
    "ink-muted": swatch("#5C635E", 92, 99, 94),
    line: swatch("#E2E6E1", 226, 230, 225),
    surface: swatch("#FFFFFF", 255, 255, 255),
    lime: swatch("#C8F54A", 200, 245, 74),
    success: swatch("#0F7B4B", 15, 123, 75),
    danger: swatch("#C0362C", 192, 54, 44),
    warning: swatch("#C47B16", 196, 123, 22),
  },
  dark: {
    paper: swatch("#0B0F0C", 11, 15, 12),
    ink: swatch("#F6F7F4", 246, 247, 244),
    "ink-muted": swatch("#9AA39C", 154, 163, 156),
    line: swatch("#242A26", 36, 42, 38),
    surface: swatch("#161B17", 22, 27, 23),
    lime: swatch("#C8F54A", 200, 245, 74),
    success: swatch("#3DDC84", 61, 220, 132),
    danger: swatch("#FF6B62", 255, 107, 98),
    warning: swatch("#F5A524", 245, 165, 36),
  },
};

/** Space scale in px: 0 / 4 / 8 / 12 / 16 / 24 / 32 / 48 */
const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
};

const type = {
  xs: { size: 13, line: 18 },
  sm: { size: 16, line: 24 },
  md: { size: 20, line: 28 },
  lg: { size: 32, line: 40 },
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

const tap = 44;
const icon = { size: 24, stroke: 2 };
const skeleton = { sm: 64, lg: 96 };
const opacity = { disabled: 0.5 };

function px(n) {
  return `${n}px`;
}

function fontSizeTheme() {
  const xs = [px(type.xs.size), { lineHeight: px(type.xs.line) }];
  const sm = [px(type.sm.size), { lineHeight: px(type.sm.line) }];
  const md = [px(type.md.size), { lineHeight: px(type.md.line) }];
  const lg = [px(type.lg.size), { lineHeight: px(type.lg.line) }];
  return {
    xs,
    sm,
    md,
    lg,
    caption: xs,
    body: sm,
    title: md,
    display: lg,
  };
}

function spacingTheme() {
  const out = {};
  for (const [key, value] of Object.entries(space)) {
    out[key] = px(value);
  }
  out.tap = px(tap);
  out.skeleton = px(skeleton.sm);
  out["skeleton-lg"] = px(skeleton.lg);
  return out;
}

function colorTheme() {
  const names = Object.keys(color.light);
  const out = {};
  for (const name of names) {
    out[name] = `rgb(var(--${name}) / <alpha-value>)`;
  }
  return out;
}

module.exports = {
  color,
  space,
  type,
  radius,
  tap,
  icon,
  skeleton,
  opacity,
  px,
  fontSizeTheme,
  spacingTheme,
  colorTheme,
};
