import { describe, expect, test } from "bun:test";
import { createApp } from "./app";

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
