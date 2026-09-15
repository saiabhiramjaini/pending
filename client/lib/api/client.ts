import { z } from "zod";
import {
  authDataSchema,
  createPaymentBodySchema,
  paymentAttemptSchema,
  patchPaymentBodySchema,
  transactionListDataSchema,
  userPublicSchema,
  type CreatePaymentBody,
  type PatchPaymentBody,
  type SigninBody,
  type SignupBody,
} from "@pending/api-contract";
import { unwrapSuccess } from "./unwrap";
import { ApiError } from "./errors";
import { apiBaseUrl } from "./baseUrl";

const emptySchema = z.object({}).passthrough();

export function createApiClient(getToken: () => string | null, onUnauthorized: () => void) {
  async function request<T>(
    path: string,
    schema: Parameters<typeof unwrapSuccess<T>>[0],
    init: RequestInit = {},
  ): Promise<T> {
    const token = getToken();
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
    const json: unknown = await res.json().catch(() => ({}));
    try {
      return unwrapSuccess(schema, json, res.status);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && token) {
        onUnauthorized();
      }
      throw error;
    }
  }

  return {
    signup: (body: SignupBody) =>
      request("/api/v1/auth/signup", authDataSchema, { method: "POST", body: JSON.stringify(body) }),
    signin: (body: SigninBody) =>
      request("/api/v1/auth/signin", authDataSchema, { method: "POST", body: JSON.stringify(body) }),
    signout: () => request("/api/v1/auth/signout", emptySchema, { method: "POST" }),
    profile: () => request("/api/v1/user/profile", userPublicSchema),
    deleteAccount: () => request("/api/v1/user", emptySchema, { method: "DELETE" }),
    createPayment: (body: CreatePaymentBody) =>
      request("/api/v1/payments", paymentAttemptSchema, {
        method: "POST",
        body: JSON.stringify(createPaymentBodySchema.parse(body)),
      }),
    patchPayment: (id: string, body: PatchPaymentBody) =>
      request(`/api/v1/payments/${id}`, paymentAttemptSchema, {
        method: "PATCH",
        body: JSON.stringify(patchPaymentBodySchema.parse(body)),
      }),
    getPayment: (id: string) => request(`/api/v1/payments/${id}`, paymentAttemptSchema),
    listTransactions: (cursor?: string) => {
      const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      return request(`/api/v1/transactions${q}`, transactionListDataSchema);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
