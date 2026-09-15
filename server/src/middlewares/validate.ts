import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError";

type Part = "body" | "query" | "params";

export function validate(schema: ZodType, part: Part = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Validation failed",
        parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    if (part === "query" || part === "params") {
      Object.defineProperty(req, part, {
        value: parsed.data,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      req.body = parsed.data;
    }
    next();
  };
}
