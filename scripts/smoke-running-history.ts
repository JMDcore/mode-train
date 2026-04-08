import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import { appUsers } from "../src/server/db/schema";
import {
  createRunningSession,
  getRunningHistoryDetail,
  updateRunningSession,
} from "../src/server/training/running";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const passwordHash = await hashPassword(`ModeTrainRunning!${stamp}`);
  const createdUser = await createUser({
    displayName: "Running Smoke",
    email: `running+${stamp}@mode-train.local`,
    passwordHash,
  });

  try {
    const created = await createRunningSession(createdUser.id, {
      kind: "free",
      date: "2026-04-03",
      distanceKm: 5,
      durationMinutes: 28,
      notes: "Salida inicial",
    });

    await updateRunningSession(createdUser.id, created.id, {
      kind: "tempo",
      date: "2026-04-04",
      distanceKm: 8,
      durationMinutes: 40,
      notes: "Editada",
    });

    const detail = await getRunningHistoryDetail(createdUser.id, created.id);

    if (
      !detail ||
      detail.kind !== "tempo" ||
      detail.date !== "2026-04-04" ||
      detail.distanceKm !== 8 ||
      detail.durationMinutes !== 40 ||
      detail.notes !== "Editada" ||
      detail.averagePaceLabel !== "5:00/km"
    ) {
      throw new Error("La carrera editada no refleja correctamente los cambios.");
    }

    console.log("Smoke running history ok:", {
      runId: created.id,
      kind: detail.kind,
      date: detail.date,
      pace: detail.averagePaceLabel,
    });
  } finally {
    await db.delete(appUsers).where(eq(appUsers.id, createdUser.id));
    await getDbPool().end();
  }
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
