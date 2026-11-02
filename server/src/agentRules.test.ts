import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Keeps the agent rules wired up and pointing at files that still exist.
const repo = join(import.meta.dir, "../..");

function read(file: string) {
  return readFileSync(join(repo, file), "utf8");
}

function glob(pattern: string) {
  return [...new Bun.Glob(pattern).scanSync({ cwd: repo, dot: true })];
}

const rules = glob(".claude/rules/*.md");

function rulePaths(rule: string) {
  const frontmatter = read(rule).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  return [...frontmatter.matchAll(/^\s+- "(.+)"$/gm)].map((match) => match[1]);
}

test("the repo root stays free of a workspace", () => {
  expect(existsSync(join(repo, "package.json"))).toBe(false);
  expect(existsSync(join(repo, "node_modules"))).toBe(false);
});

test("CLAUDE.md imports AGENTS.md and nothing else", () => {
  expect(read("CLAUDE.md").trim()).toBe("@AGENTS.md");
});

test("rules exist", () => {
  expect(rules.length).toBeGreaterThan(0);
});

describe.each(rules)("%s", (rule) => {
  test("scopes to paths that match a file", () => {
    const paths = rulePaths(rule);
    expect(paths.length).toBeGreaterThan(0);
    const unmatched = paths.filter((path) => {
      for (const _file of new Bun.Glob(path).scanSync({ cwd: repo, dot: true })) return false;
      return true;
    });
    expect(unmatched).toEqual([]);
  });

  test("is listed in AGENTS.md", () => {
    expect(read("AGENTS.md")).toContain(`(${rule})`);
  });
});

test("relative links in rules and docs resolve", () => {
  const files = ["AGENTS.md", "README.md", "server/README.md", ...glob("docs/*.md"), ...rules];
  const broken = files.flatMap((file) =>
    [...read(file).matchAll(/\]\(([^)\s]+)\)/g)]
      .map((match) => match[1].split("#")[0])
      .filter((link) => link && !/^[a-z]+:/.test(link) && !existsSync(join(repo, dirname(file), link)))
      .map((link) => `${file}: ${link}`),
  );
  expect(broken).toEqual([]);
});
