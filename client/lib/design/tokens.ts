import tokens from "./tokens.cjs";

export const icon = tokens.icon as { size: number; stroke: number };

export function chrome(scheme: "light" | "dark"): Record<string, string> {
  const palette = tokens.color[scheme] as Record<string, { hex: string }>;
  const out: Record<string, string> = {};
  for (const [name, swatch] of Object.entries(palette)) {
    out[name] = swatch.hex;
  }
  return out;
}
