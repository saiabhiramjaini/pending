import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { buildUpiPayUri, MAX_AMOUNT_RUPEES, MIN_AMOUNT_RUPEES } from "../lib/upi/parse";
import { listUpiApps, launchUpiPay, type UpiApp } from "../lib/native/upi";
import { usePaymentDraft } from "../stores/paymentDraft";
import { persistStatus, usePaymentRecorder } from "./usePayments";
import { PAY_DEBOUNCE_MS } from "@pending/api-contract";
import type { LocalPayment, PaymentStatus } from "../lib/storage/payments";
import { createPaymentRecord } from "../lib/payments/records";
import type { PaymentDraft } from "../stores/paymentDraft";

const ERROR_COPY = "Something went wrong. Try again.";

function mapHandoffResult(result: string): PaymentStatus {
  if (result === "success" || result === "failed" || result === "unknown") return result;
  return "unknown";
}

export function usePayHandoff() {
  const router = useRouter();
  const draft = usePaymentDraft((s) => s.draft);
  const setDraft = usePaymentDraft((s) => s.setDraft);
  const updateSession = usePaymentDraft((s) => s.updateSession);
  const clearSession = usePaymentDraft((s) => s.clearSession);
  const recorder = usePaymentRecorder();
  const [apps, setApps] = useState<UpiApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(!!draft?.handoffStarted);
  // A status left in the draft by a restart was never saved, so offer the retry.
  const [pendingStatus, setPendingStatus] = useState<PaymentStatus | undefined>(draft?.pendingStatus);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [payError, setPayError] = useState<string | undefined>();
  const lastPay = useRef(0);
  const locked = useRef(false);
  const draftRef = useRef(draft);
  const rowRef = useRef<LocalPayment | null>(draft?.record ?? null);
  const remoteIdRef = useRef<string | undefined>(draft?.remoteId);

  useEffect(() => {
    void listUpiApps().then(setApps).catch(() => setPayError(ERROR_COPY));
  }, []);

  useEffect(() => { draftRef.current = draft; }, [draft]);

  const updateDraft = (next: PaymentDraft) => {
    if (!updateSession(next)) throw new Error(ERROR_COPY);
    draftRef.current = next;
  };

  // Stored before each save so a restart can retry it; shown only after a save fails.
  const rememberStatus = (status: PaymentStatus | undefined) => {
    if (draftRef.current) updateDraft({ ...draftRef.current, pendingStatus: status });
  };

  const saveFailed = (error: unknown) => {
    setPendingStatus(draftRef.current?.pendingStatus);
    setPayError(error instanceof Error ? error.message : ERROR_COPY);
  };

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
    const current = draftRef.current;
    if (!current) throw new Error("Scan a QR first.");
    const { row, remoteId, draft: stable } = await createPaymentRecord(current, upiApp, recorder, updateDraft);
    updateDraft({ ...stable, remoteId, record: row });
    remoteIdRef.current = remoteId;
    rowRef.current = row;
    return { row, remoteId };
  };

  const finish = () => {
    const sessionId = draftRef.current?.sessionId;
    if (!sessionId || !clearSession(sessionId)) return;
    router.replace("/(tabs)/history");
  };

  const pay = async (app: UpiApp) => {
    if (locked.current || confirm || recorder.sessionLoading) return;
    if (Date.now() - lastPay.current < PAY_DEBOUNCE_MS) return;
    lastPay.current = Date.now();
    if (!draft || !amountOk()) return;
    recorder.track("upi_app_selected", { app: app.name });
    locked.current = true;
    setBusy(true);
    setPayError(undefined);
    try {
      const { row, remoteId } = await ensureRow(app.packageName);
      const launched = await persistStatus(recorder, row, "upi_app_launched", remoteId);
      rowRef.current = launched;
      if (draftRef.current) updateDraft({ ...draftRef.current, record: launched, handoffStarted: true });
      recorder.track("upi_launched");
      const uri = buildUpiPayUri({
        vpa: draft.vpa,
        merchantName: draft.merchantName,
        amount: draft.amount,
        note: draft.note,
      });
      let result: PaymentStatus;
      try {
        result = mapHandoffResult(await launchUpiPay(uri, app.packageName));
      } catch (error) {
        // A failed or interrupted launch needs confirmation before another handoff.
        setConfirm(true);
        throw error;
      }
      recorder.track("payment_returned");
      // Returning from a UPI app is not SUCCESS unless the PSP said so.
      if (result === "success" || result === "failed") {
        setConfirm(true);
        rememberStatus(result);
        await persistStatus(recorder, launched, result, remoteId);
        finish();
        return;
      }
      setConfirm(true);
      rememberStatus("returned");
      rowRef.current = await persistStatus(recorder, launched, "returned", remoteId);
      if (draftRef.current) updateDraft({ ...draftRef.current, record: rowRef.current });
      rememberStatus(undefined);
    } catch (error) {
      saveFailed(error);
    } finally {
      setBusy(false);
      locked.current = false;
    }
  };

  const confirmStatus = async (status: PaymentStatus) => {
    if (locked.current) return;
    const row = rowRef.current;
    if (!row) return;
    locked.current = true;
    setBusy(true);
    setPayError(undefined);
    try {
      rememberStatus(status);
      const next = await persistStatus(recorder, row, status, remoteIdRef.current);
      rowRef.current = next;
      if (draftRef.current) updateDraft({ ...draftRef.current, record: next });
      rememberStatus(undefined);
      setPendingStatus(undefined);
      if (status !== "returned") finish();
    } catch (error) {
      saveFailed(error);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return {
    draft,
    setDraft,
    apps,
    busy: busy || recorder.sessionLoading,
    confirm,
    pendingStatus,
    amountError,
    payError,
    pay,
    confirmStatus,
  };
}
