import { Router } from "express";
import { authController } from "../controllers/authController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authMiddleware } from "../middlewares/authMiddleware";

export const userRouter = Router();
userRouter.use(authMiddleware);
userRouter.get("/profile", asyncHandler(authController.profile));
userRouter.delete("/", asyncHandler(authController.deleteAccount));
