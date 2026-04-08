import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import {
  appUsers,
  exercises,
  profiles,
  routineTemplateItems,
  routineTemplates,
  runningSessions,
  trainingScheduleEntries,
} from "../src/server/db/schema";
import { getUserProfile } from "../src/server/profile";
import { getScheduleOverview } from "../src/server/training/schedule";
import { getSummaryOverview } from "../src/server/training/summary";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const passwordHash = await hashPassword(`ModeTrainSchedule!${stamp}`);
  const createdUser = await createUser({
    displayName: "Schedule Smoke",
    email: `schedule+${stamp}@mode-train.local`,
    passwordHash,
  });

  try {
    await db
      .update(profiles)
      .set({
        goal: "Ser mas fuerte",
        experienceLevel: "Intermedio",
        preferredWeeklySessions: 4,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, createdUser.id));

    const profile = await getUserProfile(createdUser.id);

    if (!profile) {
      throw new Error("No se ha podido cargar el perfil de prueba.");
    }

    const [exercise] = await db
      .select({
        id: exercises.id,
      })
      .from(exercises)
      .where(eq(exercises.isSystem, true))
      .limit(1);

    if (!exercise) {
      throw new Error("No hay ejercicios del sistema disponibles.");
    }

    const [routine] = await db
      .insert(routineTemplates)
      .values({
        ownerUserId: createdUser.id,
        name: "Torso Smoke",
      })
      .returning({
        id: routineTemplates.id,
      });

    await db.insert(routineTemplateItems).values({
      routineTemplateId: routine.id,
      exerciseId: exercise.id,
      sortOrder: 0,
      targetSets: 3,
      targetRepsMin: 6,
      targetRepsMax: 10,
      targetRir: 2,
      restSeconds: 90,
      notes: "",
    });

    const today = new Date();
    const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate(),
    ).padStart(2, "0")}`;

    await db.insert(trainingScheduleEntries).values([
      {
        userId: createdUser.id,
        entryType: "gym",
        scheduledDate: isoDate,
        routineTemplateId: routine.id,
        title: "Torso Smoke",
        notes: "Push principal",
      },
      {
        userId: createdUser.id,
        entryType: "running",
        scheduledDate: isoDate,
        title: "Running suave",
        runningKind: "easy",
        runningTargetKm: 6,
        notes: "",
      },
    ]);

    await db.insert(runningSessions).values({
      userId: createdUser.id,
      kind: "easy",
      date: new Date(`${isoDate}T12:00:00`),
      distanceKm: 7.2,
      durationSeconds: 7.2 * 60 * 5,
      averagePaceSeconds: 300,
      notes: "Smoke",
    });

    const schedule = await getScheduleOverview(createdUser.id, today);
    const summary = await getSummaryOverview(createdUser.id);
    const todayEntries = schedule.days.find((day) => day.isToday)?.entries ?? [];

    if (
      todayEntries.length < 2 ||
      !todayEntries.some((entry) => entry.entryType === "gym") ||
      !todayEntries.some((entry) => entry.entryType === "running") ||
      summary.running.month.support === "--" ||
      summary.runningRecords.longestDistance === "--"
    ) {
      throw new Error("La agenda o el resumen no reflejan correctamente el nuevo modelo.");
    }

    console.log("Smoke schedule summary ok:", {
      entriesToday: todayEntries.length,
      longestDistance: summary.runningRecords.longestDistance,
      runningMonth: summary.running.month.support,
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
