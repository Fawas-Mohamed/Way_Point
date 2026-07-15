import { PrismaClient } from "@prisma/client";
import { isProduction } from "../config/env";

// A single PrismaClient instance is reused across the app (and, in dev,
// across hot-reloads via globalThis) to avoid exhausting the Postgres
// connection pool — a very common bug in ts-node-dev setups where each
// reload would otherwise instantiate a fresh client.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["error", "warn", "query"],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
