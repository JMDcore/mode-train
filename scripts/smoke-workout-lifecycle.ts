import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { buildInitials, createUser } from "../src/server/auth/user";
import { getAppSnapshot } from "../src/server/app/snapshot";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import {
  appUsers,
  profiles,
  routineTemplateItems,
  routineTemplates,
} from "../src/server/db/schema";
import { getUserProfile } from "../src/server/profile";
import { createStarterWeek } from "../src/server/training/starter-plan";
import {
  completeWorkoutSession,
  getActiveWorkoutSummary,
  getWorkoutSessionDetail,
  saveWorkoutExerciseBlock,
  startOrResumeWorkoutSession,
} from "../src/server/training/workouts";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const passwordHash = await hashPassword(`ModeTrain!${stamp}`);
  const createdUser = await createUser({
    displayName: "Workout Smoke",
    email: `workout+${stamp}@mode-train.local`,
    passwordHash,
  });

  try {
    await db
      .update(profiles)
      .set({
        goal: "Fuerza",
        experienceLevel: "Intermedio",
        preferredWeeklySessions: 3,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, createdUser.id));

    const profile = await getUserProfile(createdUser.id);

    if (!profile) {
      throw new Error("No se ha podido cargar el perfil de prueba.");
    }

    await createStarterWeek({
      userId: createdUser.id,
      profile,
    });

    const [routine] = await db
      .select({
        id: routineTemplates.id,
        name: routineTemplates.name,
      })
      .from(routineTemplates)
      .where(eq(routineTemplates.ownerUserId, createdUser.id))
      .limit(1);

    if (!routine) {
      throw new Error("No se ha generado ninguna rutina de prueba.");
    }

    const [firstItem] = await db
      .select({
        exerciseId: routineTemplateItems.exerciseId,
      })
      .from(routineTemplateItems)
      .where(eq(routineTemplateItems.routineTemplateId, routine.id))
      .limit(1);

    if (!firstItem) {
      throw new Error("La rutina de prueba ha quedado vacia.");
    }

    const started = await startOrResumeWorkoutSession(createdUser.id, routine.id);
    const resumed = await startOrResumeWorkoutSession(createdUser.id, routine.id);

    if (!resumed.resumed || resumed.sessionId !== started.sessionId) {
      throw new Error("La sesion no se ha reanudado correctamente.");
    }

    await saveWorkoutExerciseBlock({
      userId: createdUser.id,
      sessionId: started.sessionId,
      exerciseId: firstItem.exerciseId,
      sets: [
        { weightKg: 100, reps: 5, rir: 2 },
        { weightKg: 100, reps: 5, rir: 2 },
      ],
    });

    await saveWorkoutExerciseBlock({
      userId: createdUser.id,
      sessionId: started.sessionId,
      exerciseId: firstItem.exerciseId,
      sets: [
        { weightKg: 102.5, reps: 5, rir: 1 },
      ],
    });

    const detailBeforeComplete = await getWorkoutSessionDetail(createdUser.id, started.sessionId);
    const activeBeforeComplete = await getActiveWorkoutSummary(createdUser.id);

    if (
      !detailBeforeComplete ||
      detailBeforeComplete.savedSets !== 1 ||
      detailBeforeComplete.completedExercises !== 1 ||
      detailBeforeComplete.exercises[0]?.currentSets.length !== 1 ||
      detailBeforeComplete.exercises[0]?.currentSets[0]?.weightKg !== 102.5 ||
      !activeBeforeComplete ||
      activeBeforeComplete.sessionId !== started.sessionId
    ) {
      throw new Error("La sesion activa no refleja los sets guardados.");
    }

    await completeWorkoutSession(createdUser.id, started.sessionId);

    const detailAfterComplete = await getWorkoutSessionDetail(createdUser.id, started.sessionId);
    const activeAfterComplete = await getActiveWorkoutSummary(createdUser.id);
    const refreshedProfile = await getUserProfile(createdUser.id);

    if (!refreshedProfile) {
      throw new Error("No se ha podido recargar el perfil tras cerrar la sesion.");
    }

    const snapshot = await getAppSnapshot({
      user: {
        id: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
        avatarPath: createdUser.avatarPath,
        initials: buildInitials(createdUser.displayName),
      },
      profile: refreshedProfile,
    });

    if (
      detailAfterComplete === null ||
      !detailAfterComplete.isFinished ||
      activeAfterComplete !== null ||
      snapshot.summary.gym.total.sessions === "0 sesiones"
    ) {
      throw new Error("El cierre de sesion no se ha reflejado en el dashboard.");
    }

    console.log("Smoke workout lifecycle ok:", {
      routineName: routine.name,
      sessionId: started.sessionId,
      gymTotal: snapshot.summary.gym.total.sessions,
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
