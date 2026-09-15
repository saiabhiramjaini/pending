import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "@pending/api-contract";
import { authRouter } from "./routes/authRoutes";
import { userRouter } from "./routes/userRoutes";
import { paymentRouter, transactionRouter } from "./routes/paymentRoutes";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: true,
    }),
  );

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK", data: { status: "OK" } });
  });

  app.get("/api/v1/docs.json", (_req, res) => {
    res.json(generateOpenApiDocument());
  });
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/payments", paymentRouter);
  app.use("/api/v1/transactions", transactionRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
