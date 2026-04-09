import { eq, inArray } from "drizzle-orm";

import type { getDb } from "@/server/db";
import { exercises, routineTemplateItems } from "@/server/db/schema";
import { resolveTrainingFocus, type TrainingFocusMeta } from "@/lib/training-visuals";

type DbClient = ReturnType<typeof getDb>;

export async function getRoutineFocusMap(
  db: DbClient,
  routines: Array<{ id: string; name: string }>,
) {
  const routineIds = routines.map((routine) => routine.id);

  if (routineIds.length === 0) {
    return new Map<string, TrainingFocusMeta>();
  }

  const rows = await db
    .select({
      routineId: routineTemplateItems.routineTemplateId,
      primaryMuscleGroup: exercises.primaryMuscleGroup,
    })
    .from(routineTemplateItems)
    .innerJoin(exercises, eq(exercises.id, routineTemplateItems.exerciseId))
    .where(inArray(routineTemplateItems.routineTemplateId, routineIds));

  const groupsByRoutineId = new Map<string, string[]>();

  for (const row of rows) {
    const bucket = groupsByRoutineId.get(row.routineId) ?? [];
    bucket.push(row.primaryMuscleGroup || "General");
    groupsByRoutineId.set(row.routineId, bucket);
  }

  return new Map<string, TrainingFocusMeta>(
    routines.map((routine) => [
      routine.id,
      resolveTrainingFocus({
        name: routine.name,
        muscleGroups: groupsByRoutineId.get(routine.id) ?? [],
      }),
    ]),
  );
}
