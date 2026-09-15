import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cached: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg> | null = null;

function isNeonUrl(url: string) {
  return url.includes("neon.tech") || url.includes("neon.build");
}

export function getDb() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  cached = isNeonUrl(url)
    ? drizzleNeon(neon(url), { schema })
    : drizzlePg(postgres(url, { max: 4 }), { schema });
  return cached;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
