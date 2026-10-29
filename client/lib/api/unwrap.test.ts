import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { unwrapSuccess } from "./unwrap";
import { ApiError } from "./errors";

test("unwraps success data", () => {
  const data = unwrapSuccess(
    z.object({ status: z.literal("OK") }),
    { success: true, message: "OK", data: { status: "OK" } },
    200,
  );
  expect(data.status).toBe("OK");
});

test("rejects invalid bodies", () => {
  expect(() =>
    unwrapSuccess(z.object({ status: z.literal("OK") }), { foo: 1 }, 200),
  ).toThrow(ApiError);
});

test("rejects a valid envelope containing invalid data", () => {
  expect(() => unwrapSuccess(z.object({ status: z.literal("OK") }),
    { success: true, message: "OK", data: { status: "BROKEN" } }, 200)).toThrow(ApiError);
});

test("keeps the HTTP status when a success envelope holds invalid data", () => {
  try {
    unwrapSuccess(z.object({ status: z.literal("OK") }),
      { success: true, message: "OK", data: { status: "BROKEN" } }, 201);
    throw new Error("Expected rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(201);
  }
});

test("preserves authentication status for error envelopes", () => {
  try {
    unwrapSuccess(z.object({}),
      { success: false, code: "UNAUTHORIZED", message: "Unauthorized", details: [] }, 401);
    throw new Error("Expected rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  }
});
