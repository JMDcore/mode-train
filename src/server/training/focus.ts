import { eq, inArray } from "drizzle-orm";

import type { TrainingFocusKey } from "@/lib/training-visuals";
import { getTrainingFocusMeta, resolveTrainingFocus, type TrainingFocusMeta } from "@/lib/training-visuals";
import type { getDb } from "@/server/db";
import { exercises, routineTemplateItems } from "@/server/db/schema";

type DbClient = ReturnType<typeof getDb>;

export async function getRoutineFocusMap(
  db: DbClient,
  routines: Array<{ id: string; name: string; focusOverride?: TrainingFocusKey | null }>,
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
      routine.focusOverride
        ? getTrainingFocusMeta(routine.focusOverride)
        : resolveTrainingFocus({
            name: routine.name,
            muscleGroups: groupsByRoutineId.get(routine.id) ?? [],
          }),
    ]),
  );
}
