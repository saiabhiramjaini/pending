import { describe, expect, test } from "bun:test";
import { bucketNameSchema, MAX_BUCKET_LENGTH } from "@pending/api-contract";
import { createApp } from "./app";
import { safeErrorSummary } from "./middlewares/errorHandler";

test("production error logs never include query values", () => {
  const err = new Error("Failed query: params: user@example.com,hashed-password", { cause: { code: "ENOTFOUND" } });
  const logged = JSON.stringify(safeErrorSummary(err));
  expect(logged).toContain("ENOTFOUND");
  expect(logged).not.toContain("user@example.com");
  expect(logged).not.toContain("hashed-password");
});

describe("bucket names", () => {
  test("are trimmed and limited to the contract length", () => {
    expect(bucketNameSchema.parse("  Food  ")).toBe("Food");
    expect(bucketNameSchema.safeParse("   ").success).toBe(false);
    expect(bucketNameSchema.safeParse("x".repeat(MAX_BUCKET_LENGTH + 1)).success).toBe(false);
  });
});

describe("api scaffold", () => {
  test("GET /api/v1/health", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    const body = (await res.json()) as { success: boolean; data: { status: string } };
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("OK");
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("unknown route uses error envelope", async () => {
    const app = createApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/nope`);
    const body = (await res.json()) as { success: boolean; code: string };
    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.code).toBe("NOT_FOUND");
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });
});
