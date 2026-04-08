import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { getDbPool } from "@/server/db/client";
import * as schema from "@/server/db/schema";

type ModeTrainDb = NodePgDatabase<typeof schema>;

declare global {
  var __modeTrainDb: ModeTrainDb | undefined;
}

export function getDb(): ModeTrainDb {
  if (!global.__modeTrainDb) {
    global.__modeTrainDb = drizzle(getDbPool(), { schema });
  }

  return global.__modeTrainDb;
}

export { schema };
