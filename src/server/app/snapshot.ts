import { and, count, desc, eq, or } from "drizzle-orm";

import type { AuthUser } from "@/server/auth/user";
import type { UserProfile } from "@/server/profile";
import { getDb } from "@/server/db";
import {
  exerciseCategories,
  exercises,
  friendshipStatusEnum,
  friendships,
  notifications,
  runningSessions,
  routineTemplateItems,
  routineTemplates,
  weeklyPlanEntries,
  workoutSessions,
} from "@/server/db/schema";
import { compareWeekdayOrder, getWeekdayShortLabel } from "@/server/training/week";
import { getActiveWorkoutSummary, type ActiveWorkoutSummary } from "@/server/training/workouts";

export type AppSnapshot = {
  readiness: number;
  canGenerateStarterWeek: boolean;
  activeWorkoutSummary: ActiveWorkoutSummary | null;
  heroChip: string;
  heroTitle: string;
  heroMeta: string[];
  quickStats: Array<{
    key: "goal" | "routines" | "library";
    label: string;
    value: string;
  }>;
  todayItems: Array<{
    title: string;
    meta: string;
    kind: "routine" | "run" | "library";
  }>;
  recentActivity: Array<{
    id: string;
    title: string;
    meta: string;
    kind: "routine" | "run";
  }>;
  weeklyPlan: Array<{
    id: string;
    dayKey: string;
    dayLabel: string;
    title: string;
    meta: string;
    kind: "routine" | "run";
  }>;
  socialPreview: Array<{
    name: string;
    caption: string;
    value: string;
    tint: "violet" | "cyan" | "pink";
  }>;
  routines: Array<{
    id: string;
    name: string;
    itemCount: number;
  }>;
  library: Array<{
    id: string;
    name: string;
    primaryMuscleGroup: string;
    equipment: string;
  }>;
  socialCounts: {
    friends: number;
    pending: number;
    notifications: number;
  };
  profileMetrics: Array<{
    label: string;
    value: string;
  }>;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatGoal(goal: string) {
  const normalized = normalizeText(goal);

  if (!normalized) {
    return "Personal";
  }

  if (normalized.includes("musculo") || normalized.includes("muscle")) {
    return "Musculo";
  }

  if (normalized.includes("grasa") || normalized.includes("fat")) {
    return "Definicion";
  }

  if (normalized.includes("fuerte") || normalized.includes("strong")) {
    return "Fuerza";
  }

  if (normalized.includes("hibrid")) {
    return "Hibrido";
  }

  if (normalized.includes("consisten")) {
    return "Constancia";
  }

  return goal.trim();
}

function formatExperienceLevel(level: string) {
  const normalized = normalizeText(level);

  if (!normalized) {
    return "--";
  }

  if (normalized.includes("beginner") || normalized.includes("principiante")) {
    return "Principiante";
  }

  if (normalized.includes("intermediate") || normalized.includes("intermedio")) {
    return "Intermedio";
  }

  if (normalized.includes("advanced") || normalized.includes("avanzado")) {
    return "Avanzado";
  }

  return level.trim();
}

function formatActivityDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
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
    case "shoes":
      return "Zapatillas";
    default:
      return equipment || "Mixto";
  }
}

export async function getAppSnapshot(params: {
  user: AuthUser;
  profile: UserProfile;
}): Promise<AppSnapshot> {
  const db = getDb();
  const { user, profile } = params;
  const activeWorkoutSummary = await getActiveWorkoutSummary(user.id);

  const [routineCountRow] = await db
    .select({ count: count() })
    .from(routineTemplates)
    .where(eq(routineTemplates.ownerUserId, user.id));

  const [planCountRow] = await db
    .select({ count: count() })
    .from(weeklyPlanEntries)
    .where(eq(weeklyPlanEntries.userId, user.id));

  const [libraryCountRow] = await db
    .select({ count: count() })
    .from(exercises)
    .where(or(eq(exercises.isSystem, true), eq(exercises.ownerUserId, user.id)));

  const [friendCountRow] = await db
    .select({ count: count() })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, friendshipStatusEnum.enumValues[1]),
        or(
          eq(friendships.requesterUserId, user.id),
          eq(friendships.addresseeUserId, user.id),
        ),
      ),
    );

  const [pendingCountRow] = await db
    .select({ count: count() })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, friendshipStatusEnum.enumValues[0]),
        eq(friendships.addresseeUserId, user.id),
      ),
    );

  const [notificationCountRow] = await db
    .select({ count: count() })
    .from(notifications)
    .where(eq(notifications.userId, user.id));

  const routines = await db
    .select({
      id: routineTemplates.id,
      name: routineTemplates.name,
      itemCount: count(routineTemplateItems.id),
    })
    .from(routineTemplates)
    .leftJoin(
      routineTemplateItems,
      eq(routineTemplateItems.routineTemplateId, routineTemplates.id),
    )
    .where(eq(routineTemplates.ownerUserId, user.id))
    .groupBy(routineTemplates.id)
    .orderBy(desc(routineTemplates.createdAt))
    .limit(4);

  const weeklyPlan = await db
    .select({
      id: weeklyPlanEntries.id,
      weekdayKey: weeklyPlanEntries.weekdayKey,
      runningTargetKm: weeklyPlanEntries.runningTargetKm,
      routineId: routineTemplates.id,
      routineName: routineTemplates.name,
      routineItemCount: count(routineTemplateItems.id),
    })
    .from(weeklyPlanEntries)
    .leftJoin(routineTemplates, eq(routineTemplates.id, weeklyPlanEntries.routineTemplateId))
    .leftJoin(
      routineTemplateItems,
      eq(routineTemplateItems.routineTemplateId, routineTemplates.id),
    )
    .where(eq(weeklyPlanEntries.userId, user.id))
    .groupBy(weeklyPlanEntries.id, routineTemplates.id)
    .limit(7);

  const recentWorkouts = await db
    .select({
      id: workoutSessions.id,
      date: workoutSessions.finishedAt,
      fallbackDate: workoutSessions.startedAt,
      routineName: routineTemplates.name,
    })
    .from(workoutSessions)
    .leftJoin(routineTemplates, eq(routineTemplates.id, workoutSessions.routineTemplateId))
    .where(eq(workoutSessions.userId, user.id))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(4);

  const recentRuns = await db
    .select({
      id: runningSessions.id,
      date: runningSessions.date,
      distanceKm: runningSessions.distanceKm,
      kind: runningSessions.kind,
    })
    .from(runningSessions)
    .where(eq(runningSessions.userId, user.id))
    .orderBy(desc(runningSessions.date))
    .limit(4);

  const library = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      equipment: exercises.equipment,
      categoryName: exerciseCategories.name,
    })
    .from(exercises)
    .leftJoin(exerciseCategories, eq(exerciseCategories.id, exercises.categoryId))
    .where(or(eq(exercises.isSystem, true), eq(exercises.ownerUserId, user.id)))
    .limit(6);

  const routineCount = Number(routineCountRow?.count ?? 0);
  const planCount = Number(planCountRow?.count ?? 0);
  const libraryCount = Number(libraryCountRow?.count ?? 0);
  const friendCount = Number(friendCountRow?.count ?? 0);
  const pendingCount = Number(pendingCountRow?.count ?? 0);
  const notificationCount = Number(notificationCountRow?.count ?? 0);
  const orderedWeeklyPlan = weeklyPlan
    .map((entry) => ({
      id: entry.id,
      dayKey: entry.weekdayKey,
      dayLabel: getWeekdayShortLabel(entry.weekdayKey),
      title: entry.routineName ?? "Objetivo run",
      meta:
        entry.routineName && entry.routineId
          ? `${Number(entry.routineItemCount)} ejercicios`
          : `${entry.runningTargetKm ?? 0} km objetivo`,
      kind: entry.routineId ? ("routine" as const) : ("run" as const),
    }))
    .sort((left, right) => compareWeekdayOrder(left.dayKey, right.dayKey));

  const readiness = Math.min(
    100,
    40 +
      (profile.goal ? 14 : 0) +
      (profile.experienceLevel ? 10 : 0) +
      ((profile.preferredWeeklySessions ?? 0) > 0 ? 16 : 0) +
      (routineCount > 0 ? 12 : 0) +
      (planCount > 0 ? 8 : 0),
  );

  const firstRoutine = routines[0];
  const heroChip = profile.goal ? formatGoal(profile.goal) : "Base";
  const heroTitle =
    orderedWeeklyPlan.length > 0
      ? `${orderedWeeklyPlan[0]?.dayLabel}: ${orderedWeeklyPlan[0]?.title}`
      : firstRoutine
        ? `${firstRoutine.name} esta lista.`
        : "Crea tu primera semana.";
  const heroMeta = [
    `${profile.preferredWeeklySessions ?? 0}x semana`,
    `${planCount} bloques`,
    `${libraryCount} ejercicios`,
  ];

  const todayItems =
    orderedWeeklyPlan.length > 0
      ? orderedWeeklyPlan.slice(0, 3).map((entry) => ({
          title: entry.dayLabel,
          meta: `${entry.title} · ${entry.meta}`,
          kind: entry.kind,
        }))
      : [
          {
            title: "Explora la biblioteca",
            meta: `${libraryCount} ejercicios disponibles`,
            kind: "library" as const,
          },
          {
            title: "Ajusta tu objetivo",
            meta: `${profile.preferredWeeklySessions ?? 0} sesiones por semana`,
            kind: "run" as const,
          },
        ];

  const recentActivity = [
    ...recentWorkouts.map((session) => {
      const sessionDate = session.date ?? session.fallbackDate;

      return {
        id: session.id,
        sortAt: sessionDate,
        title: session.routineName ?? "Sesion libre",
        meta: `Fuerza · ${formatActivityDate(sessionDate)}`,
        kind: "routine" as const,
      };
    }),
    ...recentRuns.map((session) => ({
      id: session.id,
      sortAt: session.date,
      title: `${session.distanceKm.toFixed(1)} km`,
      meta: `${formatRunningKind(session.kind)} · ${formatActivityDate(session.date)}`,
      kind: "run" as const,
    })),
  ]
    .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
    .slice(0, 4)
    .map((entry) => {
      const { sortAt, ...rest } = entry;
      void sortAt;

      return rest;
    });

  const socialPreview =
    friendCount > 0
      ? [
          {
            name: "Amistades",
            caption: "activas",
            value: `${friendCount}`,
            tint: "violet" as const,
          },
          {
            name: "Pendientes",
            caption: "por revisar",
            value: `${pendingCount}`,
            tint: "cyan" as const,
          },
          {
            name: "Avisos",
            caption: "notificaciones",
            value: `${notificationCount}`,
            tint: "pink" as const,
          },
        ]
      : [
          {
            name: "Circulo",
            caption: "amistades",
            value: "0",
            tint: "violet" as const,
          },
          {
            name: "Pendientes",
            caption: "solicitudes",
            value: `${pendingCount}`,
            tint: "cyan" as const,
          },
          {
            name: "Calma",
            caption: "de momento",
            value: "Invita",
            tint: "pink" as const,
          },
        ];

  return {
    readiness,
    canGenerateStarterWeek: routineCount === 0 && planCount === 0,
    activeWorkoutSummary,
    heroChip,
    heroTitle,
    heroMeta,
    quickStats: [
      {
        key: "goal",
        label: "Objetivo",
        value: formatGoal(profile.goal),
      },
      {
        key: "routines",
        label: "Rutinas",
        value: `${routineCount}`,
      },
      {
        key: "library",
        label: "Biblioteca",
        value: `${libraryCount}`,
      },
    ],
    todayItems,
    recentActivity,
    weeklyPlan: orderedWeeklyPlan,
    socialPreview,
    routines: routines.map((routine) => ({
      id: routine.id,
      name: routine.name,
      itemCount: Number(routine.itemCount),
    })),
    library: library.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      primaryMuscleGroup: formatMuscleGroup(
        exercise.primaryMuscleGroup || exercise.categoryName || "General",
      ),
      equipment: formatEquipment(exercise.equipment || "Mixed"),
    })),
    socialCounts: {
      friends: friendCount,
      pending: pendingCount,
      notifications: notificationCount,
    },
    profileMetrics: [
      {
        label: "Peso",
        value: profile.weightKg ? `${profile.weightKg}` : "--",
      },
      {
        label: "Semana",
        value: profile.preferredWeeklySessions
          ? `${profile.preferredWeeklySessions}x`
          : "--",
      },
      {
        label: "Nivel",
        value: formatExperienceLevel(profile.experienceLevel),
      },
    ],
  };
}
