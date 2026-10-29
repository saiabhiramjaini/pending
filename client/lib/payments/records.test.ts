import { describe, expect, test } from "bun:test";
import { createPaymentRecord, monthTotalIst, persistPaymentStatus } from "./records";
import type { CreatePaymentBody, PaymentAttempt, PaymentStatus } from "@pending/api-contract";
import type { LocalPayment } from "../storage/payments";
import type { PaymentDraft } from "../../stores/paymentDraft";

const draft = {
  sessionId: "test-session",
  localId: "00000000-0000-4000-8000-000000000001", vpa: "shop@upi",
  merchantName: "Shop", amount: "100",
};
const rememberDraft = (_draft: PaymentDraft) => {};

function recording(signedIn: boolean) {
  const local: LocalPayment[] = [];
  const creates: CreatePaymentBody[] = [];
  const patches: Array<{ id: string; status: PaymentStatus }> = [];
  const attempt: PaymentAttempt = {
    id: "00000000-0000-4000-8000-000000000002",
    userId: "00000000-0000-4000-8000-000000000003",
    merchantId: "00000000-0000-4000-8000-000000000004",
    amount: "100", currency: "INR", upiApp: null, note: null, status: "created",
    idempotencyKey: draft.localId, createdAt: "2026-10-07T10:00:00Z", updatedAt: "2026-10-07T10:00:00Z",
  };
  const dependencies = {
    signedIn,
    saveLocal: (row: LocalPayment) => { local.push(row); },
    createRemote: async (body: CreatePaymentBody) => { creates.push(body); return attempt; },
    patchRemote: async (input: { id: string; status: PaymentStatus }) => {
      patches.push(input); return { ...attempt, status: input.status };
    },
  };
  return { dependencies, local, creates, patches, attempt };
}

describe("payment recording", () => {
  test("signed-in creation and confirmation never write local payment data", async () => {
    const state = recording(true);
    const { row, remoteId } = await createPaymentRecord(draft, "phonepe", state.dependencies, rememberDraft);
    await persistPaymentStatus(state.dependencies, row, "success", remoteId);
    expect(state.local).toEqual([]);
    expect(state.creates).toHaveLength(1);
    expect(state.patches).toEqual([{ id: remoteId!, status: "success" }]);
  });

  test("unsigned payments use only local storage", async () => {
    const state = recording(false);
    const { row, remoteId } = await createPaymentRecord(draft, "phonepe", state.dependencies, rememberDraft);
    const next = await persistPaymentStatus(state.dependencies, row, "unknown", remoteId);
    expect(next.status).toBe("unknown");
    expect(state.local.map((row) => row.status)).toEqual(["created", "unknown"]);
    expect(state.creates).toEqual([]);
    expect(state.patches).toEqual([]);
  });

  test("retry after a lost create response reuses the idempotency key", async () => {
    const state = recording(true);
    const create = state.dependencies.createRemote;
    let savedDraft: PaymentDraft = { ...draft, localId: undefined };
    const remember = (next: PaymentDraft) => { savedDraft = next; };
    state.dependencies.createRemote = async (body) => {
      expect(savedDraft.localId).toBe(body.idempotencyKey);
      await create(body);
      throw new Error("Response lost");
    };
    await expect(createPaymentRecord(savedDraft, "phonepe", state.dependencies, remember)).rejects.toThrow("Response lost");
    const key = savedDraft.localId;
    state.dependencies.createRemote = create;
    await createPaymentRecord(savedDraft, "phonepe", state.dependencies, remember);
    expect(state.creates.map((body) => body.idempotencyKey)).toEqual([key!, key!]);
    expect(state.local).toEqual([]);
  });

  test("failed status save can retry the same remote attempt without a local success", async () => {
    const state = recording(true);
    const { row, remoteId } = await createPaymentRecord(draft, "phonepe", state.dependencies, rememberDraft);
    const patch = state.dependencies.patchRemote;
    state.dependencies.patchRemote = async () => { throw new Error("Offline"); };
    await expect(persistPaymentStatus(state.dependencies, row, "success", remoteId)).rejects.toThrow("Offline");
    expect(row.status).toBe("created");
    expect(state.local).toEqual([]);
    state.dependencies.patchRemote = patch;
    const next = await persistPaymentStatus(state.dependencies, row, "success", remoteId);
    expect(next.status).toBe("success");
    expect(state.patches).toEqual([{ id: remoteId!, status: "success" }]);
  });

  test("a signed-in status without a remote ID fails instead of falling back to MMKV", async () => {
    const state = recording(true);
    const { row } = await createPaymentRecord(draft, null, state.dependencies, rememberDraft);
    await expect(persistPaymentStatus(state.dependencies, row, "success")).rejects.toThrow("Remote payment ID");
    expect(state.local).toEqual([]);
  });
});

test("monthly totals respect IST month boundaries and exclude unconfirmed payments", () => {
  const rows = [
    { amount: "100", status: "success" as const, createdAt: "2026-09-30T18:30:00Z" },
    { amount: "200", status: "success" as const, createdAt: "2026-09-30T18:29:59Z" },
    { amount: "300", status: "success" as const, createdAt: "2026-10-31T18:29:59Z" },
    { amount: "400", status: "success" as const, createdAt: "2026-10-31T18:30:00Z" },
    { amount: "500", status: "unknown" as const, createdAt: "2026-10-08T00:00:00Z" },
    { amount: "600", status: "failed" as const, createdAt: "2026-10-08T00:00:00Z" },
  ];
  expect(monthTotalIst(rows, new Date("2026-10-08T00:00:00Z"))).toBe("400");
});
