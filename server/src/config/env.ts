import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:8081",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
