import { TIMEZONE } from "@pending/api-contract";
import type { LocalPayment } from "../storage/payments";

// A bucket is the name saved on a payment, so a new one exists from the first payment that uses it.
export const DEFAULT_BUCKETS = ["Food", "Groceries", "Transport", "Shopping", "Bills", "Fun", "Health", "People", "Other"];
export const UNCATEGORIZED = "Uncategorized";

export type BucketTotal = { name: string; total: number; share: number };

export function normalizeBucket(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function bucketLabel(category: string | null): string {
  return category ?? UNCATEGORIZED;
}

export function bucketOptions(rows: ReadonlyArray<Pick<LocalPayment, "category">>, extra?: string): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const name of [...DEFAULT_BUCKETS, ...rows.map((row) => row.category), extra]) {
    const key = name?.toLowerCase();
    if (name && key && !seen.has(key)) {
      seen.add(key);
      options.push(name);
    }
  }
  return options;
}

export function suggestBucket(rows: ReadonlyArray<Pick<LocalPayment, "vpa" | "category">>, vpa: string): string | undefined {
  return rows.find((row) => row.vpa === vpa && row.category)?.category ?? undefined;
}

export function monthBuckets(
  rows: ReadonlyArray<Pick<LocalPayment, "status" | "amount" | "createdAt" | "category">>,
  now = new Date(),
): BucketTotal[] {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit" });
  const month = formatter.format(now);
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "success" || formatter.format(new Date(row.createdAt)) !== month) continue;
    const name = bucketLabel(row.category);
    totals.set(name, (totals.get(name) ?? 0) + Number(row.amount));
  }
  const sum = [...totals.values()].reduce((all, total) => all + total, 0);
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total, share: sum === 0 ? 0 : total / sum }))
    .sort((a, b) => b.total - a.total);
}
