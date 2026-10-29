import { beforeEach, expect, test } from "bun:test";
import { usePaymentDraft } from "./paymentDraft";

const scan = { vpa: "shop@upi", merchantName: "Shop", amount: "100" };

beforeEach(() => usePaymentDraft.getState().clearDraft());

test("an older in-flight payment cannot overwrite a newly scanned draft", () => {
  const store = usePaymentDraft.getState();
  store.startDraft(scan);
  const old = usePaymentDraft.getState().draft!;
  store.startDraft({ ...scan, vpa: "cafe@upi", merchantName: "Cafe" });
  const fresh = usePaymentDraft.getState().draft!;
  expect(store.updateSession({ ...old, localId: "old", remoteId: "old" })).toBe(false);
  expect(store.clearSession(old.sessionId)).toBe(false);
  expect(usePaymentDraft.getState().draft).toEqual(fresh);
});

test("the active payment can update and finish its own draft", () => {
  const store = usePaymentDraft.getState();
  store.startDraft(scan);
  const active = usePaymentDraft.getState().draft!;
  expect(store.updateSession({ ...active, localId: "key" })).toBe(true);
  expect(usePaymentDraft.getState().draft?.localId).toBe("key");
  expect(store.clearSession(active.sessionId)).toBe(true);
  expect(usePaymentDraft.getState().draft).toBeNull();
});
