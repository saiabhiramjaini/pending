import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Rules that typecheck cannot express. Each guard reports every offending location.
const root = join(import.meta.dir, "..");

function sourceFiles(dirs: string[]) {
  return dirs.flatMap((dir) =>
    [...new Bun.Glob(`${dir}/**/*.ts`).scanSync({ cwd: root })].filter((file) => !file.includes(".test.")),
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

test("Drizzle stays in repositories and db", () => {
  const files = sourceFiles(["src/routes", "src/controllers", "src/services", "src/middlewares"]);
  expect(offenders(files, /from "(drizzle-orm[^"]*|[^"]*\/db\/[^"]*)"/g)).toEqual([]);
});

test("services and repositories never see Express", () => {
  const files = sourceFiles(["src/services", "src/repositories"]);
  expect(offenders(files, /\bres\.(status|json|send|cookie)\b|from "express"/g)).toEqual([]);
});

test("lists never use offset pagination", () => {
  expect(offenders(sourceFiles(["src/repositories"]), /\.offset\(/g)).toEqual([]);
});

test("any carries a same-line reason", () => {
  const pattern = /^(?!.*\/\/ any:).*(:\s*any\b|\bas any\b|<any>).*$/gm;
  expect(offenders(sourceFiles(["src", "packages/api-contract/src"]), pattern)).toEqual([]);
});

test("middleware keeps its order and errorHandler stays last", () => {
  const app = readFileSync(join(root, "src/app.ts"), "utf8");
  const steps = [
    "app.use(express.json())",
    "app.use(cookieParser())",
    "cors({",
    '"/api/v1/health"',
    '"/api/v1/docs"',
    '"/api/v1/auth"',
    '"/api/v1/transactions"',
    "app.use(notFound)",
    "app.use(errorHandler)",
  ];
  const positions = steps.map((step) => app.indexOf(step));
  expect(positions).not.toContain(-1);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
});

test("package.json has no banned dependency", () => {
  const { dependencies, devDependencies } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const banned = /^(@nestjs\/|@?prisma\b|@prisma\/|dd-trace|@datadog\/|redis$|ioredis|bullmq|orval)/;
  expect(Object.keys({ ...dependencies, ...devDependencies }).filter((name) => banned.test(name))).toEqual([]);
});
