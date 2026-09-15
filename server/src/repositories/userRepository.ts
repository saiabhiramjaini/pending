import { eq } from "drizzle-orm";
import { db } from "../db/connect";
import { users } from "../db/schema";

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
    await db.delete(users).where(eq(users.id, id));
  },
};
