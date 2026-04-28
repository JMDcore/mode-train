import { and, asc, eq, inArray, or } from "drizzle-orm";

import { createUser, normalizeEmail } from "../src/server/auth/user";
import { hashPassword } from "../src/server/auth/password";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import {
  appUsers,
  exerciseCategories,
  exercises,
  friendships,
  notifications,
  profiles,
  progressPhotos,
  routineTemplateItems,
  routineTemplates,
  runningSessions,
  trainingScheduleEntries,
  userSessions,
  weeklyPlanEntries,
  workoutSessions,
} from "../src/server/db/schema";
import { getUserProfile } from "../src/server/profile";
import { createStarterWeek } from "../src/server/training/starter-plan";
import { createRunningSession } from "../src/server/training/running";
import {
  completeWorkoutSession,
  saveWorkoutExerciseBlock,
  startOrResumeWorkoutSession,
} from "../src/server/training/workouts";

const DEMO_EMAIL = "admin@mode-train.local";
const DEMO_PASSWORD = "adminadmin";
const DEMO_DISPLAY_NAME = "Admin Demo";

const requiredSystemExercises = [
  "Back Squat",
  "Bench Press",
  "Bulgarian Split Squat",
  "Chest-Supported Row",
  "Hip Thrust",
  "Incline Dumbbell Press",
  "Lat Pulldown",
  "Lateral Raise",
  "Leg Curl",
  "Leg Press",
  "Overhead Press",
  "Plank",
  "Pull-Up",
  "Romanian Deadlift",
  "Seated Cable Row",
  "Walking Lunges",
] as const;

function addDays(input: Date, days: number) {
  const next = new Date(input);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(input: Date) {
  const next = new Date(input);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + diff);
  return next;
}

function toIsoDate(input: Date) {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function cleanupDemoUser(userId: string) {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx.delete(notifications).where(eq(notifications.userId, userId));
    await tx
      .delete(friendships)
      .where(
        or(
          eq(friendships.requesterUserId, userId),
          eq(friendships.addresseeUserId, userId),
        ),
      );
    await tx.delete(progressPhotos).where(eq(progressPhotos.userId, userId));
    await tx.delete(trainingScheduleEntries).where(eq(trainingScheduleEntries.userId, userId));
    await tx.delete(weeklyPlanEntries).where(eq(weeklyPlanEntries.userId, userId));
    await tx.delete(workoutSessions).where(eq(workoutSessions.userId, userId));
    await tx.delete(runningSessions).where(eq(runningSessions.userId, userId));
    await tx.delete(routineTemplates).where(eq(routineTemplates.ownerUserId, userId));
    await tx.delete(exercises).where(eq(exercises.ownerUserId, userId));
    await tx.delete(exerciseCategories).where(eq(exerciseCategories.ownerUserId, userId));
    await tx.delete(userSessions).where(eq(userSessions.userId, userId));
    await tx.delete(appUsers).where(eq(appUsers.id, userId));
  });
}

async function getSystemExerciseMap() {
  const db = getDb();
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
    })
    .from(exercises)
    .where(
      and(
        eq(exercises.isSystem, true),
        inArray(
          exercises.name,
          [...requiredSystemExercises],
        ),
      ),
    );

  const map = new Map(rows.map((row) => [row.name, row.id]));
  const missing = requiredSystemExercises.filter((name) => !map.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Faltan ejercicios del sistema: ${missing.join(", ")}. Ejecuta antes npm run db:seed.`,
    );
  }

  return map;
}

async function getRoutineMap(userId: string) {
  const db = getDb();
  const routines = await db
    .select({
      id: routineTemplates.id,
      name: routineTemplates.name,
    })
    .from(routineTemplates)
    .where(eq(routineTemplates.ownerUserId, userId));

  return new Map(routines.map((routine) => [routine.name, routine.id]));
}

async function getRoutineItemsMap(routineIds: string[]) {
  const db = getDb();
  const rows = await db
    .select({
      routineId: routineTemplateItems.routineTemplateId,
      exerciseId: routineTemplateItems.exerciseId,
      exerciseName: exercises.name,
    })
    .from(routineTemplateItems)
    .innerJoin(exercises, eq(exercises.id, routineTemplateItems.exerciseId))
    .where(inArray(routineTemplateItems.routineTemplateId, routineIds))
    .orderBy(asc(routineTemplateItems.routineTemplateId), asc(routineTemplateItems.sortOrder));

  const map = new Map<
    string,
    Array<{ exerciseId: string; exerciseName: string }>
  >();

  for (const row of rows) {
    const bucket = map.get(row.routineId) ?? [];
    bucket.push({
      exerciseId: row.exerciseId,
      exerciseName: row.exerciseName,
    });
    map.set(row.routineId, bucket);
  }

  return map;
}

async function completeDemoSession(params: {
  userId: string;
  routineId: string;
  performedOn: string;
  itemsByRoutine: Map<string, Array<{ exerciseId: string; exerciseName: string }>>;
  blocks: Array<{
    itemIndex: number;
    sets: Array<{
      weightKg: number | null;
      reps: number;
      rir: number | null;
    }>;
  }>;
}) {
  const routineItems = params.itemsByRoutine.get(params.routineId) ?? [];

  if (routineItems.length === 0) {
    throw new Error(`La rutina ${params.routineId} no tiene items cargados.`);
  }

  const started = await startOrResumeWorkoutSession(
    params.userId,
    params.routineId,
    params.performedOn,
  );

  for (const block of params.blocks) {
    const routineItem = routineItems[block.itemIndex];

    if (!routineItem) {
      throw new Error(
        `No existe el item ${block.itemIndex} en la rutina ${params.routineId}.`,
      );
    }

    await saveWorkoutExerciseBlock({
      userId: params.userId,
      sessionId: started.sessionId,
      exerciseId: routineItem.exerciseId,
      sets: block.sets,
    });
  }

  await completeWorkoutSession(params.userId, started.sessionId);
}

async function main() {
  const db = getDb();
  const normalizedEmail = normalizeEmail(DEMO_EMAIL);
  const [existingUser] = await db
    .select({
      id: appUsers.id,
    })
    .from(appUsers)
    .where(eq(appUsers.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    await cleanupDemoUser(existingUser.id);
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await createUser({
    displayName: DEMO_DISPLAY_NAME,
    email: normalizedEmail,
    passwordHash,
  });

  try {
    await db
      .update(profiles)
      .set({
        displayName: DEMO_DISPLAY_NAME,
        bio: "Cuenta de demostracion con datos realistas para revisar rutinas, agenda, historial y progreso.",
        goal: "Ser mas fuerte",
        experienceLevel: "Intermedio",
        preferredWeeklySessions: 4,
        heightCm: 182,
        weightKg: 83.5,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    const profile = await getUserProfile(user.id);

    if (!profile) {
      throw new Error("No se ha podido cargar el perfil de la cuenta demo.");
    }

    await createStarterWeek({
      userId: user.id,
      profile,
    });

    const systemExercises = await getSystemExerciseMap();

    const [customCategory] = await db
      .insert(exerciseCategories)
      .values({
        slug: "demo-custom",
        name: "Demo Custom",
        isSystem: false,
        ownerUserId: user.id,
      })
      .returning({
        id: exerciseCategories.id,
      });

    const customExercises = await db
      .insert(exercises)
      .values([
        {
          categoryId: customCategory.id,
          ownerUserId: user.id,
          name: "Curl inclinado",
          description: "Curl controlado para biceps con enfasis en estiramiento.",
          primaryMuscleGroup: "Arms",
          equipment: "Dumbbells",
          tags: ["biceps", "demo"],
          isSystem: false,
        },
        {
          categoryId: customCategory.id,
          ownerUserId: user.id,
          name: "Farmer Carry",
          description: "Paseo pesado para agarre, core y estabilidad.",
          primaryMuscleGroup: "Core",
          equipment: "Dumbbells",
          tags: ["carry", "core", "demo"],
          isSystem: false,
        },
      ])
      .returning({
        id: exercises.id,
        name: exercises.name,
      });

    const customExerciseMap = new Map(
      customExercises.map((exercise) => [exercise.name, exercise.id]),
    );

    const [customRoutine] = await db
      .insert(routineTemplates)
      .values({
        ownerUserId: user.id,
        name: "Brazos + core",
        notes: "Bloque de accesorios y trabajo de estabilidad para probar la app.",
        focusOverride: "arms",
      })
      .returning({
        id: routineTemplates.id,
      });

    await db.insert(routineTemplateItems).values([
      {
        routineTemplateId: customRoutine.id,
        exerciseId: customExerciseMap.get("Curl inclinado")!,
        sortOrder: 0,
        targetSets: 4,
        targetRepsMin: 8,
        targetRepsMax: 12,
        targetRir: 1,
        restSeconds: 75,
        notes: "Controla la bajada.",
      },
      {
        routineTemplateId: customRoutine.id,
        exerciseId: customExerciseMap.get("Farmer Carry")!,
        sortOrder: 1,
        targetSets: 3,
        targetRepsMin: 20,
        targetRepsMax: 30,
        targetRir: null,
        restSeconds: 60,
        notes: "Paseos pesados y estables.",
      },
      {
        routineTemplateId: customRoutine.id,
        exerciseId: systemExercises.get("Plank")!,
        sortOrder: 2,
        targetSets: 3,
        targetRepsMin: 40,
        targetRepsMax: 60,
        targetRir: null,
        restSeconds: 45,
        notes: "Respira y aprieta abdomen.",
      },
    ]);

    await db.insert(weeklyPlanEntries).values({
      userId: user.id,
      weekdayKey: "saturday",
      routineTemplateId: customRoutine.id,
    });

    const routineMap = await getRoutineMap(user.id);
    const requiredRoutines = [
      "Torso A",
      "Pierna A",
      "Empuje",
      "Pierna potencia",
      "Brazos + core",
    ] as const;
    const missingRoutines = requiredRoutines.filter((name) => !routineMap.has(name));

    if (missingRoutines.length > 0) {
      throw new Error(
        `No se han generado todas las rutinas de demo: ${missingRoutines.join(", ")}.`,
      );
    }

    await db
      .update(routineTemplates)
      .set({
        focusOverride: "chest",
        updatedAt: new Date(),
      })
      .where(eq(routineTemplates.id, routineMap.get("Torso A")!));

    await db
      .update(routineTemplates)
      .set({
        focusOverride: "legs",
        updatedAt: new Date(),
      })
      .where(eq(routineTemplates.id, routineMap.get("Pierna A")!));

    await db
      .update(routineTemplates)
      .set({
        focusOverride: "chest",
        updatedAt: new Date(),
      })
      .where(eq(routineTemplates.id, routineMap.get("Empuje")!));

    await db
      .update(routineTemplates)
      .set({
        focusOverride: "legs",
        updatedAt: new Date(),
      })
      .where(eq(routineTemplates.id, routineMap.get("Pierna potencia")!));

    const weekStart = startOfWeek(new Date());
    const today = new Date();
    const todayIso = toIsoDate(today);

    await db.insert(trainingScheduleEntries).values([
      {
        userId: user.id,
        entryType: "gym",
        scheduledDate: todayIso,
        routineTemplateId: routineMap.get("Empuje")!,
        title: "Empuje",
        notes: "Sesion principal abierta para la demo.",
      },
      {
        userId: user.id,
        entryType: "running",
        scheduledDate: todayIso,
        title: "Rodaje de recuperacion",
        runningKind: "easy",
        runningTargetKm: 5.5,
        notes: "Soltar piernas.",
      },
      {
        userId: user.id,
        entryType: "gym",
        scheduledDate: toIsoDate(addDays(weekStart, 4)),
        routineTemplateId: routineMap.get("Pierna A")!,
        title: "Pierna A",
        notes: "Pierna tecnica y controlada.",
      },
      {
        userId: user.id,
        entryType: "running",
        scheduledDate: toIsoDate(addDays(weekStart, 5)),
        title: "Tempo 8 km",
        runningKind: "tempo",
        runningTargetKm: 8,
        notes: "Bloque de ritmo sostenido.",
      },
      {
        userId: user.id,
        entryType: "gym",
        scheduledDate: toIsoDate(addDays(weekStart, 6)),
        routineTemplateId: customRoutine.id,
        title: "Brazos + core",
        notes: "Accesorios y estabilidad.",
      },
    ]);

    const routineIds = Array.from(routineMap.values());
    const routineItemsByRoutine = await getRoutineItemsMap(routineIds);

    await completeDemoSession({
      userId: user.id,
      routineId: routineMap.get("Torso A")!,
      performedOn: toIsoDate(addDays(today, -10)),
      itemsByRoutine: routineItemsByRoutine,
      blocks: [
        {
          itemIndex: 0,
          sets: [
            { weightKg: 72.5, reps: 8, rir: 2 },
            { weightKg: 72.5, reps: 8, rir: 2 },
          ],
        },
        {
          itemIndex: 1,
          sets: [
            { weightKg: 52.5, reps: 10, rir: 2 },
            { weightKg: 52.5, reps: 10, rir: 2 },
          ],
        },
      ],
    });

    await completeDemoSession({
      userId: user.id,
      routineId: routineMap.get("Empuje")!,
      performedOn: toIsoDate(addDays(today, -7)),
      itemsByRoutine: routineItemsByRoutine,
      blocks: [
        {
          itemIndex: 0,
          sets: [
            { weightKg: 80, reps: 6, rir: 2 },
            { weightKg: 80, reps: 6, rir: 2 },
          ],
        },
        {
          itemIndex: 1,
          sets: [
            { weightKg: 30, reps: 10, rir: 2 },
            { weightKg: 30, reps: 10, rir: 2 },
          ],
        },
      ],
    });

    await completeDemoSession({
      userId: user.id,
      routineId: routineMap.get("Torso A")!,
      performedOn: toIsoDate(addDays(today, -3)),
      itemsByRoutine: routineItemsByRoutine,
      blocks: [
        {
          itemIndex: 0,
          sets: [
            { weightKg: 82.5, reps: 6, rir: 1 },
            { weightKg: 82.5, reps: 6, rir: 1 },
          ],
        },
        {
          itemIndex: 1,
          sets: [
            { weightKg: 60, reps: 10, rir: 2 },
            { weightKg: 60, reps: 10, rir: 2 },
          ],
        },
        {
          itemIndex: 2,
          sets: [
            { weightKg: 42.5, reps: 8, rir: 2 },
          ],
        },
      ],
    });

    await completeDemoSession({
      userId: user.id,
      routineId: routineMap.get("Pierna A")!,
      performedOn: toIsoDate(addDays(today, -1)),
      itemsByRoutine: routineItemsByRoutine,
      blocks: [
        {
          itemIndex: 0,
          sets: [
            { weightKg: 115, reps: 5, rir: 2 },
            { weightKg: 115, reps: 5, rir: 2 },
          ],
        },
        {
          itemIndex: 1,
          sets: [
            { weightKg: 100, reps: 8, rir: 2 },
            { weightKg: 100, reps: 8, rir: 2 },
          ],
        },
      ],
    });

    await createRunningSession(user.id, {
      kind: "easy",
      date: toIsoDate(addDays(today, -11)),
      distanceKm: 5.2,
      durationMinutes: 31,
      notes: "Rodaje suave de base.",
    });

    await createRunningSession(user.id, {
      kind: "tempo",
      date: toIsoDate(addDays(today, -4)),
      distanceKm: 8.4,
      durationMinutes: 40,
      notes: "Tempo progresivo controlado.",
    });

    await createRunningSession(user.id, {
      kind: "long_run",
      date: toIsoDate(addDays(today, -2)),
      distanceKm: 12.6,
      durationMinutes: 68,
      notes: "Tirada larga de prueba.",
    });

    const openSession = await startOrResumeWorkoutSession(
      user.id,
      routineMap.get("Empuje")!,
      todayIso,
    );
    const openRoutineItems = routineItemsByRoutine.get(routineMap.get("Empuje")!) ?? [];

    if (openRoutineItems.length === 0) {
      throw new Error("La rutina abierta de demo no tiene ejercicios.");
    }

    await saveWorkoutExerciseBlock({
      userId: user.id,
      sessionId: openSession.sessionId,
      exerciseId: openRoutineItems[0]!.exerciseId,
      sets: [
        { weightKg: 85, reps: 5, rir: 1 },
        { weightKg: 85, reps: 5, rir: 1 },
      ],
    });

    await db.insert(notifications).values([
      {
        userId: user.id,
        title: "Sesion abierta",
        body: "Tienes Empuje en progreso para revisar el flujo de reanudacion.",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Nuevo record",
        body: "Bench Press subio a 82.5 kg en la ultima sesion completada.",
        isRead: false,
      },
      {
        userId: user.id,
        title: "Running listo",
        body: "Tempo y tirada larga cargados para probar historial y resumen.",
        isRead: true,
      },
    ]);

    console.log("Demo account ready:", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      note: "No existe rol admin real en este proyecto y la UI exige al menos 8 caracteres, asi que la demo usa adminadmin en lugar de admin.",
      routines: routineIds.length,
      runningSessions: 3,
      todayOpenSession: true,
    });
  } finally {
    await getDbPool().end();
  }
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
