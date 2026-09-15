import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { buildUpiPayUri, MAX_AMOUNT_RUPEES, MIN_AMOUNT_RUPEES } from "../lib/upi/parse";
import { listUpiApps, launchUpiPay, type UpiApp } from "../lib/native/upi";
import { usePaymentDraft } from "../stores/paymentDraft";
import { persistStatus, usePayments } from "./usePayments";
import { PAY_DEBOUNCE_MS } from "@pending/api-contract";
import type { LocalPayment, PaymentStatus } from "../lib/storage/payments";

function mapHandoffResult(result: string): PaymentStatus {
  if (result === "success" || result === "failed" || result === "unknown") return result;
  return "unknown";
}

export function usePayHandoff() {
  const router = useRouter();
  const draft = usePaymentDraft((s) => s.draft);
  const setDraft = usePaymentDraft((s) => s.setDraft);
  const clearDraft = usePaymentDraft((s) => s.clearDraft);
  const payments = usePayments();
  const [apps, setApps] = useState<UpiApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [payError, setPayError] = useState<string | undefined>();
  const lastPay = useRef(0);
  const rowRef = useRef<LocalPayment | null>(null);
  const remoteIdRef = useRef<string | undefined>(draft?.remoteId);

  useEffect(() => {
    void listUpiApps().then(setApps);
  }, []);

  const amountOk = () => {
    if (!draft) return false;
    const n = Number(draft.amount);
    if (!/^[0-9]+$/.test(draft.amount) || n < MIN_AMOUNT_RUPEES || n > MAX_AMOUNT_RUPEES) {
      setAmountError(`Enter ₹${MIN_AMOUNT_RUPEES}–₹${MAX_AMOUNT_RUPEES.toLocaleString("en-IN")}`);
      return false;
    }
    setAmountError(undefined);
    return true;
  };

  const ensureRow = async (upiApp: string | null) => {
    if (rowRef.current) return { row: rowRef.current, remoteId: remoteIdRef.current };
    if (!draft) throw new Error("Scan a QR first.");
    const now = new Date().toISOString();
    const id = draft.localId ?? crypto.randomUUID();
    const row: LocalPayment = {
      id,
      vpa: draft.vpa,
      merchantName: draft.merchantName,
      amount: draft.amount,
      currency: "INR",
      upiApp,
      note: draft.note ?? null,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };
    payments.saveLocal(row);
    let remoteId = draft.remoteId;
    if (payments.signedIn) {
      const created = await payments.createRemote({
        vpa: row.vpa,
        merchantName: row.merchantName,
        amount: row.amount,
        currency: "INR",
        upiApp: upiApp ?? undefined,
        note: row.note ?? undefined,
        idempotencyKey: id,
      });
      remoteId = created.id;
      setDraft({ ...draft, localId: id, remoteId });
    } else {
      setDraft({ ...draft, localId: id });
    }
    remoteIdRef.current = remoteId;
    rowRef.current = row;
    return { row, remoteId };
  };

  const finish = () => {
    clearDraft();
    router.replace("/(tabs)/history");
  };

  const pay = async (app: UpiApp) => {
    if (Date.now() - lastPay.current < PAY_DEBOUNCE_MS) return;
    lastPay.current = Date.now();
    if (!draft || !amountOk()) return;
    payments.track("upi_app_selected", { app: app.name });
    setBusy(true);
    setPayError(undefined);
    try {
      const { row, remoteId } = await ensureRow(app.packageName);
      const launched = await persistStatus(payments, row, "upi_app_launched", remoteId);
      rowRef.current = launched;
      payments.track("upi_launched");
      const uri = buildUpiPayUri({
        vpa: draft.vpa,
        merchantName: draft.merchantName,
        amount: draft.amount,
        note: draft.note,
      });
      const result = mapHandoffResult(await launchUpiPay(uri, app.packageName));
      payments.track("payment_returned");
      // Returning from a UPI app is not SUCCESS unless the PSP said so.
      if (result === "success" || result === "failed") {
        await persistStatus(payments, launched, result, remoteId);
        finish();
        return;
      }
      rowRef.current = await persistStatus(payments, launched, "returned", remoteId);
      setConfirm(true);
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmStatus = async (status: PaymentStatus) => {
    const row = rowRef.current;
    if (!row) return;
    await persistStatus(payments, row, status, remoteIdRef.current);
    finish();
  };

  return {
    draft,
    setDraft,
    apps,
    busy,
    confirm,
    amountError,
    payError,
    pay,
    confirmStatus,
  };
}
