const tokens = require("./lib/design/tokens.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    fontSize: tokens.fontSizeTheme(),
    spacing: tokens.spacingTheme(),
    borderRadius: {
      none: "0px",
      sm: tokens.px(tokens.radius.sm),
      md: tokens.px(tokens.radius.md),
      lg: tokens.px(tokens.radius.lg),
      full: tokens.px(tokens.radius.full),
    },
    extend: {
      colors: tokens.colorTheme(),
      fontFamily: {
        sans: ["Inter"],
      },
      minHeight: {
        tap: tokens.px(tokens.tap),
      },
      height: {
        tap: tokens.px(tokens.tap),
        skeleton: tokens.px(tokens.skeleton.sm),
        "skeleton-lg": tokens.px(tokens.skeleton.lg),
      },
      opacity: {
        disabled: String(tokens.opacity.disabled),
      },
    },
  },
  plugins: [],
};
