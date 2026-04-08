import { and, asc, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  exercises,
  routineTemplateItems,
  routineTemplates,
  workoutSessions,
  workoutSets,
} from "@/server/db/schema";

export type ActiveWorkoutSummary = {
  sessionId: string;
  routineId: string | null;
  routineName: string;
  startedAtLabel: string;
  completedExercises: number;
  totalExercises: number;
  savedSets: number;
};

export type WorkoutExerciseDetail = {
  routineItemId: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  equipment: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number | null;
  restSeconds: number | null;
  notes: string;
  currentSets: Array<{
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
  }>;
  lastPerformanceSummary: string | null;
};

export type WorkoutSessionDetail = {
  sessionId: string;
  routineId: string | null;
  routineName: string;
  startedAt: Date;
  startedAtLabel: string;
  finishedAtLabel: string | null;
  isFinished: boolean;
  savedSets: number;
  completedExercises: number;
  totalExercises: number;
  exercises: WorkoutExerciseDetail[];
};

function formatStartedAt(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLastPerformance(input: {
  routineName: string | null;
  reps: number | null;
  weightKg: number | null;
  rir: number | null;
}) {
  const parts: string[] = [];

  if (input.weightKg !== null) {
    parts.push(`${input.weightKg} kg`);
  }

  if (input.reps !== null) {
    parts.push(`${input.reps} reps`);
  }

  if (input.rir !== null) {
    parts.push(`RIR ${input.rir}`);
  }

  if (parts.length === 0) {
    return input.routineName ? `Ultimo bloque en ${input.routineName}` : "Ultimo registro";
  }

  return `${parts.join(" · ")}${input.routineName ? ` · ${input.routineName}` : ""}`;
}

export async function findOpenWorkoutSessionForUser(userId: string) {
  const db = getDb();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      routineTemplateId: workoutSessions.routineTemplateId,
      startedAt: workoutSessions.startedAt,
      routineName: routineTemplates.name,
    })
    .from(workoutSessions)
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.finishedAt),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);

  return session ?? null;
}

export async function startOrResumeWorkoutSession(userId: string, routineId: string) {
  const db = getDb();
  const existingSession = await findOpenWorkoutSessionForUser(userId);

  if (existingSession) {
    return {
      sessionId: existingSession.id,
      resumed: true,
    };
  }

  const [routine] = await db
    .select({
      id: routineTemplates.id,
      name: routineTemplates.name,
    })
    .from(routineTemplates)
    .where(
      and(
        eq(routineTemplates.id, routineId),
        eq(routineTemplates.ownerUserId, userId),
      ),
    )
    .limit(1);

  if (!routine) {
    throw new Error("No hemos encontrado esa rutina.");
  }

  const [itemCountRecord] = await db
    .select({
      count: count(),
    })
    .from(routineTemplateItems)
    .where(eq(routineTemplateItems.routineTemplateId, routine.id));

  if (Number(itemCountRecord?.count ?? 0) === 0) {
    throw new Error("Anade al menos un ejercicio antes de iniciar la sesion.");
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      routineTemplateId: routine.id,
      notes: "",
    })
    .returning({
      id: workoutSessions.id,
    });

  return {
    sessionId: session.id,
    resumed: false,
  };
}

export async function getActiveWorkoutSummary(userId: string): Promise<ActiveWorkoutSummary | null> {
  const db = getDb();
  const session = await findOpenWorkoutSessionForUser(userId);

  if (!session) {
    return null;
  }

  const [savedSetsRecord] = await db
    .select({
      count: count(),
    })
    .from(workoutSets)
    .where(eq(workoutSets.workoutSessionId, session.id));

  const [savedExercisesRecord] = await db
    .select({
      count: sql<number>`count(distinct ${workoutSets.exerciseId})`,
    })
    .from(workoutSets)
    .where(eq(workoutSets.workoutSessionId, session.id));

  const [totalExercisesRecord] =
    session.routineTemplateId === null
      ? [{ count: 0 }]
      : await db
          .select({
            count: count(),
          })
          .from(routineTemplateItems)
          .where(eq(routineTemplateItems.routineTemplateId, session.routineTemplateId));

  return {
    sessionId: session.id,
    routineId: session.routineTemplateId,
    routineName: session.routineName ?? "Sesion de fuerza",
    startedAtLabel: formatStartedAt(session.startedAt),
    completedExercises: Number(savedExercisesRecord?.count ?? 0),
    totalExercises: Number(totalExercisesRecord?.count ?? 0),
    savedSets: Number(savedSetsRecord?.count ?? 0),
  };
}

async function getLastPerformanceSummary(userId: string, exerciseId: string, excludeSessionId: string) {
  const db = getDb();

  const [record] = await db
    .select({
      routineName: routineTemplates.name,
      reps: workoutSets.reps,
      weightKg: workoutSets.weightKg,
      rir: workoutSets.rir,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSets.exerciseId, exerciseId),
        isNotNull(workoutSessions.finishedAt),
        sql`${workoutSessions.id} <> ${excludeSessionId}`,
      ),
    )
    .orderBy(desc(workoutSessions.finishedAt), desc(workoutSets.setNumber))
    .limit(1);

  if (!record) {
    return null;
  }

  return formatLastPerformance(record);
}

export async function getWorkoutSessionDetail(
  userId: string,
  sessionId: string,
): Promise<WorkoutSessionDetail | null> {
  const db = getDb();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      routineTemplateId: workoutSessions.routineTemplateId,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      routineName: routineTemplates.name,
    })
    .from(workoutSessions)
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  const items =
    session.routineTemplateId === null
      ? []
      : await db
          .select({
            routineItemId: routineTemplateItems.id,
            exerciseId: routineTemplateItems.exerciseId,
            exerciseName: exercises.name,
            primaryMuscleGroup: exercises.primaryMuscleGroup,
            equipment: exercises.equipment,
            targetSets: routineTemplateItems.targetSets,
            targetRepsMin: routineTemplateItems.targetRepsMin,
            targetRepsMax: routineTemplateItems.targetRepsMax,
            targetRir: routineTemplateItems.targetRir,
            restSeconds: routineTemplateItems.restSeconds,
            notes: routineTemplateItems.notes,
            sortOrder: routineTemplateItems.sortOrder,
          })
          .from(routineTemplateItems)
          .innerJoin(exercises, eq(exercises.id, routineTemplateItems.exerciseId))
          .where(eq(routineTemplateItems.routineTemplateId, session.routineTemplateId))
          .orderBy(asc(routineTemplateItems.sortOrder), asc(routineTemplateItems.id));

  const currentSets = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      setNumber: workoutSets.setNumber,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      rir: workoutSets.rir,
    })
    .from(workoutSets)
    .where(eq(workoutSets.workoutSessionId, session.id))
    .orderBy(asc(workoutSets.exerciseId), asc(workoutSets.setNumber));

  const setsByExerciseId = new Map<string, WorkoutExerciseDetail["currentSets"]>();

  for (const set of currentSets) {
    const bucket = setsByExerciseId.get(set.exerciseId) ?? [];
    bucket.push({
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
      rir: set.rir,
    });
    setsByExerciseId.set(set.exerciseId, bucket);
  }

  const lastPerformanceEntries = await Promise.all(
    items.map(async (item) => [
      item.exerciseId,
      await getLastPerformanceSummary(userId, item.exerciseId, session.id),
    ] as const),
  );

  const lastPerformanceByExerciseId = new Map(lastPerformanceEntries);
  const completedExerciseIds = new Set(currentSets.map((set) => set.exerciseId));

  return {
    sessionId: session.id,
    routineId: session.routineTemplateId,
    routineName: session.routineName ?? "Sesion de fuerza",
    startedAt: session.startedAt,
    startedAtLabel: formatStartedAt(session.startedAt),
    finishedAtLabel: session.finishedAt ? formatStartedAt(session.finishedAt) : null,
    isFinished: Boolean(session.finishedAt),
    savedSets: currentSets.length,
    completedExercises: completedExerciseIds.size,
    totalExercises: items.length,
    exercises: items.map((item) => ({
      routineItemId: item.routineItemId,
      exerciseId: item.exerciseId,
      exerciseName: item.exerciseName,
      primaryMuscleGroup: item.primaryMuscleGroup || "General",
      equipment: item.equipment || "Mixto",
      targetSets: item.targetSets,
      targetRepsMin: item.targetRepsMin,
      targetRepsMax: item.targetRepsMax,
      targetRir: item.targetRir,
      restSeconds: item.restSeconds,
      notes: item.notes,
      currentSets: setsByExerciseId.get(item.exerciseId) ?? [],
      lastPerformanceSummary: lastPerformanceByExerciseId.get(item.exerciseId) ?? null,
    })),
  };
}

export async function saveWorkoutExerciseBlock(params: {
  userId: string;
  sessionId: string;
  exerciseId: string;
  sets: Array<{
    weightKg: number | null;
    reps: number;
    rir: number | null;
  }>;
}) {
  const db = getDb();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      routineTemplateId: workoutSessions.routineTemplateId,
      finishedAt: workoutSessions.finishedAt,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, params.sessionId),
        eq(workoutSessions.userId, params.userId),
      ),
    )
    .limit(1);

  if (!session) {
    throw new Error("No hemos encontrado esta sesion.");
  }

  if (!session.routineTemplateId) {
    throw new Error("La sesion no tiene una rutina valida asociada.");
  }

  const [routineItem] = await db
    .select({
      id: routineTemplateItems.id,
    })
    .from(routineTemplateItems)
    .where(
      and(
        eq(routineTemplateItems.routineTemplateId, session.routineTemplateId),
        eq(routineTemplateItems.exerciseId, params.exerciseId),
      ),
    )
    .limit(1);

  if (!routineItem) {
    throw new Error("Ese ejercicio no forma parte de la rutina actual.");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(workoutSets)
      .where(
        and(
          eq(workoutSets.workoutSessionId, session.id),
          eq(workoutSets.exerciseId, params.exerciseId),
        ),
      );

    await tx.insert(workoutSets).values(
      params.sets.map((set, index) => ({
        workoutSessionId: session.id,
        exerciseId: params.exerciseId,
        setNumber: index + 1,
        weightKg: set.weightKg,
        reps: set.reps,
        rir: set.rir,
      })),
    );
  });
}

export async function completeWorkoutSession(userId: string, sessionId: string) {
  const db = getDb();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      finishedAt: workoutSessions.finishedAt,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
      ),
    )
    .limit(1);

  if (!session) {
    throw new Error("No hemos encontrado esta sesion.");
  }

  if (session.finishedAt) {
    return;
  }

  const [setCountRecord] = await db
    .select({
      count: count(),
    })
    .from(workoutSets)
    .where(eq(workoutSets.workoutSessionId, session.id));

  if (Number(setCountRecord?.count ?? 0) === 0) {
    throw new Error("Guarda al menos un set antes de cerrar la sesion.");
  }

  await db
    .update(workoutSessions)
    .set({
      finishedAt: new Date(),
    })
    .where(eq(workoutSessions.id, session.id));
}
