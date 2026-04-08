import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import { appUsers, profiles, routineTemplateItems, routineTemplates } from "../src/server/db/schema";
import { getUserProfile } from "../src/server/profile";
import { getHistoryOverview, getWorkoutHistoryDetail } from "../src/server/training/history";
import { getProgressOverview } from "../src/server/training/progress";
import { createStarterWeek } from "../src/server/training/starter-plan";
import {
  completeWorkoutSession,
  saveWorkoutExerciseBlock,
  startOrResumeWorkoutSession,
} from "../src/server/training/workouts";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const passwordHash = await hashPassword(`ModeTrain!${stamp}`);
  const createdUser = await createUser({
    displayName: "Insights Smoke",
    email: `insights+${stamp}@mode-train.local`,
    passwordHash,
  });

  try {
    await db
      .update(profiles)
      .set({
        goal: "Ser mas fuerte",
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
      })
      .from(routineTemplates)
      .where(eq(routineTemplates.ownerUserId, createdUser.id))
      .limit(1);

    if (!routine) {
      throw new Error("No se ha generado la rutina base.");
    }

    const items = await db
      .select({
        exerciseId: routineTemplateItems.exerciseId,
      })
      .from(routineTemplateItems)
      .where(eq(routineTemplateItems.routineTemplateId, routine.id))
      .limit(2);

    if (items.length < 2) {
      throw new Error("La rutina base no tiene suficientes ejercicios para el smoke.");
    }

    const firstSession = await startOrResumeWorkoutSession(createdUser.id, routine.id);

    await saveWorkoutExerciseBlock({
      userId: createdUser.id,
      sessionId: firstSession.sessionId,
      exerciseId: items[0].exerciseId,
      sets: [
        { weightKg: 80, reps: 6, rir: 2 },
        { weightKg: 80, reps: 6, rir: 2 },
      ],
    });

    await completeWorkoutSession(createdUser.id, firstSession.sessionId);

    const secondSession = await startOrResumeWorkoutSession(createdUser.id, routine.id);

    await saveWorkoutExerciseBlock({
      userId: createdUser.id,
      sessionId: secondSession.sessionId,
      exerciseId: items[0].exerciseId,
      sets: [
        { weightKg: 82.5, reps: 6, rir: 1 },
      ],
    });

    await saveWorkoutExerciseBlock({
      userId: createdUser.id,
      sessionId: secondSession.sessionId,
      exerciseId: items[1].exerciseId,
      sets: [
        { weightKg: 55, reps: 10, rir: 2 },
      ],
    });

    await completeWorkoutSession(createdUser.id, secondSession.sessionId);

    const history = await getHistoryOverview(createdUser.id);
    const detail = await getWorkoutHistoryDetail(createdUser.id, secondSession.sessionId);
    const progress = await getProgressOverview(createdUser.id);

    if (
      history.entries.length < 2 ||
      history.entries[0]?.kind !== "workout" ||
      !detail ||
      detail.exerciseCount < 2 ||
      detail.savedSets !== 2 ||
      progress.cards.length === 0 ||
      !progress.cards.some(
        (card) =>
          card.latestPerformanceLabel.includes("82.5 kg") &&
          (card.trendLabel?.includes("+2.5 kg") ?? false),
      )
    ) {
      throw new Error("Historial o progreso no reflejan correctamente la evolucion.");
    }

    console.log("Smoke history progress ok:", {
      latestHistoryTitle: history.entries[0]?.title ?? null,
      firstProgressCard: progress.cards[0]?.exerciseName ?? null,
      trend: progress.cards[0]?.trendLabel ?? null,
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
