import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { and, count, eq, sql } from "drizzle-orm";
import { closeDb, db } from "../db/connect";
import { merchants, paymentAttempts, transactions, users } from "../db/schema";
import { paymentRepository } from "../repositories/paymentRepository";
import { userRepository } from "../repositories/userRepository";
import { paymentService } from "./paymentService";
import { transactionCursorSchema } from "@pending/api-contract";

// Opt in with an isolated database; never use DATABASE_URL from the app's .env.
const testUrl = process.env.TEST_DATABASE_URL;
const integration = testUrl ? describe : describe.skip;
const ownerIds: string[] = [];
const merchantIds = new Set<string>();

integration("Postgres payment integrity", () => {
  beforeAll(() => {
    if (!testUrl || new URL(testUrl).pathname !== "/pending_test") {
      throw new Error("TEST_DATABASE_URL must point to the isolated pending_test database");
    }
    process.env.DATABASE_URL = testUrl;
  });

  afterAll(async () => {
    for (const id of ownerIds) await userRepository.deleteById(id);
    for (const id of merchantIds) await db.delete(merchants).where(eq(merchants.id, id));
    await closeDb();
  });

  async function owner() {
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, name: "Test", email: `${id}@example.test`, password: "test-only" });
    ownerIds.push(id);
    return id;
  }

  async function create(userId: string, overrides: { vpa?: string; idempotencyKey?: string; note?: string } = {}) {
    const row = await paymentService.create(userId, {
      merchantName: "Integration shop", vpa: `${crypto.randomUUID()}@upi`, amount: "100",
      currency: "INR", idempotencyKey: crypto.randomUUID(), ...overrides,
    });
    merchantIds.add(row.merchantId);
    return row;
  }

  test("concurrent retries create one attempt and one unknown transaction", async () => {
    const userId = await owner();
    const idempotencyKey = crypto.randomUUID();
    const vpa = `${crypto.randomUUID()}@upi`;
    const attempts = await Promise.all(Array.from({ length: 8 }, () => create(userId, { idempotencyKey, vpa })));
    expect(new Set(attempts.map((row) => row.id)).size).toBe(1);
    const records = await db.select().from(transactions).where(eq(transactions.userId, userId));
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe("unknown");
    expect(records[0].paymentAttemptId).toBe(attempts[0].id);
  });

  test("concurrent first payments to the same merchant all succeed", async () => {
    const userId = await owner();
    const vpa = `${crypto.randomUUID()}@upi`;
    const attempts = await Promise.all(Array.from({ length: 8 }, () => create(userId, { vpa })));
    expect(new Set(attempts.map((row) => row.id)).size).toBe(8);
    expect(new Set(attempts.map((row) => row.merchantId)).size).toBe(1);
  });

  test("two stale status readers cannot overwrite each other's terminal result", async () => {
    const userId = await owner();
    const row = await create(userId);
    const original = paymentRepository.findById.bind(paymentRepository);
    let readers = 0;
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    const find = spyOn(paymentRepository, "findById").mockImplementation(async (id) => {
      const snapshot = await original(id);
      if (++readers <= 2) {
        if (readers === 2) release();
        await barrier;
      }
      return snapshot;
    });
    try {
      const results = await Promise.allSettled([
        paymentService.patch(userId, row.id, "success"),
        paymentService.patch(userId, row.id, "failed"),
      ]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      const stored = await original(row.id);
      expect(["success", "failed"]).toContain(stored!.status);
      expect(await paymentService.patch(userId, row.id, stored!.status)).toMatchObject({ status: stored!.status });
      await expect(paymentService.patch(userId, row.id, stored!.status === "success" ? "failed" : "success"))
        .rejects.toMatchObject({ statusCode: 409 });
    } finally {
      find.mockRestore();
    }
  });

  test("a failed transaction insert rolls back its payment attempt", async () => {
    const userId = await owner();
    const existing = await create(userId);
    const idempotencyKey = crypto.randomUUID();
    await db.execute(sql`CREATE FUNCTION pending_test_reject_transaction() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF EXISTS (SELECT 1 FROM payment_attempts WHERE id = NEW.payment_attempt_id AND note = 'test-rollback') THEN
          RAISE EXCEPTION 'test transaction insert failure';
        END IF;
        RETURN NEW;
      END $$`);
    try {
      await db.execute(sql`CREATE TRIGGER pending_test_reject_transaction BEFORE INSERT ON transactions
        FOR EACH ROW EXECUTE FUNCTION pending_test_reject_transaction()`);
      await expect(paymentRepository.create({ userId, merchantId: existing.merchantId,
        amount: "100", currency: "INR", idempotencyKey, note: "test-rollback" })).rejects.toThrow();
      expect(await paymentRepository.findByIdempotency(userId, idempotencyKey)).toBeNull();
      const [{ value }] = await db.select({ value: count() }).from(transactions).where(eq(transactions.userId, userId));
      expect(value).toBe(1);
    } finally {
      await db.execute(sql`DROP TRIGGER IF EXISTS pending_test_reject_transaction ON transactions`);
      await db.execute(sql`DROP FUNCTION pending_test_reject_transaction()`);
    }
  });

  test("105 equal-timestamp rows paginate without missing or repeating records", async () => {
    const userId = await owner();
    const vpa = `${crypto.randomUUID()}@upi`;
    for (let i = 0; i < 105; i++) await create(userId, { vpa });
    await db.update(transactions).set({ createdAt: new Date("2026-10-08T00:00:00Z") }).where(eq(transactions.userId, userId));
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await paymentService.list(userId, cursor, 17);
      ids.push(...page.items.map((row) => row.id));
      cursor = page.nextCursor ?? undefined;
      if (cursor) expect(transactionCursorSchema.safeParse(cursor).success).toBe(true);
      if (ids.length > 105) throw new Error("Pagination repeated records");
    } while (cursor);
    expect(ids).toHaveLength(105);
    expect(new Set(ids).size).toBe(105);
  });

  test("cursor preserves microseconds even though JSON dates have millisecond precision", async () => {
    const userId = await owner();
    const older = await create(userId);
    const newer = await create(userId);
    await db.execute(sql`UPDATE transactions SET created_at = '2026-10-08T00:00:00.123001Z'::timestamptz
      WHERE payment_attempt_id = ${older.id}`);
    await db.execute(sql`UPDATE transactions SET created_at = '2026-10-08T00:00:00.123002Z'::timestamptz
      WHERE payment_attempt_id = ${newer.id}`);
    const first = await paymentService.list(userId, undefined, 1);
    const second = await paymentService.list(userId, first.nextCursor!, 1);
    expect(first.items[0].paymentAttemptId).toBe(newer.id);
    expect(second.items[0].paymentAttemptId).toBe(older.id);
    expect(second.nextCursor).toBeNull();
  });

  test("account deletion removes owned payment records and preserves another user's records", async () => {
    const userId = await owner();
    const otherId = await owner();
    const vpa = `${crypto.randomUUID()}@upi`;
    await create(userId, { vpa });
    const otherPayment = await create(otherId, { vpa });
    await userRepository.deleteById(userId);
    expect(await userRepository.findById(userId)).toBeNull();
    expect(await db.select().from(paymentAttempts).where(eq(paymentAttempts.userId, userId))).toEqual([]);
    expect(await db.select().from(transactions).where(eq(transactions.userId, userId))).toEqual([]);
    expect(await paymentRepository.findById(otherPayment.id)).not.toBeNull();
    expect(await db.select().from(transactions).where(and(eq(transactions.userId, otherId),
      eq(transactions.paymentAttemptId, otherPayment.id)))).toHaveLength(1);
  });

  test("ownership prevents reading or changing another user's payment", async () => {
    const userId = await owner();
    const otherId = await owner();
    const row = await create(userId);
    await expect(paymentService.get(otherId, row.id)).rejects.toMatchObject({ statusCode: 403 });
    await expect(paymentService.patch(otherId, row.id, "success")).rejects.toMatchObject({ statusCode: 403 });
    expect((await paymentRepository.findById(row.id))!.status).toBe("created");
  });
});
