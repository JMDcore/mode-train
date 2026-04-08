import { Pool } from "pg";

declare global {
  var __modeTrainPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

export const hasDatabaseConfig = Boolean(connectionString);

export function getDbPool() {
  if (!connectionString) {
    throw new Error("DATABASE_URL no configurada.");
  }

  if (!global.__modeTrainPool) {
    global.__modeTrainPool = new Pool({
      connectionString,
      max: 8,
      idleTimeoutMillis: 30_000,
    });
  }

  return global.__modeTrainPool;
}
