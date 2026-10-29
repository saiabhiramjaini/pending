import type { CreatePaymentBody, PaymentAttempt, PaymentStatus } from "@pending/api-contract";
import type { LocalPayment } from "../storage/payments";
import type { PaymentDraft } from "../../stores/paymentDraft";

type RecordingDependencies = {
  signedIn: boolean;
  saveLocal: (row: LocalPayment) => void;
  createRemote: (body: CreatePaymentBody) => Promise<PaymentAttempt>;
  patchRemote: (input: { id: string; status: PaymentStatus }) => Promise<PaymentAttempt>;
};

export async function createPaymentRecord(
  draft: PaymentDraft,
  upiApp: string | null,
  dependencies: RecordingDependencies,
  rememberDraft: (draft: PaymentDraft) => void,
) {
  const stable = { ...draft, localId: draft.localId ?? crypto.randomUUID() };
  // Persist the retry key in the draft before any request can commit remotely.
  rememberDraft(stable);
  const now = new Date().toISOString();
  const row: LocalPayment = {
    id: stable.localId, vpa: draft.vpa, merchantName: draft.merchantName,
    amount: draft.amount, currency: "INR", upiApp, note: draft.note ?? null,
    status: "created", createdAt: now, updatedAt: now,
  };
  if (!dependencies.signedIn) {
    dependencies.saveLocal(row);
    return { row, remoteId: undefined, draft: stable };
  }
  const created = draft.remoteId
    ? { id: draft.remoteId }
    : await dependencies.createRemote({
        vpa: row.vpa, merchantName: row.merchantName, amount: row.amount,
        currency: "INR", upiApp: upiApp ?? undefined, note: row.note ?? undefined,
        idempotencyKey: row.id,
      });
  return { row, remoteId: created.id, draft: stable };
}

export async function persistPaymentStatus(
  dependencies: RecordingDependencies,
  row: LocalPayment,
  status: PaymentStatus,
  remoteId?: string,
) {
  const next = { ...row, status, updatedAt: new Date().toISOString() };
  if (dependencies.signedIn) {
    if (!remoteId) throw new Error("Remote payment ID is required");
    await dependencies.patchRemote({ id: remoteId, status });
  } else {
    dependencies.saveLocal(next);
  }
  return next;
}

export function monthTotalIst(
  rows: ReadonlyArray<Pick<LocalPayment, "status" | "amount" | "createdAt">>,
  now = new Date(),
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  });
  const month = formatter.format(now);
  return String(rows.reduce((sum, row) =>
    row.status === "success" && formatter.format(new Date(row.createdAt)) === month
      ? sum + Number(row.amount) : sum, 0));
}
