import { eq } from "drizzle-orm";
import { db } from "../db/connect";
import { paymentAttempts, transactions, users } from "../db/schema";

export const userRepository = {
  async findByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  },
  async findById(id: string) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  },
  async create(values: { name: string; email: string; password: string }) {
    const rows = await db.insert(users).values(values).returning();
    return rows[0];
  },
  async deleteById(id: string) {
    await db.transaction(async (tx) => {
      // Lock the parent so new payments cannot race account deletion.
      await tx.select({ id: users.id }).from(users).where(eq(users.id, id)).for("update");
      await tx.delete(transactions).where(eq(transactions.userId, id));
      await tx.delete(paymentAttempts).where(eq(paymentAttempts.userId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  },
};
