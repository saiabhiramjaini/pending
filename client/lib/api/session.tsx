import * as SecureStore from "expo-secure-store";
import * as Sentry from "@sentry/react-native";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createApiClient, type ApiClient } from "./client";
import { discardLocalPayments } from "../storage/payments";
import { usePaymentDraft } from "../../stores/paymentDraft";

const TOKEN_KEY = "pending.jwt";

type Status = "loading" | "signed_out" | "ready";

type SessionValue = {
  status: Status;
  client: ApiClient | null;
  actions: {
    setToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
  };
};

const SessionContext = createContext<SessionValue | null>(null);

export function ApiSessionProvider({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  const [token, setTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then((value) => {
      setTokenState(value);
      setStatus(value ? "ready" : "signed_out");
    });
  }, []);

  const actions = useMemo(
    () => ({
      setToken: async (next: string) => {
        await SecureStore.setItemAsync(TOKEN_KEY, next);
        discardLocalPayments();
        usePaymentDraft.getState().clearDraft();
        await queryClient.cancelQueries({ queryKey: ["api"] });
        queryClient.removeQueries({ queryKey: ["api"] });
        setTokenState(next);
        setStatus("ready");
      },
      signOut: async () => {
        try {
          // Remove the stored token first so a crash mid-sign-out cannot restore the session.
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } finally {
          setTokenState(null);
          setStatus("signed_out");
          usePaymentDraft.getState().clearDraft();
          discardLocalPayments();
          await queryClient.cancelQueries({ queryKey: ["api"] });
          queryClient.removeQueries({ queryKey: ["api"] });
        }
      },
    }),
    [queryClient],
  );

  const client = useMemo(
    () => createApiClient(() => token, () => {
      actions.signOut().catch((error) => Sentry.captureException(error));
    }),
    [token, actions],
  );

  const value: SessionValue = {
    status,
    client: status === "ready" ? client : status === "signed_out" ? client : null,
    actions,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useApiSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("ApiSessionProvider is required");
  }
  return ctx;
}
