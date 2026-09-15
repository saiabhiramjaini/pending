import "./config/env";
import * as Sentry from "@sentry/node";
import { createApp } from "./app";
import { env } from "./config/env";

Sentry.init({
  dsn: env.sentryDsn || undefined,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.Authorization;
    }
    return event;
  },
});

process.on("unhandledRejection", (reason) => {
  console.error(reason);
  Sentry.captureException(reason);
});
process.on("uncaughtException", (error) => {
  console.error(error);
  Sentry.captureException(error);
});

const app = createApp();
const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`Pending API on http://0.0.0.0:${env.port}`);
});

export { app, server };
