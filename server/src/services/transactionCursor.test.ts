import { expect, test } from "bun:test";
import { listTransactionsQuerySchema, transactionCursorSchema } from "@pending/api-contract";

const id = "00000000-0000-4000-8000-000000000001";

test("cursor accepts full PostgreSQL timestamp precision and a UUID tie breaker", () => {
  expect(transactionCursorSchema.safeParse(`2026-10-08T00:00:00.123456Z|${id}`).success).toBe(true);
});

test.each([
  "invalid", `not-a-date|${id}`, `2026-02-30T00:00:00Z|${id}`,
  "2026-10-08T00:00:00Z|not-a-uuid", `2026-10-08T00:00:00Z|${id}|extra`,
])("rejects malformed cursor %s before it reaches Postgres", (cursor) => {
  expect(listTransactionsQuerySchema.safeParse({ cursor }).success).toBe(false);
});
