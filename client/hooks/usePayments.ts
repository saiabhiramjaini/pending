import { useCallback, useEffect, useState } from "react";
import { listLocalPayments, monthTotalIst, type LocalPayment, upsertLocalPayment } from "../lib/storage/payments";
import { useApiSession } from "../lib/api/session";
import { useCreatePayment, usePatchPayment, useTransactions } from "../hooks/api/useApiQuery";
import { track } from "../lib/analytics";
import type { PaymentStatus } from "../lib/storage/payments";

export function usePayments() {
  const { status } = useApiSession();
  const remote = useTransactions();
  const createRemote = useCreatePayment();
  const patchRemote = usePatchPayment();
  const [local, setLocal] = useState<LocalPayment[]>([]);
  const [tick, setTick] = useState(0);

  const refreshLocal = useCallback(() => {
    setLocal(listLocalPayments());
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  const signedIn = status === "ready";
  const inMonth = (iso: string) => {
    const now = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
    const row = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(iso));
    return row.slice(0, 7) === now.slice(0, 7);
  };
  const items: LocalPayment[] = signedIn
    ? (remote.data?.items ?? []).map((row) => ({
        id: row.paymentAttemptId,
        vpa: row.vpa,
        merchantName: row.merchantName,
        amount: row.amount,
        currency: "INR",
        upiApp: null,
        note: null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
      }))
    : local;

  const total = signedIn
    ? String(
        items
          .filter((row) => row.status === "success" && inMonth(row.createdAt))
          .reduce((sum, row) => sum + Number(row.amount), 0),
      )
    : monthTotalIst();

  return {
    items,
    total,
    loading: signedIn ? remote.isLoading : false,
    error: signedIn ? remote.isError : false,
    refresh: signedIn ? () => remote.refetch() : refreshLocal,
    signedIn,
    tick,
    saveLocal: (row: LocalPayment) => {
      upsertLocalPayment(row);
      refreshLocal();
    },
    createRemote: createRemote.mutateAsync,
    patchRemote: patchRemote.mutateAsync,
    track,
  };
}

export async function persistStatus(
  payments: ReturnType<typeof usePayments>,
  row: LocalPayment,
  status: PaymentStatus,
  remoteId?: string,
) {
  const next = { ...row, status, updatedAt: new Date().toISOString() };
  payments.saveLocal(next);
  if (payments.signedIn && remoteId) {
    await payments.patchRemote({ id: remoteId, status });
  }
  if (status === "success" || status === "failed" || status === "unknown") {
    payments.track("status_confirmed", { status });
  }
  if (status === "success") {
    payments.track("transaction_recorded");
  }
  return next;
}
