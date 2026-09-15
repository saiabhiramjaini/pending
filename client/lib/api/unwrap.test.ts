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
