import { TIMEZONE } from "@pending/api-contract";

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const labelFormat = new Intl.DateTimeFormat("en-IN", { timeZone: TIMEZONE, day: "numeric", month: "short" });
const DAY_MS = 24 * 60 * 60 * 1000;

export function formatRupees(amount: string | number): string {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function formatDay(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const day = dayFormat.format(date);
  if (day === dayFormat.format(now)) return "Today";
  if (day === dayFormat.format(new Date(now.getTime() - DAY_MS))) return "Yesterday";
  return labelFormat.format(date);
}

export function groupByDay<T extends { createdAt: string }>(rows: readonly T[], now = new Date()) {
  const sections: { title: string; data: T[] }[] = [];
  for (const row of rows) {
    const title = formatDay(row.createdAt, now);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(row);
    else sections.push({ title, data: [row] });
  }
  return sections;
}
