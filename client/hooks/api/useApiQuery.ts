import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { useApiSession } from "../../lib/api/session";
import type { ApiClient } from "../../lib/api/client";

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: (client: ApiClient) => Promise<T>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled"> & { enabled?: boolean },
) {
  const { status, client } = useApiSession();
  const ready = status === "ready" && client !== null;
  return useQuery({
    queryKey,
    queryFn: () => queryFn(client!),
    enabled: ready && (options?.enabled ?? true),
    ...options,
  });
}

export function useTransactions() {
  return useApiQuery(["api", "transactions"], (client) => client.listTransactions());
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api", "transactions"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api", "transactions"] }),
  });
}
