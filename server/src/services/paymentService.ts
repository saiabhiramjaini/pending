import { API_PAGE_LIMIT, type CreatePaymentBody, type PaymentStatus } from "@pending/api-contract";
import { AppError } from "../errors/AppError";
import { merchantRepository } from "../repositories/merchantRepository";
import { paymentRepository } from "../repositories/paymentRepository";
import { canTransition } from "./paymentStatus";

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : String(value);
}

export const paymentService = {
  async create(userId: string, body: CreatePaymentBody) {
    const existing = await paymentRepository.findByIdempotency(userId, body.idempotencyKey);
    if (existing) {
      return existing;
    }
    let merchant = await merchantRepository.findByVpa(body.vpa);
    if (!merchant) {
      merchant = await merchantRepository.create({ vpa: body.vpa, name: body.merchantName });
    }
    return paymentRepository.create({
      userId,
      merchantId: merchant.id,
      amount: body.amount,
      currency: body.currency ?? "INR",
      upiApp: body.upiApp,
      note: body.note,
      idempotencyKey: body.idempotencyKey,
    });
  },
  async get(userId: string, id: string) {
    const row = await paymentRepository.findById(id);
    if (!row) {
      throw new AppError(404, "NOT_FOUND", "Payment attempt not found");
    }
    if (row.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You can't do that");
    }
    return row;
  },
  async patch(userId: string, id: string, status: PaymentStatus) {
    const row = await this.get(userId, id);
    if (!canTransition(row.status, status)) {
      throw new AppError(409, "CONFLICT", "Already updated");
    }
    const updated = await paymentRepository.updateStatus(id, userId, row.status, status);
    if (updated) return updated;
    const current = await this.get(userId, id);
    // Retrying a committed status after a lost response is safe.
    if (current.status === status) return current;
    throw new AppError(409, "CONFLICT", "Payment changed. Refresh and try again.");
  },
  async list(userId: string, cursor?: string, limit = API_PAGE_LIMIT) {
    const rows = await paymentRepository.listTransactions(userId, limit, cursor);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    return {
      items: page.map((row) => ({
        id: row.id,
        userId: row.userId,
        paymentAttemptId: row.paymentAttemptId,
        type: row.type,
        category: row.category,
        amount: String(row.amount),
        merchantName: row.merchantName,
        vpa: row.vpa,
        status: row.status,
        createdAt: iso(row.createdAt),
      })),
      nextCursor: hasMore && last ? `${last.cursorTimestamp}|${last.id}` : null,
    };
  },
};
