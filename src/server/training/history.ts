import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  exercises,
  routineTemplateItems,
  routineTemplates,
  runningSessions,
  workoutSessions,
  workoutSets,
} from "@/server/db/schema";

export type TrainingHistoryEntry = {
  id: string;
  kind: "workout" | "run";
  title: string;
  meta: string;
  dateLabel: string;
  href: string | null;
  sortAt: Date;
};

export type HistoryOverview = {
  summaryMetrics: Array<{
    label: string;
    value: string;
    caption: string;
  }>;
  entries: TrainingHistoryEntry[];
};

export type WorkoutHistoryExercise = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  equipment: string;
  targetRangeLabel: string | null;
  sets: Array<{
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
  }>;
};

export type WorkoutHistoryDetail = {
  sessionId: string;
  routineId: string | null;
  routineName: string;
  startedAt: Date;
  finishedAt: Date;
  dateLabel: string;
  durationLabel: string;
  savedSets: number;
  exerciseCount: number;
  totalVolumeKg: number;
  exercises: WorkoutHistoryExercise[];
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(startedAt: Date, finishedAt: Date) {
  const diffMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
  const totalMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatVolume(volumeKg: number) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: volumeKg % 1 === 0 ? 0 : 1,
  }).format(volumeKg);
}

function formatPace(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}/km`;
}

function formatRunningKind(kind: string) {
  switch (kind) {
    case "easy":
      return "Rodaje suave";
    case "tempo":
      return "Tempo";
    case "intervals":
      return "Series";
    case "long_run":
      return "Tirada larga";
    case "recovery":
      return "Recuperacion";
    default:
      return "Libre";
  }
}

function formatMuscleGroup(group: string) {
  switch (normalizeText(group)) {
    case "chest":
      return "Pecho";
    case "back":
      return "Espalda";
    case "shoulders":
      return "Hombros";
    case "legs":
      return "Pierna";
    case "hamstrings":
      return "Isquios";
    case "glutes":
      return "Gluteo";
    case "cardio":
      return "Cardio";
    case "core":
      return "Core";
    default:
      return group || "General";
  }
}

function formatEquipment(equipment: string) {
  switch (normalizeText(equipment)) {
    case "barbell":
      return "Barra";
    case "dumbbells":
      return "Mancuernas";
    case "machine":
      return "Maquina";
    case "bodyweight":
      return "Peso corporal";
    case "cable":
      return "Cable";
    default:
      return equipment || "Mixto";
  }
}

function formatRangeLabel(min: number | null, max: number | null) {
  if (!min || !max) {
    return null;
  }

  if (min === max) {
    return `${min} reps objetivo`;
  }

  return `${min}-${max} reps objetivo`;
}

export async function getHistoryOverview(userId: string): Promise<HistoryOverview> {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [workoutCountRow] = await db
    .select({ count: count() })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
      ),
    );

  const [runCountRow] = await db
    .select({ count: count() })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId));

  const [setCountRow] = await db
    .select({ count: count() })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        sql`${workoutSessions.finishedAt} >= ${thirtyDaysAgo}`,
      ),
    );

  const [volumeRow] = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${workoutSets.weightKg}, 0) * coalesce(${workoutSets.reps}, 0)), 0)`,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        sql`${workoutSessions.finishedAt} >= ${thirtyDaysAgo}`,
      ),
    );

  const workouts = await db
    .select({
      id: workoutSessions.id,
      finishedAt: workoutSessions.finishedAt,
      routineName: routineTemplates.name,
      setCount: count(workoutSets.id),
      exerciseCount: sql<number>`count(distinct ${workoutSets.exerciseId})`,
      volumeKg: sql<number>`coalesce(sum(coalesce(${workoutSets.weightKg}, 0) * coalesce(${workoutSets.reps}, 0)), 0)`,
    })
    .from(workoutSessions)
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .leftJoin(workoutSets, eq(workoutSets.workoutSessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .groupBy(workoutSessions.id, routineTemplates.name)
    .orderBy(desc(workoutSessions.finishedAt))
    .limit(18);

  const runs = await db
    .select({
      id: runningSessions.id,
      date: runningSessions.date,
      distanceKm: runningSessions.distanceKm,
      averagePaceSeconds: runningSessions.averagePaceSeconds,
      kind: runningSessions.kind,
    })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId))
    .orderBy(desc(runningSessions.date))
    .limit(12);

  const entries = [
    ...workouts.map((workout) => ({
      id: workout.id,
      kind: "workout" as const,
      title: workout.routineName ?? "Sesion de fuerza",
      meta: [
        `${Number(workout.exerciseCount ?? 0)} ejercicios`,
        `${Number(workout.setCount ?? 0)} sets`,
        Number(workout.volumeKg ?? 0) > 0 ? `${formatVolume(Number(workout.volumeKg ?? 0))} kg` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      dateLabel: formatDate(workout.finishedAt ?? new Date()),
      href: `/app/history/workouts/${workout.id}`,
      sortAt: workout.finishedAt ?? new Date(),
    })),
    ...runs.map((run) => ({
      id: run.id,
      kind: "run" as const,
      title: run.distanceKm !== null ? `${run.distanceKm.toFixed(1)} km` : "Running libre",
      meta: [formatRunningKind(run.kind), formatPace(run.averagePaceSeconds)]
        .filter(Boolean)
        .join(" · "),
      dateLabel: formatDate(run.date),
      href: null,
      sortAt: run.date,
    })),
  ]
    .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
    .slice(0, 20);

  return {
    summaryMetrics: [
      {
        label: "Fuerza",
        value: `${Number(workoutCountRow?.count ?? 0)}`,
        caption: "sesiones cerradas",
      },
      {
        label: "Carrera",
        value: `${Number(runCountRow?.count ?? 0)}`,
        caption: "salidas registradas",
      },
      {
        label: "Ultimos 30d",
        value: `${Number(setCountRow?.count ?? 0)}`,
        caption: "sets guardados",
      },
      {
        label: "Volumen",
        value: `${formatVolume(Number(volumeRow?.total ?? 0))} kg`,
        caption: "ultimos 30 dias",
      },
    ],
    entries,
  };
}

export async function getWorkoutHistoryDetail(
  userId: string,
  sessionId: string,
): Promise<WorkoutHistoryDetail | null> {
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
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .limit(1);

  if (!session || !session.finishedAt) {
    return null;
  }

  const routineOrderMap =
    session.routineTemplateId === null
      ? new Map<string, { sortOrder: number; targetRangeLabel: string | null }>()
      : new Map(
          (
            await db
              .select({
                exerciseId: routineTemplateItems.exerciseId,
                sortOrder: routineTemplateItems.sortOrder,
                targetRepsMin: routineTemplateItems.targetRepsMin,
                targetRepsMax: routineTemplateItems.targetRepsMax,
              })
              .from(routineTemplateItems)
              .where(eq(routineTemplateItems.routineTemplateId, session.routineTemplateId))
              .orderBy(asc(routineTemplateItems.sortOrder))
          ).map((item) => [
            item.exerciseId,
            {
              sortOrder: item.sortOrder,
              targetRangeLabel: formatRangeLabel(item.targetRepsMin, item.targetRepsMax),
            },
          ]),
        );

  const setRows = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      equipment: exercises.equipment,
      setNumber: workoutSets.setNumber,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      rir: workoutSets.rir,
    })
    .from(workoutSets)
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(eq(workoutSets.workoutSessionId, session.id))
    .orderBy(asc(workoutSets.exerciseId), asc(workoutSets.setNumber));

  const grouped = new Map<string, WorkoutHistoryExercise>();

  for (const row of setRows) {
    const existing = grouped.get(row.exerciseId);

    if (!existing) {
      grouped.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        primaryMuscleGroup: formatMuscleGroup(row.primaryMuscleGroup || "General"),
        equipment: formatEquipment(row.equipment || "Mixto"),
        targetRangeLabel: routineOrderMap.get(row.exerciseId)?.targetRangeLabel ?? null,
        sets: [
          {
            setNumber: row.setNumber,
            weightKg: row.weightKg,
            reps: row.reps,
            rir: row.rir,
          },
        ],
      });
      continue;
    }

    existing.sets.push({
      setNumber: row.setNumber,
      weightKg: row.weightKg,
      reps: row.reps,
      rir: row.rir,
    });
  }

  const exercisesByOrder = Array.from(grouped.values()).sort((left, right) => {
    const leftOrder = routineOrderMap.get(left.exerciseId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = routineOrderMap.get(right.exerciseId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.exerciseName.localeCompare(right.exerciseName, "es-ES");
  });

  const totalVolumeKg = setRows.reduce((total, row) => {
    if (row.weightKg === null || row.reps === null) {
      return total;
    }

    return total + row.weightKg * row.reps;
  }, 0);

  return {
    sessionId: session.id,
    routineId: session.routineTemplateId,
    routineName: session.routineName ?? "Sesion de fuerza",
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    dateLabel: formatDateTime(session.finishedAt),
    durationLabel: formatDuration(session.startedAt, session.finishedAt),
    savedSets: setRows.length,
    exerciseCount: exercisesByOrder.length,
    totalVolumeKg,
    exercises: exercisesByOrder,
  };
}
