import { and, asc, desc, eq, gte, isNotNull, lte } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  routineTemplates,
  runningSessions,
  trainingScheduleEntries,
  workoutSessions,
} from "@/server/db/schema";

export type ScheduleEntryItem = {
  id: string;
  entryType: "gym" | "running";
  scheduledDate: string;
  title: string;
  meta: string;
  routineTemplateId: string | null;
};

export type ScheduleDay = {
  isoDate: string;
  dayShort: string;
  dayLabel: string;
  dayNumber: string;
  monthShort: string;
  isToday: boolean;
  plannedCount: number;
  completedCount: number;
  entries: ScheduleEntryItem[];
};

export type ScheduleOverview = {
  weekRangeLabel: string;
  todayEntries: ScheduleEntryItem[];
  days: ScheduleDay[];
};

function startOfWeek(input: Date) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(input: Date, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

function toIsoDate(input: Date) {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`);
}

function formatDayShort(input: Date) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short" })
    .format(input)
    .replace(".", "")
    .slice(0, 3)
    .toUpperCase();
}

function formatRunningKind(kind: string | null) {
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
      return "Running libre";
  }
}

function formatRunningTargetKm(value: number | null) {
  if (value === null || value === undefined) {
    return "Sin objetivo";
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} km objetivo`;
}

function formatWeekRangeLabel(start: Date) {
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export async function getScheduleOverview(userId: string, anchorDate = new Date()): Promise<ScheduleOverview> {
  const db = getDb();
  const weekStart = startOfWeek(anchorDate);
  const weekEnd = addDays(weekStart, 6);
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(weekEnd);
  const todayIso = toIsoDate(anchorDate);

  const plannedEntries = await db
    .select({
      id: trainingScheduleEntries.id,
      entryType: trainingScheduleEntries.entryType,
      scheduledDate: trainingScheduleEntries.scheduledDate,
      title: trainingScheduleEntries.title,
      notes: trainingScheduleEntries.notes,
      runningKind: trainingScheduleEntries.runningKind,
      runningTargetKm: trainingScheduleEntries.runningTargetKm,
      routineTemplateId: trainingScheduleEntries.routineTemplateId,
      routineName: routineTemplates.name,
      createdAt: trainingScheduleEntries.createdAt,
    })
    .from(trainingScheduleEntries)
    .leftJoin(
      routineTemplates,
      eq(routineTemplates.id, trainingScheduleEntries.routineTemplateId),
    )
    .where(
      and(
        eq(trainingScheduleEntries.userId, userId),
        gte(trainingScheduleEntries.scheduledDate, startIso),
        lte(trainingScheduleEntries.scheduledDate, endIso),
      ),
    )
    .orderBy(asc(trainingScheduleEntries.scheduledDate), asc(trainingScheduleEntries.createdAt));

  const completedWorkouts = await db
    .select({
      performedOn: workoutSessions.performedOn,
      finishedAt: workoutSessions.finishedAt,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .orderBy(desc(workoutSessions.finishedAt))
    .limit(64);

  const completedRuns = await db
    .select({
      date: runningSessions.date,
    })
    .from(runningSessions)
    .where(eq(runningSessions.userId, userId))
    .orderBy(desc(runningSessions.date))
    .limit(64);

  const completedCountByDay = new Map<string, number>();

  for (const workout of completedWorkouts) {
    const iso = workout.performedOn ?? (workout.finishedAt ? toIsoDate(workout.finishedAt) : null);

    if (!iso) {
      continue;
    }
    if (iso < startIso || iso > endIso) {
      continue;
    }

    completedCountByDay.set(iso, (completedCountByDay.get(iso) ?? 0) + 1);
  }

  for (const run of completedRuns) {
    const iso = toIsoDate(run.date);
    if (iso < startIso || iso > endIso) {
      continue;
    }

    completedCountByDay.set(iso, (completedCountByDay.get(iso) ?? 0) + 1);
  }

  const entryMap = new Map<string, ScheduleEntryItem[]>();

  for (const entry of plannedEntries) {
    const item: ScheduleEntryItem = {
      id: entry.id,
      entryType: entry.entryType,
      scheduledDate: entry.scheduledDate,
      title:
        entry.entryType === "gym"
          ? entry.routineName ?? entry.title ?? "Rutina"
          : entry.title || formatRunningKind(entry.runningKind),
      meta:
        entry.entryType === "gym"
          ? entry.notes || "Sesion de fuerza"
          : `${formatRunningKind(entry.runningKind)} · ${formatRunningTargetKm(entry.runningTargetKm)}`,
      routineTemplateId: entry.routineTemplateId,
    };

    const bucket = entryMap.get(entry.scheduledDate) ?? [];
    bucket.push(item);
    entryMap.set(entry.scheduledDate, bucket);
  }

  const days: ScheduleDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const isoDate = toIsoDate(date);
    const entries = entryMap.get(isoDate) ?? [];

    return {
      isoDate,
      dayShort: formatDayShort(date),
      dayLabel: new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date),
      dayNumber: String(date.getDate()).padStart(2, "0"),
      monthShort: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(date),
      isToday: isoDate === todayIso,
      plannedCount: entries.length,
      completedCount: completedCountByDay.get(isoDate) ?? 0,
      entries,
    };
  });

  return {
    weekRangeLabel: formatWeekRangeLabel(weekStart),
    todayEntries: entryMap.get(todayIso) ?? [],
    days,
  };
}

export function formatDateForInput(input: Date) {
  return toIsoDate(input);
}

export function formatCalendarBadgeDate(isoDate: string) {
  const date = fromIsoDate(isoDate);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}
