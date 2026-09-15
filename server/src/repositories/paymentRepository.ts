import { and, desc, eq, lt } from "drizzle-orm";
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
      const [attempt] = await tx.insert(paymentAttempts).values(values).returning();
      await tx.insert(transactions).values({
        userId: values.userId,
        paymentAttemptId: attempt.id,
        type: "unknown",
      });
      return attempt;
    });
  },
  async updateStatus(id: string, status: PaymentStatus) {
    const rows = await db
      .update(paymentAttempts)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentAttempts.id, id))
      .returning();
    return rows[0];
  },
  async listTransactions(userId: string, limit: number, cursor?: string) {
    const filters = [eq(transactions.userId, userId)];
    if (cursor) {
      filters.push(lt(transactions.createdAt, new Date(cursor)));
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
        merchantName: merchants.name,
        vpa: merchants.vpa,
      })
      .from(transactions)
      .innerJoin(paymentAttempts, eq(transactions.paymentAttemptId, paymentAttempts.id))
      .innerJoin(merchants, eq(paymentAttempts.merchantId, merchants.id))
      .where(and(...filters))
      .orderBy(desc(transactions.createdAt))
      .limit(limit + 1);
    return rows;
  },
};
