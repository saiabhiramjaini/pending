import { eq } from "drizzle-orm";
import { db } from "../db/connect";
import { merchants } from "../db/schema";

export const merchantRepository = {
  async findByVpa(vpa: string) {
    const rows = await db.select().from(merchants).where(eq(merchants.vpa, vpa)).limit(1);
    return rows[0] ?? null;
  },
  async create(values: { vpa: string; name: string }) {
    const rows = await db.insert(merchants).values(values)
      .onConflictDoUpdate({ target: merchants.vpa, set: { vpa: values.vpa } }).returning();
    return rows[0];
  },
};
