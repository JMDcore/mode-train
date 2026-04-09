import { asc, eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import {
  appUsers,
  exercises,
  routineTemplateItems,
  routineTemplates,
} from "../src/server/db/schema";
import {
  getAdjacentRoutineItem,
  getLatestOwnedRoutine,
  getRoutineEditorData,
  getRoutineItemCount,
  normalizeRoutineItemSortOrder,
} from "../src/server/training/routines";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const passwordHash = await hashPassword(`ModeTrain!${stamp}`);
  const createdUser = await createUser({
    displayName: "Routine Editor Smoke",
    email: `routine-editor+${stamp}@mode-train.local`,
    passwordHash,
  });

  try {
    const libraryExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
      })
      .from(exercises)
      .where(eq(exercises.isSystem, true))
      .orderBy(asc(exercises.name))
      .limit(3);

    if (libraryExercises.length < 3) {
      throw new Error("La biblioteca sistema no tiene suficientes ejercicios para el smoke.");
    }

    const [routine] = await db
      .insert(routineTemplates)
      .values({
        ownerUserId: createdUser.id,
        name: "Upper Smoke",
      })
      .returning({
        id: routineTemplates.id,
      });

    const [firstItem, secondItem] = await db
      .insert(routineTemplateItems)
      .values([
        {
          routineTemplateId: routine.id,
          exerciseId: libraryExercises[0].id,
          sortOrder: 0,
          targetSets: 3,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetRir: 2,
          restSeconds: 120,
          notes: "",
        },
        {
          routineTemplateId: routine.id,
          exerciseId: libraryExercises[1].id,
          sortOrder: 1,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRir: 2,
          restSeconds: 90,
          notes: "",
        },
      ])
      .returning({
        id: routineTemplateItems.id,
      });

    const countBefore = await getRoutineItemCount(createdUser.id, routine.id);

    if (countBefore !== 2) {
      throw new Error("El contador inicial de bloques no coincide.");
    }

    const [thirdItem] = await db
      .insert(routineTemplateItems)
      .values({
        routineTemplateId: routine.id,
        exerciseId: libraryExercises[2].id,
        sortOrder: 2,
        targetSets: 4,
        targetRepsMin: 10,
        targetRepsMax: 12,
        targetRir: 1,
        restSeconds: 75,
        notes: "Mantener tension",
      })
      .returning({
        id: routineTemplateItems.id,
      });

    await db
      .update(routineTemplates)
      .set({
        focusOverride: "back",
      })
      .where(eq(routineTemplates.id, routine.id));

    await db
      .update(routineTemplateItems)
      .set({
        targetSets: 5,
        targetRepsMin: 5,
        targetRepsMax: 7,
        targetRir: 1,
        restSeconds: 150,
        notes: "Top set y back-offs",
      })
      .where(eq(routineTemplateItems.id, secondItem.id));

    const movePair = await getAdjacentRoutineItem(createdUser.id, routine.id, thirdItem.id, "up");

    if (!movePair?.target || movePair.target.id !== secondItem.id) {
      throw new Error("La deteccion de adyacencia no ha respondido como se esperaba.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(routineTemplateItems)
        .set({
          sortOrder: movePair.target!.sortOrder,
        })
        .where(eq(routineTemplateItems.id, movePair.current.id));

      await tx
        .update(routineTemplateItems)
        .set({
          sortOrder: movePair.current.sortOrder,
        })
        .where(eq(routineTemplateItems.id, movePair.target!.id));

      await tx.delete(routineTemplateItems).where(eq(routineTemplateItems.id, firstItem.id));
      await normalizeRoutineItemSortOrder(tx, routine.id);
    });

    const editorData = await getRoutineEditorData(createdUser.id, routine.id);
    const latestRoutine = await getLatestOwnedRoutine(createdUser.id);

    if (!editorData || !latestRoutine) {
      throw new Error("No se ha podido cargar la rutina editada.");
    }

    if (
      editorData.items.length !== 2 ||
      editorData.items[0]?.exerciseId !== libraryExercises[2].id ||
      editorData.items[0]?.sortOrder !== 0 ||
      editorData.items[1]?.exerciseId !== libraryExercises[1].id ||
      editorData.items[1]?.targetSets !== 5 ||
      editorData.items[1]?.notes !== "Top set y back-offs" ||
      editorData.routine.focusOverride !== "back" ||
      editorData.routine.focusKey !== "back" ||
      latestRoutine.id !== routine.id
    ) {
      throw new Error("La rutina editada no refleja el estado esperado.");
    }

    const rawItems = await db
      .select({
        id: routineTemplateItems.id,
        sortOrder: routineTemplateItems.sortOrder,
      })
      .from(routineTemplateItems)
      .where(eq(routineTemplateItems.routineTemplateId, routine.id))
      .orderBy(asc(routineTemplateItems.sortOrder));

    if (
      rawItems.length !== 2 ||
      rawItems[0]?.sortOrder !== 0 ||
      rawItems[1]?.sortOrder !== 1
    ) {
      throw new Error("La normalizacion de orden no ha dejado la rutina consistente.");
    }

    console.log("Smoke routine editor ok:", {
      routineId: routine.id,
      items: editorData.items.map((item) => ({
        id: item.id,
        exercise: item.exerciseName,
        sortOrder: item.sortOrder,
      })),
    });
  } finally {
    await db.delete(appUsers).where(eq(appUsers.id, createdUser.id));
    await getDbPool().end();
  }
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
