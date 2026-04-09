import { and, asc, count, desc, eq } from "drizzle-orm";

import type { UserProfile } from "@/server/profile";
import type { AuthUser } from "@/server/auth/user";
import { getDb } from "@/server/db";
import { exercises, routineTemplateItems, routineTemplates } from "@/server/db/schema";
import type { TrainingFocusKey } from "@/lib/training-visuals";
import { getRoutineFocusMap } from "@/server/training/focus";
import { getScheduleOverview, type ScheduleOverview } from "@/server/training/schedule";
import { getSummaryOverview, type SummaryOverview } from "@/server/training/summary";
import { getActiveWorkoutSummary, type ActiveWorkoutSummary } from "@/server/training/workouts";

export type AppSnapshot = {
  dateLabel: string;
  firstName: string;
  levelLabel: string;
  goalLabel: string;
  activeWorkoutSummary: ActiveWorkoutSummary | null;
  defaultRoutine: {
    id: string;
    name: string;
  } | null;
  focusMetrics: Array<{
    key: "gym" | "running" | "routines";
    label: string;
    value: string;
    tone: "pink" | "lime" | "cyan";
  }>;
  schedule: ScheduleOverview;
  routines: Array<{
    id: string;
    name: string;
    itemCount: number;
    focusKey: TrainingFocusKey;
    focusLabel: string;
    focusOverride: TrainingFocusKey | null;
  }>;
  librarySummary: {
    systemCount: number;
    customCount: number;
  };
  summary: SummaryOverview;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatLevel(level: string) {
  const normalized = normalizeText(level);

  if (normalized.includes("principiante") || normalized.includes("beginner")) {
    return "Principiante";
  }

  if (normalized.includes("intermedio") || normalized.includes("intermediate")) {
    return "Intermedio";
  }

  if (normalized.includes("avanzado") || normalized.includes("advanced")) {
    return "Avanzado";
  }

  return level || "Base";
}

function formatGoal(goal: string) {
  const normalized = normalizeText(goal);

  if (normalized.includes("musculo") || normalized.includes("muscle")) {
    return "Ganar musculo";
  }

  if (normalized.includes("grasa") || normalized.includes("fat")) {
    return "Perder grasa";
  }

  if (normalized.includes("fuerte") || normalized.includes("strong")) {
    return "Mejorar fuerza";
  }

  if (normalized.includes("hibrid")) {
    return "Hibrido";
  }

  return goal || "Modo personal";
}

function extractFirstName(value: string) {
  return value.trim().split(/\s+/)[0] ?? value;
}

function formatDateLabel() {
  const value = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function getAppSnapshot(params: {
  user: AuthUser;
  profile: UserProfile;
}): Promise<AppSnapshot> {
  const db = getDb();
  const { user, profile } = params;

  const [
    activeWorkoutSummary,
    schedule,
    summary,
    routines,
    systemExerciseCountRow,
    customExerciseCountRow,
  ] = await Promise.all([
    getActiveWorkoutSummary(user.id),
    getScheduleOverview(user.id),
    getSummaryOverview(user.id),
    db
      .select({
        id: routineTemplates.id,
        name: routineTemplates.name,
        focusOverride: routineTemplates.focusOverride,
        itemCount: count(routineTemplateItems.id),
      })
      .from(routineTemplates)
      .leftJoin(
        routineTemplateItems,
        eq(routineTemplateItems.routineTemplateId, routineTemplates.id),
      )
      .where(eq(routineTemplates.ownerUserId, user.id))
      .groupBy(routineTemplates.id, routineTemplates.name)
      .orderBy(desc(routineTemplates.updatedAt), asc(routineTemplates.name))
      .limit(8),
    db
      .select({ count: count() })
      .from(exercises)
      .where(eq(exercises.isSystem, true))
      .then((rows) => rows[0]),
    db
      .select({ count: count() })
      .from(exercises)
      .where(and(eq(exercises.ownerUserId, user.id), eq(exercises.isSystem, false)))
      .then((rows) => rows[0]),
  ]);
  const routineFocusMap = await getRoutineFocusMap(db, routines);

  const todayScheduledGym =
    schedule.todayEntries.find((entry) => entry.entryType === "gym" && entry.routineTemplateId) ??
    null;

  const fallbackRoutine = routines[0] ?? null;

  const defaultRoutine =
    todayScheduledGym && todayScheduledGym.routineTemplateId
      ? {
          id: todayScheduledGym.routineTemplateId,
          name: todayScheduledGym.title,
        }
      : fallbackRoutine
        ? {
            id: fallbackRoutine.id,
            name: fallbackRoutine.name,
          }
        : null;

  return {
    dateLabel: formatDateLabel(),
    firstName: extractFirstName(profile.displayName),
    levelLabel: formatLevel(profile.experienceLevel),
    goalLabel: formatGoal(profile.goal),
    activeWorkoutSummary,
    defaultRoutine,
    focusMetrics: [
      {
        key: "gym",
        label: "Gym semana",
        value: summary.gym.week.sessions.replace(" sesiones", ""),
        tone: "pink",
      },
      {
        key: "running",
        label: "Running mes",
        value: summary.running.month.support,
        tone: "lime",
      },
      {
        key: "routines",
        label: "Rutinas",
        value: `${routines.length}`,
        tone: "cyan",
      },
    ],
    schedule,
    routines: routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      itemCount: Number(routine.itemCount ?? 0),
      focusKey: routineFocusMap.get(routine.id)?.key ?? "general",
      focusLabel: routineFocusMap.get(routine.id)?.label ?? "General",
      focusOverride: routine.focusOverride ?? null,
    })),
    librarySummary: {
      systemCount: Number(systemExerciseCountRow?.count ?? 0),
      customCount: Number(customExerciseCountRow?.count ?? 0),
    },
    summary,
  };
}
