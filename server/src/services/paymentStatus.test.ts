import { describe, expect, test } from "bun:test";
import { canTransition } from "./paymentStatus";

describe("payment status transitions", () => {
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
