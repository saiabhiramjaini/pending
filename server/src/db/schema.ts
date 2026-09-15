import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "upi_app_launched",
  "returned",
  "success",
  "failed",
  "unknown",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "unknown",
  "expense",
  "transfer",
  "refund",
  "other",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vpa: text("vpa").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("merchants_vpa_unique").on(t.vpa)],
);

export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id),
    amount: numeric("amount", { precision: 12, scale: 0 }).notNull(),
    currency: text("currency").notNull().default("INR"),
    upiApp: text("upi_app"),
    note: text("note"),
    status: paymentStatusEnum("status").notNull().default("created"),
    idempotencyKey: uuid("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payment_user_idempotency_unique").on(t.userId, t.idempotencyKey)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    paymentAttemptId: uuid("payment_attempt_id")
      .notNull()
      .references(() => paymentAttempts.id),
    type: transactionTypeEnum("type").notNull().default("unknown"),
    category: text("category"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("transactions_attempt_unique").on(t.paymentAttemptId)],
);
