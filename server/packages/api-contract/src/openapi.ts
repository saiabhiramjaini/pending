import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  authDataSchema,
  createPaymentBodySchema,
  envelopeErrorSchema,
  healthDataSchema,
  patchPaymentBodySchema,
  paymentAttemptSchema,
  signinBodySchema,
  signupBodySchema,
  transactionListDataSchema,
  userPublicSchema,
} from "./schemas";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const success = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  responses: {
    200: { description: "ok", content: { "application/json": { schema: success(healthDataSchema) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signup",
  request: { body: { content: { "application/json": { schema: signupBodySchema } } } },
  responses: {
    201: { description: "created", content: { "application/json": { schema: success(authDataSchema) } } },
    400: { description: "error", content: { "application/json": { schema: envelopeErrorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signin",
  request: { body: { content: { "application/json": { schema: signinBodySchema } } } },
  responses: {
    200: { description: "ok", content: { "application/json": { schema: success(authDataSchema) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/signout",
  responses: {
    200: { description: "ok" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/user/profile",
  responses: {
    200: { description: "ok", content: { "application/json": { schema: success(userPublicSchema) } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments",
  request: { body: { content: { "application/json": { schema: createPaymentBodySchema } } } },
  responses: {
    201: { description: "created", content: { "application/json": { schema: success(paymentAttemptSchema) } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/payments/{id}",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: patchPaymentBodySchema } } },
  },
  responses: {
    200: { description: "ok", content: { "application/json": { schema: success(paymentAttemptSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/payments/{id}",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "ok", content: { "application/json": { schema: success(paymentAttemptSchema) } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/transactions",
  responses: {
    200: {
      description: "ok",
      content: { "application/json": { schema: success(transactionListDataSchema) } },
    },
  },
});

export function generateOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "Pending API", version: "0.0.1" },
    servers: [{ url: "/" }],
  });
}
