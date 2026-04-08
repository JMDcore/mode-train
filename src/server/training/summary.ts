import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  exercises,
  runningSessions,
  routineTemplates,
  workoutSessions,
  workoutSets,
} from "@/server/db/schema";

export type SummaryScopeKey = "week" | "month" | "total";

export type ScopeSummaryMetric = {
  sessions: string;
  support: string;
  highlight: string;
};

export type SummaryOverview = {
  gym: Record<SummaryScopeKey, ScopeSummaryMetric>;
  running: Record<SummaryScopeKey, ScopeSummaryMetric>;
  gymRecords: Array<{
    exerciseId: string;
    exerciseName: string;
    weightLabel: string;
    dateLabel: string;
  }>;
  runningRecords: {
    longestDistance: string;
    bestPace1k: string;
    bestPace5k: string;
    bestPace10k: string;
  };
  recentActivity: Array<{
    id: string;
    kind: "workout" | "run";
    title: string;
    meta: string;
    dateLabel: string;
    href: string | null;
  }>;
};

type TimeFilterKey = Exclude<SummaryScopeKey, "total">;

const workoutEffectiveDateSql = sql`coalesce(${workoutSessions.performedOn}::timestamp, ${workoutSessions.finishedAt})`;

function formatWeight(value: number | null) {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} kg`;
}

function formatDistance(value: number | null) {
  if (value === null || value === undefined || value <= 0) {
    return "--";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} km`;
}

function formatVolume(value: number | null) {
  if (value === null || value === undefined || value <= 0) {
    return "0 kg";
  }

  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)} kg`;
}

function formatPace(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return "--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}/km`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatIsoDate(isoDate: string) {
  return formatDate(new Date(`${isoDate}T12:00:00`));
}

function getTimeFilters() {
  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + diff);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  return {
    week: weekStart,
    month: monthStart,
  } satisfies Record<TimeFilterKey, Date>;
}

async function getGymScopeSummary(userId: string, since: Date | null): Promise<ScopeSummaryMetric> {
  const db = getDb();

  const workoutWhere = since
    ? and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        sql`${workoutEffectiveDateSql} >= ${since}`,
      )
    : and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt));

  const [sessionRow] = await db
    .select({ count: count() })
    .from(workoutSessions)
    .where(workoutWhere);

  const [setRow] = await db
    .select({ count: count() })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .where(workoutWhere);

  const [volumeRow] = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${workoutSets.weightKg}, 0) * coalesce(${workoutSets.reps}, 0)), 0)`,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .where(workoutWhere);

  return {
    sessions: `${Number(sessionRow?.count ?? 0)} sesiones`,
    support: `${Number(setRow?.count ?? 0)} sets`,
    highlight: formatVolume(volumeRow?.total ?? 0),
  };
}

async function getRunningScopeSummary(userId: string, since: Date | null): Promise<ScopeSummaryMetric> {
  const db = getDb();

  const runWhere = since
    ? and(eq(runningSessions.userId, userId), sql`${runningSessions.date} >= ${since}`)
    : eq(runningSessions.userId, userId);

  const [countRow] = await db
    .select({ count: count() })
    .from(runningSessions)
    .where(runWhere);

  const [distanceRow] = await db
    .select({
      total: sql<number>`coalesce(sum(coalesce(${runningSessions.distanceKm}, 0)), 0)`,
    })
    .from(runningSessions)
    .where(runWhere);

  const [paceRow] = await db
    .select({
      duration: sql<number>`coalesce(sum(coalesce(${runningSessions.durationSeconds}, 0)), 0)`,
      distance: sql<number>`coalesce(sum(coalesce(${runningSessions.distanceKm}, 0)), 0)`,
    })
    .from(runningSessions)
    .where(runWhere);

  const averagePace =
    paceRow && paceRow.distance > 0 ? Math.round(paceRow.duration / paceRow.distance) : null;

  return {
    sessions: `${Number(countRow?.count ?? 0)} carreras`,
    support: formatDistance(distanceRow?.total ?? 0),
    highlight: formatPace(averagePace),
  };
}

async function getGymRecords(userId: string) {
  const db = getDb();

  const rows = await db
    .select({
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      weightKg: workoutSets.weightKg,
      performedOn: workoutSessions.performedOn,
      finishedAt: workoutSessions.finishedAt,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.workoutSessionId))
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        isNotNull(workoutSets.weightKg),
      ),
    )
    .orderBy(desc(workoutSets.weightKg), desc(workoutEffectiveDateSql))
    .limit(120);

  const records = new Map<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      weightKg: number | null;
      performedOn: string;
      finishedAt: Date | null;
    }
  >();

  for (const row of rows) {
    if (records.has(row.exerciseId)) {
      continue;
    }

    records.set(row.exerciseId, row);
  }

  return Array.from(records.values())
    .slice(0, 8)
    .map((record) => ({
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      weightLabel: formatWeight(record.weightKg),
      dateLabel: record.performedOn
        ? formatIsoDate(record.performedOn)
        : record.finishedAt
          ? formatDate(record.finishedAt)
          : "--",
    }));
}

async function getRunningRecords(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      distanceKm: runningSessions.distanceKm,
      averagePaceSeconds: runningSessions.averagePaceSeconds,
    })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId))
    .orderBy(desc(runningSessions.date))
    .limit(200);

  const longestDistance = rows.reduce<number | null>((best, row) => {
    if (row.distanceKm === null) {
      return best;
    }

    if (best === null || row.distanceKm > best) {
      return row.distanceKm;
    }

    return best;
  }, null);

  const bestPaceForDistance = (minimumDistance: number) =>
    rows.reduce<number | null>((best, row) => {
      if (
        row.distanceKm === null ||
        row.averagePaceSeconds === null ||
        row.distanceKm < minimumDistance
      ) {
        return best;
      }

      if (best === null || row.averagePaceSeconds < best) {
        return row.averagePaceSeconds;
      }

      return best;
    }, null);

  return {
    longestDistance: formatDistance(longestDistance),
    bestPace1k: formatPace(bestPaceForDistance(1)),
    bestPace5k: formatPace(bestPaceForDistance(5)),
    bestPace10k: formatPace(bestPaceForDistance(10)),
  };
}

async function getRecentActivity(userId: string) {
  const db = getDb();

  const workouts = await db
    .select({
      id: workoutSessions.id,
      performedOn: workoutSessions.performedOn,
      finishedAt: workoutSessions.finishedAt,
      title: routineTemplates.name,
    })
    .from(workoutSessions)
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutEffectiveDateSql))
    .limit(8);

  const runs = await db
    .select({
      id: runningSessions.id,
      date: runningSessions.date,
      distanceKm: runningSessions.distanceKm,
      averagePaceSeconds: runningSessions.averagePaceSeconds,
    })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId))
    .orderBy(desc(runningSessions.date))
    .limit(8);

  const activity = [
    ...workouts
      .map((row) => ({
        id: row.id,
        kind: "workout" as const,
        title: row.title ? `Fuerza · ${row.title}` : "Sesion de fuerza",
        meta: "Entreno guardado",
        dateLabel: formatIsoDate(row.performedOn),
        href: "/app/history",
        sortAt: new Date(`${row.performedOn}T12:00:00`),
      })),
    ...runs.map((row) => ({
      id: row.id,
      kind: "run" as const,
      title: row.distanceKm ? `Running · ${formatDistance(row.distanceKm)}` : "Running libre",
      meta: row.averagePaceSeconds ? formatPace(row.averagePaceSeconds) : "Sin ritmo registrado",
      dateLabel: formatDate(row.date),
      href: "/app/history",
      sortAt: row.date,
    })),
  ]
    .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      meta: item.meta,
      dateLabel: item.dateLabel,
      href: item.href,
    }));

  return activity;
}

export async function getSummaryOverview(userId: string): Promise<SummaryOverview> {
  const filters = getTimeFilters();
  const [gymWeek, gymMonth, gymTotal, runWeek, runMonth, runTotal, gymRecords, runningRecords, recentActivity] =
    await Promise.all([
      getGymScopeSummary(userId, filters.week),
      getGymScopeSummary(userId, filters.month),
      getGymScopeSummary(userId, null),
      getRunningScopeSummary(userId, filters.week),
      getRunningScopeSummary(userId, filters.month),
      getRunningScopeSummary(userId, null),
      getGymRecords(userId),
      getRunningRecords(userId),
      getRecentActivity(userId),
    ]);

  return {
    gym: {
      week: gymWeek,
      month: gymMonth,
      total: gymTotal,
    },
    running: {
      week: runWeek,
      month: runMonth,
      total: runTotal,
    },
    gymRecords,
    runningRecords,
    recentActivity,
  };
}
