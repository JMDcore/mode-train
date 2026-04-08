import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  exercises,
  routineTemplates,
  runningSessions,
  workoutSessions,
  workoutSets,
} from "@/server/db/schema";

export type ExerciseProgressCard = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  sessionCount: number;
  totalSets: number;
  lastLoggedAtLabel: string;
  latestPerformanceLabel: string;
  bestPerformanceLabel: string;
  trendLabel: string | null;
};

export type ProgressOverview = {
  summaryMetrics: Array<{
    label: string;
    value: string;
    caption: string;
  }>;
  cards: ExerciseProgressCard[];
  milestones: Array<{
    id: string;
    title: string;
    meta: string;
  }>;
};

type ExerciseRecord = {
  sessionId: string;
  finishedAt: Date;
  routineName: string | null;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isExerciseRecord(
  value: {
    sessionId: string;
    finishedAt: Date | null;
    routineName: string | null;
    weightKg: number | null;
    reps: number | null;
    rir: number | null;
  },
): value is ExerciseRecord {
  return value.finishedAt instanceof Date;
}

function coerceDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function formatDate(date: Date | string) {
  const normalizedDate = coerceDate(date);

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(normalizedDate);
}

function formatVolume(volumeKg: number) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: volumeKg % 1 === 0 ? 0 : 1,
  }).format(volumeKg);
}

function formatPerformanceLabel(record: Pick<ExerciseRecord, "weightKg" | "reps" | "rir" | "routineName">) {
  const parts: string[] = [];

  if (record.weightKg !== null) {
    parts.push(`${record.weightKg} kg`);
  }

  if (record.reps !== null) {
    parts.push(`${record.reps} reps`);
  }

  if (record.rir !== null) {
    parts.push(`RIR ${record.rir}`);
  }

  if (parts.length === 0) {
    return record.routineName ? `Ultimo registro en ${record.routineName}` : "Ultimo registro";
  }

  return `${parts.join(" · ")}${record.routineName ? ` · ${record.routineName}` : ""}`;
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

function formatTrendLabel(latest: ExerciseRecord, previous: ExerciseRecord | null) {
  if (!previous) {
    return "Primer bloque comparado";
  }

  if (latest.weightKg !== null && previous.weightKg !== null && latest.weightKg !== previous.weightKg) {
    const diff = latest.weightKg - previous.weightKg;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff} kg vs anterior`;
  }

  if (latest.reps !== null && previous.reps !== null && latest.reps !== previous.reps) {
    const diff = latest.reps - previous.reps;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff} reps vs anterior`;
  }

  return null;
}

export async function getProgressOverview(userId: string): Promise<ProgressOverview> {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [completedWorkoutsRow] = await db
    .select({ count: count() })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
      ),
    );

  const [completedRunsRow] = await db
    .select({ count: count() })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId));

  const [setCountLast30Row] = await db
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

  const [volumeLast30Row] = await db
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

  const exerciseRows = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      totalSets: count(workoutSets.id),
      sessionCount: sql<number>`count(distinct ${workoutSessions.id})`,
      lastLoggedAt: sql<string>`max(${workoutSessions.finishedAt})`,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .groupBy(workoutSets.exerciseId, exercises.name, exercises.primaryMuscleGroup)
    .orderBy(desc(sql`max(${workoutSessions.finishedAt})`))
    .limit(6);

  const cards = await Promise.all(
    exerciseRows.map(async (exercise) => {
      const records = (
        await db
        .select({
          sessionId: workoutSessions.id,
          finishedAt: workoutSessions.finishedAt,
          routineName: routineTemplates.name,
          weightKg: workoutSets.weightKg,
          reps: workoutSets.reps,
          rir: workoutSets.rir,
        })
        .from(workoutSets)
        .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
        .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            eq(workoutSets.exerciseId, exercise.exerciseId),
            isNotNull(workoutSessions.finishedAt),
          ),
        )
        .orderBy(desc(workoutSessions.finishedAt), desc(workoutSets.weightKg), desc(workoutSets.reps), desc(workoutSets.setNumber))
        .limit(12)
      ).filter(isExerciseRecord);

      const latest = records[0];

      if (!latest) {
        return null;
      }

      const previous = records.find((record) => record.sessionId !== latest.sessionId) ?? null;
      const best = [...records].sort((left, right) => {
        const leftWeight = left.weightKg ?? -1;
        const rightWeight = right.weightKg ?? -1;

        if (leftWeight !== rightWeight) {
          return rightWeight - leftWeight;
        }

        const leftReps = left.reps ?? -1;
        const rightReps = right.reps ?? -1;

        return rightReps - leftReps;
      })[0];

      return {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        primaryMuscleGroup: formatMuscleGroup(exercise.primaryMuscleGroup || "General"),
        sessionCount: Number(exercise.sessionCount ?? 0),
        totalSets: Number(exercise.totalSets ?? 0),
        lastLoggedAtLabel: formatDate(exercise.lastLoggedAt),
        latestPerformanceLabel: formatPerformanceLabel(latest),
        bestPerformanceLabel: formatPerformanceLabel(best),
        trendLabel: formatTrendLabel(latest, previous),
      } satisfies ExerciseProgressCard;
    }),
  );

  const filteredCards = cards.filter((card): card is ExerciseProgressCard => card !== null);

  return {
    summaryMetrics: [
      {
        label: "Sesiones",
        value: `${Number(completedWorkoutsRow?.count ?? 0)}`,
        caption: "de fuerza cerradas",
      },
      {
        label: "Sets 30d",
        value: `${Number(setCountLast30Row?.count ?? 0)}`,
        caption: "bloques guardados",
      },
      {
        label: "Volumen 30d",
        value: `${formatVolume(Number(volumeLast30Row?.total ?? 0))} kg`,
        caption: "carga movida",
      },
      {
        label: "Runs",
        value: `${Number(completedRunsRow?.count ?? 0)}`,
        caption: "para contexto",
      },
    ],
    cards: filteredCards,
    milestones: filteredCards.slice(0, 3).map((card) => ({
      id: card.exerciseId,
      title: card.exerciseName,
      meta: card.trendLabel ?? `Ultimo bloque: ${card.latestPerformanceLabel}`,
    })),
  };
}
