import { z } from "zod";
import { envelopeErrorSchema } from "@pending/api-contract";
import { ApiError, messageForStatus } from "./errors";

export function unwrapApiResponse<T>(schema: z.ZodType<T>, json: unknown): T {
  const error = envelopeErrorSchema.safeParse(json);
  if (error.success) {
    throw new ApiError(error.data.code, error.data.message, 400, error.data.details);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Unexpected response", 500);
  }
  return parsed.data;
}

export function unwrapSuccess<T>(dataSchema: z.ZodType<T>, json: unknown, status: number): T {
  const error = envelopeErrorSchema.safeParse(json);
  if (error.success) {
    throw new ApiError(error.data.code, error.data.message || messageForStatus(status), status, error.data.details);
  }
  const envelope = z
    .object({
      success: z.literal(true),
      message: z.string(),
      data: dataSchema,
    })
    .safeParse(json);
  if (!envelope.success) {
    throw new ApiError("VALIDATION_ERROR", "Unexpected response", status);
  }
  return envelope.data.data;
}
