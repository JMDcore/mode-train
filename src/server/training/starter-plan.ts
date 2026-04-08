import { and, count, eq, inArray } from "drizzle-orm";

import type { UserProfile } from "@/server/profile";
import { getDb } from "@/server/db";
import {
  exercises,
  routineTemplateItems,
  routineTemplates,
  weeklyPlanEntries,
} from "@/server/db/schema";
import type { WeekdayKey } from "@/server/training/week";

type RoutineExerciseBlueprint = {
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir?: number;
  restSeconds?: number;
};

type RoutineBlueprint = {
  name: string;
  weekdayKey: WeekdayKey;
  notes: string;
  items: RoutineExerciseBlueprint[];
};

type RunningBlueprint = {
  weekdayKey: WeekdayKey;
  runningTargetKm: number;
};

type StarterWeekBlueprint = {
  routines: RoutineBlueprint[];
  runs: RunningBlueprint[];
};

function createRoutine(
  name: string,
  weekdayKey: WeekdayKey,
  items: RoutineExerciseBlueprint[],
  notes = "",
): RoutineBlueprint {
  return {
    name,
    weekdayKey,
    notes,
    items,
  };
}

function withDay(routine: RoutineBlueprint, weekdayKey: WeekdayKey): RoutineBlueprint {
  return {
    ...routine,
    weekdayKey,
  };
}

const baseRoutines = {
  fullBodyBase: createRoutine("Cuerpo completo", "monday", [
    { name: "Back Squat", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, targetRir: 2, restSeconds: 150 },
    { name: "Bench Press", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, targetRir: 2, restSeconds: 120 },
    { name: "Chest-Supported Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetRir: 2, restSeconds: 90 },
    { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRir: 2, restSeconds: 120 },
    { name: "Plank", targetSets: 3, targetRepsMin: 30, targetRepsMax: 45, restSeconds: 45 },
  ]),
  upperPrime: createRoutine("Torso A", "monday", [
    { name: "Bench Press", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, targetRir: 2, restSeconds: 150 },
    { name: "Chest-Supported Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetRir: 2, restSeconds: 90 },
    { name: "Overhead Press", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, targetRir: 2, restSeconds: 120 },
    { name: "Pull-Up", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, targetRir: 1, restSeconds: 120 },
    { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 45 },
  ]),
  lowerFocus: createRoutine("Pierna A", "thursday", [
    { name: "Back Squat", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRir: 2, restSeconds: 150 },
    { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, targetRir: 2, restSeconds: 120 },
    { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, targetRir: 2, restSeconds: 90 },
    { name: "Walking Lunges", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRir: 2, restSeconds: 75 },
    { name: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 14, targetRir: 2, restSeconds: 60 },
  ]),
  pushFlow: createRoutine("Empuje", "monday", [
    { name: "Bench Press", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRir: 2, restSeconds: 150 },
    { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRir: 2, restSeconds: 90 },
    { name: "Overhead Press", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, targetRir: 2, restSeconds: 120 },
    { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 45 },
  ]),
  pullFlow: createRoutine("Tiron", "wednesday", [
    { name: "Pull-Up", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, targetRir: 1, restSeconds: 120 },
    { name: "Chest-Supported Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetRir: 2, restSeconds: 90 },
    { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRir: 2, restSeconds: 75 },
    { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 45 },
  ]),
  lowerPower: createRoutine("Pierna potencia", "friday", [
    { name: "Back Squat", targetSets: 4, targetRepsMin: 4, targetRepsMax: 6, targetRir: 2, restSeconds: 150 },
    { name: "Hip Thrust", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRir: 2, restSeconds: 90 },
    { name: "Bulgarian Split Squat", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRir: 2, restSeconds: 75 },
    { name: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 14, targetRir: 2, restSeconds: 60 },
  ]),
  upperVolume: createRoutine("Torso volumen", "tuesday", [
    { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetRir: 2, restSeconds: 75 },
    { name: "Lat Pulldown", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, targetRir: 2, restSeconds: 75 },
    { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRir: 2, restSeconds: 75 },
    { name: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRir: 2, restSeconds: 90 },
    { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 45 },
  ]),
} as const;

function buildStarterBlueprint(profile: UserProfile): StarterWeekBlueprint {
  const goal = profile.goal
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const sessions = Math.max(1, Math.min(profile.preferredWeeklySessions ?? 3, 6));
  const isHybrid = goal.includes("hybrid") || goal.includes("hibrid");
  const isConsistency = goal.includes("consistency") || goal.includes("consisten");

  if (isHybrid) {
    if (sessions <= 2) {
      return {
        routines: [withDay(baseRoutines.fullBodyBase, "monday")],
        runs: [{ weekdayKey: "thursday", runningTargetKm: 5 }],
      };
    }

    if (sessions === 3) {
      return {
        routines: [
          withDay(baseRoutines.upperPrime, "monday"),
          withDay(baseRoutines.lowerFocus, "wednesday"),
        ],
        runs: [{ weekdayKey: "saturday", runningTargetKm: 6 }],
      };
    }

    if (sessions === 4) {
      return {
        routines: [
          withDay(baseRoutines.pushFlow, "monday"),
          withDay(baseRoutines.pullFlow, "wednesday"),
          withDay(baseRoutines.lowerPower, "friday"),
        ],
        runs: [{ weekdayKey: "sunday", runningTargetKm: 6 }],
      };
    }

    return {
      routines: [
        withDay(baseRoutines.upperPrime, "monday"),
        withDay(baseRoutines.lowerFocus, "wednesday"),
        withDay(baseRoutines.upperVolume, "friday"),
      ],
      runs: [
        { weekdayKey: "tuesday", runningTargetKm: 5 },
        { weekdayKey: "sunday", runningTargetKm: 8 },
      ],
    };
  }

  if (isConsistency) {
    if (sessions <= 2) {
      return {
        routines: [
          withDay(baseRoutines.fullBodyBase, "monday"),
          withDay(baseRoutines.lowerFocus, "thursday"),
        ],
        runs: [],
      };
    }

    return {
      routines: [
        withDay(baseRoutines.fullBodyBase, "monday"),
        withDay(baseRoutines.upperPrime, "wednesday"),
        withDay(baseRoutines.lowerFocus, "friday"),
      ],
      runs: [],
    };
  }

  if (sessions <= 2) {
    return {
      routines: [
        withDay(baseRoutines.upperPrime, "monday"),
        withDay(baseRoutines.lowerFocus, "thursday"),
      ],
      runs: [],
    };
  }

  if (sessions === 3) {
    return {
      routines: [
        withDay(baseRoutines.pushFlow, "monday"),
        withDay(baseRoutines.pullFlow, "wednesday"),
        withDay(baseRoutines.lowerPower, "friday"),
      ],
      runs: [],
    };
  }

  if (sessions === 4) {
    return {
      routines: [
        withDay(baseRoutines.upperPrime, "monday"),
        withDay(baseRoutines.lowerFocus, "tuesday"),
        withDay(baseRoutines.pushFlow, "thursday"),
        withDay(baseRoutines.lowerPower, "saturday"),
      ],
      runs: [],
    };
  }

  return {
    routines: [
      withDay(baseRoutines.pushFlow, "monday"),
      withDay(baseRoutines.pullFlow, "tuesday"),
      withDay(baseRoutines.lowerPower, "wednesday"),
      withDay(baseRoutines.upperVolume, "friday"),
      withDay(baseRoutines.lowerFocus, "saturday"),
    ],
    runs: [],
  };
}

export async function createStarterWeek(params: {
  userId: string;
  profile: UserProfile;
}) {
  const db = getDb();
  const blueprint = buildStarterBlueprint(params.profile);

  const [routineCountRow] = await db
    .select({ count: count() })
    .from(routineTemplates)
    .where(eq(routineTemplates.ownerUserId, params.userId));

  const [planCountRow] = await db
    .select({ count: count() })
    .from(weeklyPlanEntries)
    .where(eq(weeklyPlanEntries.userId, params.userId));

  if (Number(routineCountRow?.count ?? 0) > 0 || Number(planCountRow?.count ?? 0) > 0) {
    throw new Error("Tu base ya tiene contenido. Editaremos tu semana sin duplicarla.");
  }

  const requiredExerciseNames = Array.from(
    new Set(blueprint.routines.flatMap((routine) => routine.items.map((item) => item.name))),
  );

  const availableExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
    })
    .from(exercises)
    .where(and(eq(exercises.isSystem, true), inArray(exercises.name, requiredExerciseNames)));

  const exerciseMap = new Map(availableExercises.map((exercise) => [exercise.name, exercise.id]));
  const missingNames = requiredExerciseNames.filter((name) => !exerciseMap.has(name));

  if (missingNames.length > 0) {
    throw new Error(`Faltan ejercicios base: ${missingNames.join(", ")}`);
  }

  await db.transaction(async (tx) => {
    for (const routine of blueprint.routines) {
      const [insertedRoutine] = await tx
        .insert(routineTemplates)
        .values({
          ownerUserId: params.userId,
          name: routine.name,
          notes: routine.notes,
        })
        .returning({
          id: routineTemplates.id,
        });

      await tx.insert(routineTemplateItems).values(
        routine.items.map((item, index) => ({
          routineTemplateId: insertedRoutine.id,
          exerciseId: exerciseMap.get(item.name)!,
          sortOrder: index,
          targetSets: item.targetSets,
          targetRepsMin: item.targetRepsMin,
          targetRepsMax: item.targetRepsMax,
          targetRir: item.targetRir,
          restSeconds: item.restSeconds,
        })),
      );

      await tx.insert(weeklyPlanEntries).values({
        userId: params.userId,
        weekdayKey: routine.weekdayKey,
        routineTemplateId: insertedRoutine.id,
      });
    }

    if (blueprint.runs.length > 0) {
      await tx.insert(weeklyPlanEntries).values(
        blueprint.runs.map((run) => ({
          userId: params.userId,
          weekdayKey: run.weekdayKey,
          runningTargetKm: run.runningTargetKm,
        })),
      );
    }
  });
}
