declare const tokens: {
  color: {
    light: Record<string, { hex: string; rgb: string }>;
    dark: Record<string, { hex: string; rgb: string }>;
  };
  icon: { size: number; stroke: number };
};

export = tokens;
