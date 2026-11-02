import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Rules that typecheck cannot express. Each guard reports every offending location.
const root = import.meta.dir;
const UI = ["app", "components"];
const SOURCE = ["app", "components", "hooks", "lib", "stores"];

function sourceFiles(dirs: string[], except: string[] = []) {
  return dirs.flatMap((dir) =>
    [...new Bun.Glob(`${dir}/**/*.{ts,tsx}`).scanSync({ cwd: root })].filter(
      (file) => !file.includes(".test.") && !except.some((path) => file.startsWith(path)),
    ),
  );
}

function offenders(files: string[], pattern: RegExp) {
  return files.flatMap((file) => {
    const text = readFileSync(join(root, file), "utf8");
    return [...text.matchAll(pattern)].map((match) => {
      const line = text.slice(0, match.index).split("\n").length;
      return `${file}:${line}: ${match[0]}`;
    });
  });
}

describe("design system", () => {
  test.each([
    ["arbitrary values", /(?<![\w-])[a-z][a-z-]*-\[[^\]\s]+\]/g],
    ["hex colors", /#[0-9a-fA-F]{3,8}\b/g],
    ["fontFamily", /\bfontFamily\b/g],
    ["deleted Tailwind sizes", /(?<![\w-])(text-(base|xl|\dxl)|rounded-(xl|\dxl)|leading-\d+)(?![\w-])/g],
    [
      "numbers off the space scale",
      /(?<!\w)(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|h|w|top|bottom|left|right|inset|inset-x|inset-y)-(?!(0|1|2|3|4|6|8|12)(?![\w.]))\d[\w.]*/g,
    ],
    ["visual inline styles", /style=\{\{[^}]*\b(fontSize|color|padding|margin)/g],
  ])("no %s in screens or primitives", (_name, pattern) => {
    expect(offenders(sourceFiles(UI), pattern)).toEqual([]);
  });
});

describe("layers", () => {
  test("fetch stays in lib/api", () => {
    expect(offenders(sourceFiles(SOURCE, ["lib/api/"]), /\bfetch\(/g)).toEqual([]);
  });

  test("screens do not reach native stores or parse UPI", () => {
    const pattern = /from "(expo-secure-store|react-native-mmkv|drizzle-orm)"|upi:\/\//g;
    expect(offenders(sourceFiles(UI), pattern)).toEqual([]);
  });

  // These compile fine, but NativeWind only styles components it registers, so the class silently does nothing.
  test("className is not passed to third-party components NativeWind ignores", () => {
    const pattern = /<(CameraView|GestureHandlerRootView)\b[^>]*\bclassName/g;
    expect(offenders(sourceFiles(UI), pattern)).toEqual([]);
  });

  test("primitives stay dumb", () => {
    const pattern = /^import (?!type )[^\n]*from "[^"]*\/(lib\/(api|storage|upi|native)|hooks|stores)\b[^"]*"/gm;
    expect(offenders(sourceFiles(["components/ui"]), pattern)).toEqual([]);
  });

  test("PostHog stays in lib/analytics", () => {
    expect(offenders(sourceFiles(SOURCE, ["lib/analytics.ts"]), /from "posthog-react-native"/g)).toEqual([]);
  });

  // Nothing in the device runtime provides these; bun tests have them, so they cannot catch this.
  test("code avoids web APIs missing from the device runtime", () => {
    expect(offenders(sourceFiles(SOURCE), /\bcrypto\.\w+|\.throwIfAborted\(/g)).toEqual([]);
  });

  test("API JSON is never cast", () => {
    expect(offenders(sourceFiles(SOURCE), /\.json\(\)[^\n]*\bas\s+[A-Z{]/g)).toEqual([]);
  });
});

test("any carries a same-line reason", () => {
  const pattern = /^(?!.*\/\/ any:).*(:\s*any\b|\bas any\b|<any>).*$/gm;
  expect(offenders(sourceFiles(SOURCE), pattern)).toEqual([]);
});

// A second copy registers styles where components never read them, so every className silently does nothing.
test("NativeWind has a single copy of react-native-css-interop", () => {
  const lock = readFileSync(join(root, "bun.lock"), "utf8");
  expect(lock).not.toContain('"nativewind/react-native-css-interop"');
});

test("package.json has no banned dependency", () => {
  const { dependencies, devDependencies } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const banned =
    /^(@nestjs\/|@?prisma\b|@prisma\/|dd-trace|@datadog\/|redis$|ioredis|bullmq|@mui\/|react-native-paper|tamagui|@tamagui\/|geist|orval|@react-native-async-storage\/|@expo-google-fonts\/(?!inter$))/;
  expect(Object.keys({ ...dependencies, ...devDependencies }).filter((name) => banned.test(name))).toEqual([]);
});
