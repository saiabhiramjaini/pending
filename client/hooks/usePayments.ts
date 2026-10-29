import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listLocalPayments, type LocalPayment, upsertLocalPayment } from "../lib/storage/payments";
import { monthTotalIst, persistPaymentStatus } from "../lib/payments/records";
import { useFocusEffect } from "expo-router";
import { useApiSession } from "../lib/api/session";
import { TRANSACTIONS_KEY, useCreatePayment, usePatchPayment, useTransactions } from "./api/useApiQuery";
import { track } from "../lib/analytics";
import type { PaymentStatus } from "../lib/storage/payments";

export function usePayments() {
  const { status } = useApiSession();
  const remote = useTransactions();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<LocalPayment[]>([]);

  const refreshLocal = useCallback(() => {
    setLocal(listLocalPayments());
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal, status]);
  useFocusEffect(
    useCallback(() => {
      refreshLocal();
      // Payments only mark history stale; reload it once when a list is shown again.
      void queryClient.refetchQueries({ queryKey: TRANSACTIONS_KEY, stale: true }, { cancelRefetch: false });
    }, [queryClient, refreshLocal]),
  );

  const signedIn = status === "ready";
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

  const total = monthTotalIst(items);

  return {
    items,
    total,
    loading: status === "loading" || (signedIn && remote.isLoading),
    refreshing: signedIn && remote.isRefetching,
    error: signedIn ? remote.isError : false,
    refresh: signedIn ? () => remote.refetch() : refreshLocal,
  };
}

// Recording a payment must never wait on, or reload, the history list.
export function usePaymentRecorder() {
  const { status } = useApiSession();
  const createRemote = useCreatePayment();
  const patchRemote = usePatchPayment();
  return {
    sessionLoading: status === "loading",
    signedIn: status === "ready",
    saveLocal: upsertLocalPayment,
    createRemote: createRemote.mutateAsync,
    patchRemote: patchRemote.mutateAsync,
    track,
  };
}

export async function persistStatus(
  recorder: ReturnType<typeof usePaymentRecorder>,
  row: LocalPayment,
  status: PaymentStatus,
  remoteId?: string,
) {
  const next = await persistPaymentStatus(recorder, row, status, remoteId);
  if (status === "success" || status === "failed" || status === "unknown") {
    recorder.track("status_confirmed", { status });
  }
  if (status === "success") {
    recorder.track("transaction_recorded");
  }
  return next;
}
