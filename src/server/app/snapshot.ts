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
  routineTemplateItems,
  routineTemplates,
  weeklyPlanEntries,
} from "@/server/db/schema";
import { compareWeekdayOrder, getWeekdayShortLabel } from "@/server/training/week";

export type AppSnapshot = {
  readiness: number;
  canGenerateStarterWeek: boolean;
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

function formatGoal(goal: string) {
  return goal.trim() || "Custom";
}

export async function getAppSnapshot(params: {
  user: AuthUser;
  profile: UserProfile;
}): Promise<AppSnapshot> {
  const db = getDb();
  const { user, profile } = params;

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
      title: entry.routineName ?? "Run target",
      meta:
        entry.routineName && entry.routineId
          ? `${Number(entry.routineItemCount)} exercises`
          : `${entry.runningTargetKm ?? 0} km target`,
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
  const heroChip = profile.goal ? formatGoal(profile.goal) : "Foundation";
  const heroTitle =
    orderedWeeklyPlan.length > 0
      ? `${orderedWeeklyPlan[0]?.dayLabel}: ${orderedWeeklyPlan[0]?.title}`
      : firstRoutine
        ? `${firstRoutine.name} is ready.`
        : "Build your first week.";
  const heroMeta = [
    `${profile.preferredWeeklySessions ?? 0}x week`,
    `${planCount} slots`,
    `${libraryCount} exercises`,
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
            title: "Explore library",
            meta: `${libraryCount} exercises ready`,
            kind: "library" as const,
          },
          {
            title: "Set weekly target",
            meta: `${profile.preferredWeeklySessions ?? 0} sessions per week`,
            kind: "run" as const,
          },
        ];

  const socialPreview =
    friendCount > 0
      ? [
          {
            name: "Friends",
            caption: "connected",
            value: `${friendCount}`,
            tint: "violet" as const,
          },
          {
            name: "Pending",
            caption: "to review",
            value: `${pendingCount}`,
            tint: "cyan" as const,
          },
          {
            name: "Alerts",
            caption: "notifications",
            value: `${notificationCount}`,
            tint: "pink" as const,
          },
        ]
      : [
          {
            name: "Circle",
            caption: "friends",
            value: "0",
            tint: "violet" as const,
          },
          {
            name: "Pending",
            caption: "requests",
            value: `${pendingCount}`,
            tint: "cyan" as const,
          },
          {
            name: "Quiet",
            caption: "for now",
            value: "Start",
            tint: "pink" as const,
          },
        ];

  return {
    readiness,
    canGenerateStarterWeek: routineCount === 0 && planCount === 0,
    heroChip,
    heroTitle,
    heroMeta,
    quickStats: [
      {
        key: "goal",
        label: "Goal",
        value: formatGoal(profile.goal),
      },
      {
        key: "routines",
        label: "Routines",
        value: `${routineCount}`,
      },
      {
        key: "library",
        label: "Library",
        value: `${libraryCount}`,
      },
    ],
    todayItems,
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
      primaryMuscleGroup: exercise.primaryMuscleGroup || exercise.categoryName || "General",
      equipment: exercise.equipment || "Mixed",
    })),
    socialCounts: {
      friends: friendCount,
      pending: pendingCount,
      notifications: notificationCount,
    },
    profileMetrics: [
      {
        label: "Weight",
        value: profile.weightKg ? `${profile.weightKg}` : "--",
      },
      {
        label: "Week",
        value: profile.preferredWeeklySessions
          ? `${profile.preferredWeeklySessions}x`
          : "--",
      },
      {
        label: "Level",
        value: profile.experienceLevel || "--",
      },
    ],
  };
}
