import { Router } from "express";
import { signinBodySchema, signupBodySchema } from "@pending/api-contract";
import { authController } from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";

export const authRouter = Router();

authRouter.post("/signup", validate(signupBodySchema), asyncHandler(authController.signup));
authRouter.post("/signin", validate(signinBodySchema), asyncHandler(authController.signin));
authRouter.post("/signout", authMiddleware, asyncHandler(authController.signout));
