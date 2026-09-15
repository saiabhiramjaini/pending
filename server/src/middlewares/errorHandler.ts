import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as Sentry from "@sentry/node";
import { AppError } from "../errors/AppError";

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
  if (isDev) {
    console.error(err);
  }
  return res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
    details: [],
  });
}
