import type { Request, Response } from "express";
import { JWT_MAX_AGE_MS } from "@pending/api-contract";
import { authService } from "../services/authService";

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, { httpOnly: true, maxAge: JWT_MAX_AGE_MS });
}

export const authController = {
  async signup(req: Request, res: Response) {
    const data = await authService.signup(req.body);
    setAuthCookie(res, data.token);
    res.status(201).json({ success: true, message: "User registered successfully", data });
  },
  async signin(req: Request, res: Response) {
    const data = await authService.signin(req.body);
    setAuthCookie(res, data.token);
    res.status(200).json({ success: true, message: "User signed in successfully", data });
  },
  async signout(_req: Request, res: Response) {
    res.clearCookie("token", { httpOnly: true });
    res.status(200).json({ success: true, message: "User signed out successfully", data: {} });
  },
  async profile(req: Request, res: Response) {
    const data = await authService.profile(req.auth!.userId);
    res.status(200).json({ success: true, message: "OK", data });
  },
  async deleteAccount(req: Request, res: Response) {
    await authService.deleteAccount(req.auth!.userId);
    res.clearCookie("token", { httpOnly: true });
    res.status(200).json({ success: true, message: "Account deleted", data: {} });
  },
};
