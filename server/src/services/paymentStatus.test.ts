import { describe, expect, test } from "bun:test";
import { canTransition } from "./paymentStatus";
import { paymentStatusSchema, type PaymentStatus } from "@pending/api-contract";

describe("payment status transitions", () => {
  const transitions: Record<PaymentStatus, PaymentStatus[]> = {
    created: ["upi_app_launched", "returned", "success", "failed", "unknown"],
    upi_app_launched: ["returned", "success", "failed", "unknown"],
    returned: ["success", "failed", "unknown"],
    success: [], failed: [], unknown: ["success", "failed"],
  };
  for (const from of paymentStatusSchema.options) {
    for (const to of paymentStatusSchema.options) {
      test(`${from} → ${to}`, () => {
        expect(canTransition(from, to)).toBe(from === to || transitions[from].includes(to));
      });
    }
  }
  test("created can go to launched or explicit terminal", () => {
    expect(canTransition("created", "upi_app_launched")).toBe(true);
    expect(canTransition("created", "success")).toBe(true);
    expect(canTransition("created", "failed")).toBe(true);
  });
  test("success is terminal", () => {
    expect(canTransition("success", "failed")).toBe(false);
  });
  test("returned cannot go back to created", () => {
    expect(canTransition("returned", "created")).toBe(false);
    expect(canTransition("returned", "unknown")).toBe(true);
  });
});
