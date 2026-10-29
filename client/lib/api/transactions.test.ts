import { expect, test } from "bun:test";
import { listAllTransactions } from "./transactions";
import { monthTotalIst } from "../payments/records";
import type { Transaction } from "@pending/api-contract";

const items: Transaction[] = Array.from({ length: 105 }, (_, i) => ({
  id: String(i), userId: "user", paymentAttemptId: String(i), type: "unknown",
  category: null, amount: "100", merchantName: "Shop", vpa: "shop@upi",
  status: "success", createdAt: "2026-10-08T00:00:00Z",
}));

test("loads all three pages so history and totals include payments beyond 50", async () => {
  const cursors: Array<string | undefined> = [];
  const client = {
    listTransactions: async (cursor?: string) => {
      cursors.push(cursor);
      const offset = cursor ? Number(cursor) : 0;
      return { items: items.slice(offset, offset + 50), nextCursor: offset + 50 < items.length ? String(offset + 50) : null };
    },
  };
  const result = await listAllTransactions(client);
  expect(cursors).toEqual([undefined, "50", "100"]);
  expect(result.items).toHaveLength(105);
  expect(monthTotalIst(result.items, new Date("2026-10-08T00:00:00Z"))).toBe("10500");
});

test("rejects a failed later page instead of returning a partial monthly total", async () => {
  await expect(listAllTransactions({ listTransactions: async (cursor) => {
    if (cursor) throw new Error("Offline");
    return { items: items.slice(0, 50), nextCursor: "50" };
  } })).rejects.toThrow("Offline");
});

test("stops fetching when the session cancels the query", async () => {
  const controller = new AbortController();
  let calls = 0;
  await expect(listAllTransactions({ listTransactions: async () => {
    calls++;
    controller.abort();
    return { items: [], nextCursor: "50" };
  } }, controller.signal)).rejects.toThrow();
  expect(calls).toBe(1);
});

test("rejects a repeated cursor instead of looping forever", async () => {
  await expect(listAllTransactions({ listTransactions: async () => ({
    items: [], nextCursor: "same",
  }) })).rejects.toThrow("did not advance");
});
