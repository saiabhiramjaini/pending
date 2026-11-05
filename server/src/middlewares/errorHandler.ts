import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { AppError } from "../errors/AppError";

// Query errors embed their values (emails, password hashes), so production logs only the type and code.
export function safeErrorSummary(err: unknown) {
  if (!(err instanceof Error)) return { name: typeof err };
  const code = (err.cause as { code?: unknown } | undefined)?.code;
  return { name: err.name, code: typeof code === "string" ? code : undefined };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  Sentry.captureException(err);
  const isDev = process.env.NODE_ENV !== "production";
  console.error(isDev ? err : safeErrorSummary(err));
  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
    details: [],
  });
}
