import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/connect";
import { merchants, paymentAttempts, transactions } from "../db/schema";
import type { PaymentStatus } from "@pending/api-contract";

export const paymentRepository = {
  async findByIdempotency(userId: string, idempotencyKey: string) {
    const rows = await db
      .select()
      .from(paymentAttempts)
      .where(
        and(eq(paymentAttempts.userId, userId), eq(paymentAttempts.idempotencyKey, idempotencyKey)),
      )
      .limit(1);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const rows = await db.select().from(paymentAttempts).where(eq(paymentAttempts.id, id)).limit(1);
    return rows[0] ?? null;
  },
  async create(values: {
    userId: string;
    merchantId: string;
    amount: string;
    currency: string;
    upiApp?: string;
    note?: string;
    idempotencyKey: string;
  }) {
    return db.transaction(async (tx) => {
      const [inserted] = await tx.insert(paymentAttempts).values(values)
        .onConflictDoNothing({ target: [paymentAttempts.userId, paymentAttempts.idempotencyKey] })
        .returning();
      if (!inserted) {
        const [existing] = await tx.select().from(paymentAttempts).where(and(
          eq(paymentAttempts.userId, values.userId),
          eq(paymentAttempts.idempotencyKey, values.idempotencyKey),
        ));
        if (!existing) throw new Error("Idempotent payment not found");
        return existing;
      }
      const attempt = inserted;
      await tx.insert(transactions).values({
        userId: values.userId,
        paymentAttemptId: attempt.id,
        type: "unknown",
      });
      return attempt;
    });
  },
  async updateStatus(id: string, userId: string, previous: PaymentStatus, status: PaymentStatus) {
    const rows = await db
      .update(paymentAttempts)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(paymentAttempts.id, id), eq(paymentAttempts.userId, userId),
        eq(paymentAttempts.status, previous)))
      .returning();
    return rows[0];
  },
  async listTransactions(userId: string, limit: number, cursor?: string) {
    const filters = [eq(transactions.userId, userId)];
    if (cursor) {
      const [timestamp, id] = cursor.split("|");
      filters.push(sql`(${transactions.createdAt}, ${transactions.id}) < (${timestamp}::timestamptz, ${id}::uuid)`);
    }
    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        paymentAttemptId: transactions.paymentAttemptId,
        type: transactions.type,
        category: transactions.category,
        amount: paymentAttempts.amount,
        status: paymentAttempts.status,
        createdAt: transactions.createdAt,
        // Preserve PostgreSQL's full timestamp precision in the cursor.
        cursorTimestamp: sql<string>`to_char(${transactions.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
        merchantName: merchants.name,
        vpa: merchants.vpa,
      })
      .from(transactions)
      .innerJoin(paymentAttempts, eq(transactions.paymentAttemptId, paymentAttempts.id))
      .innerJoin(merchants, eq(paymentAttempts.merchantId, merchants.id))
      .where(and(...filters))
      .orderBy(desc(transactions.createdAt), desc(transactions.id))
      .limit(limit + 1);
    return rows;
  },
};
