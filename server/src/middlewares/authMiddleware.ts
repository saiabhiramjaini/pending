import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";

export type AuthPayload = { userId: string; email: string };

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

function readToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  const cookie = req.cookies?.token;
  if (typeof cookie === "string" && cookie.length > 0) {
    return cookie;
  }
  return undefined;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }
}
