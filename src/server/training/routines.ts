import { and, asc, desc, eq, or, sql } from "drizzle-orm";

import { getDb } from "@/server/db";
import {
  exerciseCategories,
  exercises,
  routineTemplateItems,
  routineTemplates,
} from "@/server/db/schema";

export type RoutineItemDetail = {
  id: string;
  routineTemplateId: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscleGroup: string;
  equipment: string;
  sortOrder: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRir: number | null;
  restSeconds: number | null;
  notes: string;
};

export type LibraryExerciseOption = {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  equipment: string;
};

export type RoutineEditorData = {
  routine: {
    id: string;
    name: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
  };
  items: RoutineItemDetail[];
  availableExercises: LibraryExerciseOption[];
};

async function getOwnedRoutineRecord(db: ReturnType<typeof getDb>, userId: string, routineId: string) {
  const [routine] = await db
    .select({
      id: routineTemplates.id,
      name: routineTemplates.name,
      notes: routineTemplates.notes,
      createdAt: routineTemplates.createdAt,
      updatedAt: routineTemplates.updatedAt,
    })
    .from(routineTemplates)
    .where(
      and(
        eq(routineTemplates.id, routineId),
        eq(routineTemplates.ownerUserId, userId),
      ),
    )
    .limit(1);

  return routine ?? null;
}

export async function getRoutineEditorData(
  userId: string,
  routineId: string,
): Promise<RoutineEditorData | null> {
  const db = getDb();
  const routine = await getOwnedRoutineRecord(db, userId, routineId);

  if (!routine) {
    return null;
  }

  const items = await db
    .select({
      id: routineTemplateItems.id,
      routineTemplateId: routineTemplateItems.routineTemplateId,
      exerciseId: routineTemplateItems.exerciseId,
      exerciseName: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      equipment: exercises.equipment,
      sortOrder: routineTemplateItems.sortOrder,
      targetSets: routineTemplateItems.targetSets,
      targetRepsMin: routineTemplateItems.targetRepsMin,
      targetRepsMax: routineTemplateItems.targetRepsMax,
      targetRir: routineTemplateItems.targetRir,
      restSeconds: routineTemplateItems.restSeconds,
      notes: routineTemplateItems.notes,
    })
    .from(routineTemplateItems)
    .innerJoin(exercises, eq(exercises.id, routineTemplateItems.exerciseId))
    .where(eq(routineTemplateItems.routineTemplateId, routineId))
    .orderBy(asc(routineTemplateItems.sortOrder), asc(routineTemplateItems.id));

  const availableExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
      equipment: exercises.equipment,
      categoryName: exerciseCategories.name,
    })
    .from(exercises)
    .leftJoin(exerciseCategories, eq(exerciseCategories.id, exercises.categoryId))
    .where(or(eq(exercises.isSystem, true), eq(exercises.ownerUserId, userId)))
    .orderBy(asc(exercises.name));

  return {
    routine,
    items: items.map((item) => ({
      ...item,
      primaryMuscleGroup: item.primaryMuscleGroup || "General",
      equipment: item.equipment || "Mixto",
    })),
    availableExercises: availableExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup || exercise.categoryName || "General",
      equipment: exercise.equipment || "Mixto",
    })),
  };
}

export async function getRoutineItemCount(userId: string, routineId: string) {
  const db = getDb();
  const routine = await getOwnedRoutineRecord(db, userId, routineId);

  if (!routine) {
    return null;
  }

  const [record] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(routineTemplateItems)
    .where(eq(routineTemplateItems.routineTemplateId, routineId));

  return Number(record?.count ?? 0);
}

export async function ensureRoutineOwnership(userId: string, routineId: string) {
  const db = getDb();

  return getOwnedRoutineRecord(db, userId, routineId);
}

export async function getAdjacentRoutineItem(
  userId: string,
  routineId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const db = getDb();
  const routine = await getOwnedRoutineRecord(db, userId, routineId);

  if (!routine) {
    return null;
  }

  const items = await db
    .select({
      id: routineTemplateItems.id,
      sortOrder: routineTemplateItems.sortOrder,
    })
    .from(routineTemplateItems)
    .where(eq(routineTemplateItems.routineTemplateId, routineId))
    .orderBy(asc(routineTemplateItems.sortOrder), asc(routineTemplateItems.id));

  const index = items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return null;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= items.length) {
    return {
      current: items[index],
      target: null,
    };
  }

  return {
    current: items[index],
    target: items[targetIndex],
  };
}

export async function normalizeRoutineItemSortOrder(
  db: Pick<ReturnType<typeof getDb>, "select" | "update">,
  routineId: string,
) {
  const items = await db
    .select({
      id: routineTemplateItems.id,
    })
    .from(routineTemplateItems)
    .where(eq(routineTemplateItems.routineTemplateId, routineId))
    .orderBy(asc(routineTemplateItems.sortOrder), asc(routineTemplateItems.id));

  for (const [index, item] of items.entries()) {
    await db
      .update(routineTemplateItems)
      .set({
        sortOrder: index,
      })
      .where(eq(routineTemplateItems.id, item.id));
  }
}

export async function getLatestOwnedRoutine(userId: string) {
  const db = getDb();

  const [routine] = await db
    .select({
      id: routineTemplates.id,
      name: routineTemplates.name,
      notes: routineTemplates.notes,
      createdAt: routineTemplates.createdAt,
      updatedAt: routineTemplates.updatedAt,
    })
    .from(routineTemplates)
    .where(eq(routineTemplates.ownerUserId, userId))
    .orderBy(desc(routineTemplates.updatedAt))
    .limit(1);

  return routine ?? null;
}
