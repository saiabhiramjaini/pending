import { Router } from "express";
import {
  createPaymentBodySchema,
  listTransactionsQuerySchema,
  patchPaymentBodySchema,
} from "@pending/api-contract";
import { z } from "zod";
import { paymentController } from "../controllers/paymentController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";

const idParams = z.object({ id: z.string().uuid() });

export const paymentRouter = Router();
paymentRouter.use(authMiddleware);
paymentRouter.post("/", validate(createPaymentBodySchema), asyncHandler(paymentController.create));
paymentRouter.get("/:id", validate(idParams, "params"), asyncHandler(paymentController.get));
paymentRouter.patch(
  "/:id",
  validate(idParams, "params"),
  validate(patchPaymentBodySchema),
  asyncHandler(paymentController.patch),
);

export const transactionRouter = Router();
transactionRouter.use(authMiddleware);
transactionRouter.get(
  "/",
  validate(listTransactionsQuerySchema, "query"),
  asyncHandler(paymentController.list),
);
