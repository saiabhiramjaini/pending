import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}
