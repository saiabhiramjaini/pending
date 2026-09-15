import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createApiClient, type ApiClient } from "./client";
import { discardLocalPayments } from "../storage/payments";

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
        discardLocalPayments();
        await SecureStore.setItemAsync(TOKEN_KEY, next);
        setTokenState(next);
        setStatus("ready");
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setTokenState(null);
        setStatus("signed_out");
        queryClient.removeQueries({ queryKey: ["api"] });
      },
    }),
    [queryClient],
  );

  const client = useMemo(
    () => createApiClient(() => token, () => void actions.signOut()),
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
