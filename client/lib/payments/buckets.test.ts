import { describe, expect, test } from "bun:test";
import { bucketLabel, bucketOptions, DEFAULT_BUCKETS, monthBuckets, normalizeBucket, suggestBucket } from "./buckets";
import { formatDay, formatRupees, groupByDay } from "./format";

const now = new Date("2026-11-03T06:00:00Z");
const paid = (amount: string, category: string | null, createdAt = "2026-11-02T06:00:00Z") => ({
  amount, category, createdAt, status: "success" as const,
});

describe("bucket options", () => {
  test("offers defaults, then custom names once, ignoring case", () => {
    const options = bucketOptions([{ category: "Trips" }, { category: "trips" }, { category: "food" }, { category: null }]);
    expect(options).toEqual([...DEFAULT_BUCKETS, "Trips"]);
  });

  test("keeps a custom name chosen for this payment before it is saved", () => {
    expect(bucketOptions([], "Rent")).toEqual([...DEFAULT_BUCKETS, "Rent"]);
  });

  test("normalizes spacing and labels payments without a bucket", () => {
    expect(normalizeBucket("  Weekend   trips ")).toBe("Weekend trips");
    expect(bucketLabel(null)).toBe("Uncategorized");
  });

  test("suggests the newest bucket used for the same UPI ID", () => {
    const rows = [
      { vpa: "cafe@upi", category: null },
      { vpa: "cafe@upi", category: "Food" },
      { vpa: "cafe@upi", category: "Fun" },
      { vpa: "shop@upi", category: "Shopping" },
    ];
    expect(suggestBucket(rows, "cafe@upi")).toBe("Food");
    expect(suggestBucket(rows, "new@upi")).toBeUndefined();
  });
});

describe("month buckets", () => {
  test("totals only paid payments in the IST month, largest first", () => {
    const rows = [
      paid("300", "Food"),
      paid("100", "Food"),
      paid("100", null),
      { ...paid("900", "Fun"), status: "failed" as const },
      { ...paid("900", "Fun"), status: "unknown" as const },
      paid("900", "Fun", "2026-10-31T18:29:59Z"),
    ];
    expect(monthBuckets(rows, now)).toEqual([
      { name: "Food", total: 400, share: 0.8 },
      { name: "Uncategorized", total: 100, share: 0.2 },
    ]);
  });

  test("is empty when nothing is paid", () => {
    expect(monthBuckets([], now)).toEqual([]);
  });
});

describe("formatting", () => {
  test("uses Indian digit grouping", () => {
    expect(formatRupees("100000")).toBe("₹1,00,000");
  });

  test("names days in IST", () => {
    expect(formatDay("2026-11-02T18:30:00Z", now)).toBe("Today");
    expect(formatDay("2026-11-02T18:29:59Z", now)).toBe("Yesterday");
    expect(formatDay("2026-10-20T06:00:00Z", now)).toBe("20 Oct");
  });

  test("groups newest-first rows by day", () => {
    const rows = [{ createdAt: "2026-11-03T05:00:00Z" }, { createdAt: "2026-11-03T01:00:00Z" }, { createdAt: "2026-11-02T05:00:00Z" }];
    expect(groupByDay(rows, now).map((section) => [section.title, section.data.length])).toEqual([["Today", 2], ["Yesterday", 1]]);
  });
});
