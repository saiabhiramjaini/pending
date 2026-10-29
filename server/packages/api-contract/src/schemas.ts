import { z } from "zod";
import { API_PAGE_LIMIT, MAX_AMOUNT_RUPEES, MIN_AMOUNT_RUPEES } from "./constants";

export const paymentStatusSchema = z.enum([
  "created",
  "upi_app_launched",
  "returned",
  "success",
  "failed",
  "unknown",
]);

export const transactionTypeSchema = z.enum([
  "unknown",
  "expense",
  "transfer",
  "refund",
  "other",
]);

export const amountRupeesSchema = z
  .string()
  .regex(/^[0-9]+$/, "Amount must be a whole number of rupees")
  .refine((value) => {
    const n = Number(value);
    return n >= MIN_AMOUNT_RUPEES && n <= MAX_AMOUNT_RUPEES;
  }, `Amount must be between ₹${MIN_AMOUNT_RUPEES} and ₹${MAX_AMOUNT_RUPEES}`);

export const signupBodySchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signinBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const userPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
});

export const merchantSchema = z.object({
  id: z.string().uuid(),
  vpa: z.string(),
  name: z.string(),
});

export const paymentAttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  merchantId: z.string().uuid(),
  amount: amountRupeesSchema,
  currency: z.literal("INR"),
  upiApp: z.string().nullable(),
  note: z.string().nullable(),
  status: paymentStatusSchema,
  idempotencyKey: z.string().uuid(),
  merchant: merchantSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  paymentAttemptId: z.string().uuid(),
  type: transactionTypeSchema,
  category: z.string().nullable(),
  amount: amountRupeesSchema,
  merchantName: z.string(),
  vpa: z.string(),
  status: paymentStatusSchema,
  createdAt: z.string(),
});

export const createPaymentBodySchema = z.object({
  vpa: z.string().min(3),
  merchantName: z.string().min(1),
  amount: amountRupeesSchema,
  currency: z.literal("INR").default("INR"),
  upiApp: z.string().optional(),
  note: z.string().max(120).optional(),
  idempotencyKey: z.string().uuid(),
});

export const patchPaymentBodySchema = z.object({
  status: paymentStatusSchema,
});

export const transactionCursorSchema = z.string().max(100).refine((value) => {
  const [timestamp, id, extra] = value.split("|");
  return extra === undefined && z.string().datetime().safeParse(timestamp).success &&
    z.string().uuid().safeParse(id).success;
}, "Invalid transaction cursor");

export const listTransactionsQuerySchema = z.object({
  cursor: transactionCursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(API_PAGE_LIMIT).optional(),
});

export const envelopeSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });

export const envelopeErrorSchema = z.object({
  success: z.literal(false),
  code: z.string(),
  message: z.string(),
  details: z.array(
    z.object({
      field: z.string().optional(),
      message: z.string(),
    }),
  ),
});

export const authDataSchema = z.object({
  token: z.string(),
  user: userPublicSchema,
});

export const healthDataSchema = z.object({
  status: z.literal("OK"),
});

export const transactionListDataSchema = z.object({
  items: z.array(transactionSchema),
  nextCursor: transactionCursorSchema.nullable(),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type SignupBody = z.infer<typeof signupBodySchema>;
export type SigninBody = z.infer<typeof signinBodySchema>;
export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;
export type PatchPaymentBody = z.infer<typeof patchPaymentBodySchema>;
export type PaymentAttempt = z.infer<typeof paymentAttemptSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;
