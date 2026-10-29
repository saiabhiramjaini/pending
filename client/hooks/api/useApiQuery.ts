import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useApiSession } from "../../lib/api/session";
import type { ApiClient } from "../../lib/api/client";
import { listAllTransactions } from "../../lib/api/transactions";

export const TRANSACTIONS_KEY = ["api", "transactions"] as const;

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: (client: ApiClient, signal: AbortSignal) => Promise<T>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled"> & { enabled?: boolean },
) {
  const { status, client } = useApiSession();
  const ready = status === "ready" && client !== null;
  return useQuery({
    ...options,
    queryKey,
    queryFn: ({ signal }) => queryFn(client!, signal),
    enabled: ready && (options?.enabled ?? true),
  });
}

export function useTransactions() {
  // Every page loads per fetch, so only an invalidation or pull-to-refresh refetches.
  return useApiQuery(TRANSACTIONS_KEY, (client, signal) => listAllTransactions(client, signal), {
    staleTime: Infinity,
  });
}

export function useCreatePayment() {
  const { client } = useApiSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<ApiClient["createPayment"]>[0]) => {
      if (!client) throw new Error("Not signed in");
      return client.createPayment(body);
    },
    retry: false,
    // Mark stale only; the list reloads once when it is shown again.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY, refetchType: "none" }),
  });
}

export function usePatchPayment() {
  const { client } = useApiSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: Parameters<ApiClient["patchPayment"]>[1]["status"] }) => {
      if (!client) throw new Error("Not signed in");
      return client.patchPayment(input.id, { status: input.status });
    },
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY, refetchType: "none" }),
  });
}
