"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import {
  exercises,
  routineTemplateItems,
  routineTemplates,
  runningKindEnum,
  scheduleEntryTypeEnum,
  trainingScheduleEntries,
} from "@/server/db/schema";
import { getUserProfile, isProfileComplete } from "@/server/profile";
import {
  getAdjacentRoutineItem,
  getRoutineItemCount,
  normalizeRoutineItemSortOrder,
} from "@/server/training/routines";
import {
  createRunningSession,
  updateRunningSession,
} from "@/server/training/running";
import { createStarterWeek } from "@/server/training/starter-plan";
import type {
  RoutineActionState,
  RoutineItemActionState,
  RunLogActionState,
  ExerciseActionState,
  ScheduleActionState,
  StarterPlanActionState,
  WorkoutCompleteActionState,
  WorkoutExerciseBlockActionState,
  WorkoutLaunchActionState,
} from "@/server/training/types";
import {
  cancelWorkoutSession,
  completeWorkoutSession,
  saveWorkoutExerciseBlock,
  startOrResumeWorkoutSession,
} from "@/server/training/workouts";

const routineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ponle un nombre a la rutina.")
    .max(80, "El nombre es demasiado largo."),
});

const routineLaunchSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina seleccionada no es valida."),
  sessionDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || "")
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Selecciona una fecha valida para el entreno.",
    }),
});

const runningLogSchema = z.object({
  kind: z.enum(runningKindEnum.enumValues),
  date: z
    .string()
    .trim()
    .min(10, "Selecciona la fecha de la carrera."),
  distanceKm: z.union([z.coerce.number().min(0.5).max(250), z.nan()]).optional(),
  durationMinutes: z.union([z.coerce.number().int().min(1).max(1440), z.nan()]).optional(),
  notes: z.string().trim().max(240).optional().default(""),
});

const runningUpdateSchema = runningLogSchema.extend({
  sessionId: z.string().uuid("La carrera seleccionada no es valida."),
});

const customExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ponle un nombre al ejercicio.")
    .max(140, "El nombre es demasiado largo."),
  primaryMuscleGroup: z
    .string()
    .trim()
    .min(2, "Indica el grupo principal.")
    .max(80, "El grupo muscular es demasiado largo."),
  equipment: z
    .string()
    .trim()
    .min(2, "Indica el material.")
    .max(80, "El material es demasiado largo."),
  description: z.string().trim().max(320).optional().default(""),
});

const scheduleEntrySchema = z.object({
  entryType: z.enum(scheduleEntryTypeEnum.enumValues),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha valida."),
  routineTemplateId: z.string().trim().optional().default(""),
  runningKind: z.enum(runningKindEnum.enumValues).optional(),
  runningTargetKm: z.union([z.coerce.number().min(0.5).max(250), z.nan()]).optional(),
  title: z.string().trim().max(140).optional().default(""),
  notes: z.string().trim().max(240).optional().default(""),
});

const scheduleDeleteSchema = z.object({
  entryId: z.string().uuid("La planificacion no es valida."),
});

const routineItemAddSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina no es valida."),
  exerciseId: z.string().uuid("Selecciona un ejercicio valido."),
});

const routineItemMoveSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina no es valida."),
  itemId: z.string().uuid("El bloque seleccionado no es valido."),
  direction: z.enum(["up", "down"]),
});

const routineItemDeleteSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina no es valida."),
  itemId: z.string().uuid("El bloque seleccionado no es valido."),
});

const workoutCompleteSchema = z.object({
  sessionId: z.string().uuid("La sesion no es valida."),
});

const workoutBlockSchema = z.object({
  sessionId: z.string().uuid("La sesion no es valida."),
  exerciseId: z.string().uuid("El ejercicio no es valido."),
  setsJson: z.string().min(2, "No hemos recibido los sets."),
});

const routineItemUpdateBaseSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina no es valida."),
  itemId: z.string().uuid("El bloque seleccionado no es valido."),
  targetSets: z.coerce.number().int().min(1).max(10),
  targetRepsMin: z.coerce.number().int().min(1).max(40),
  targetRepsMax: z.coerce.number().int().min(1).max(60),
  notes: z.string().trim().max(240).optional().default(""),
});

const setDraftSchema = z.object({
  weightKg: z.union([z.number(), z.null()]),
  reps: z.number().int().min(1).max(100),
  rir: z.union([z.number().int().min(0).max(5), z.null()]),
});

function createRoutineState(error: string | null, success: string | null, nextPath: string | null, routineId: string | null): RoutineActionState {
  return {
    error,
    success,
    nextPath,
    routineId,
  };
}

function createWorkoutLaunchState(
  error: string | null,
  success: string | null,
  nextPath: string | null,
  resumed: boolean,
  routineId: string | null,
  sessionId: string | null,
): WorkoutLaunchActionState {
  return {
    error,
    success,
    nextPath,
    resumed,
    routineId,
    sessionId,
  };
}

function createWorkoutCompleteState(
  error: string | null,
  success: string | null,
  nextPath: string | null,
): WorkoutCompleteActionState {
  return {
    error,
    success,
    nextPath,
  };
}

function toActionError(error: unknown, fallback = "No se ha podido completar la accion.") {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function parseNullableInt(raw: FormDataEntryValue | null, label: string, min: number, max: number) {
  const value = String(raw ?? "").trim();

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(label);
  }

  return parsed;
}

function parseWorkoutSets(raw: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("No hemos podido leer los sets.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Los sets enviados no son validos.");
  }

  const drafts = parsed
    .map((item) => {
      const entry = item as Record<string, unknown>;

      const repsRaw = entry.reps;
      const weightKgRaw = entry.weightKg;
      const rirRaw = entry.rir;

      const reps =
        repsRaw === null || repsRaw === undefined || repsRaw === ""
          ? null
          : Number(repsRaw);
      const weightKg =
        weightKgRaw === null || weightKgRaw === undefined || weightKgRaw === ""
          ? null
          : Number(weightKgRaw);
      const rir =
        rirRaw === null || rirRaw === undefined || rirRaw === ""
          ? null
          : Number(rirRaw);

      return {
        reps,
        weightKg,
        rir,
      };
    })
    .filter((item) => item.reps !== null || item.weightKg !== null || item.rir !== null)
    .map((item) => {
      if (item.reps === null) {
        throw new Error("Cada set guardado necesita repeticiones.");
      }

      return setDraftSchema.parse({
        reps: item.reps,
        weightKg: item.weightKg,
        rir: item.rir,
      });
    });

  if (drafts.length === 0) {
    throw new Error("Anade al menos un set antes de guardar.");
  }

  return drafts;
}

async function findOwnedRoutineItem(userId: string, routineId: string, itemId: string) {
  const db = getDb();

  const [item] = await db
    .select({
      id: routineTemplateItems.id,
      sortOrder: routineTemplateItems.sortOrder,
      exerciseId: routineTemplateItems.exerciseId,
    })
    .from(routineTemplateItems)
    .innerJoin(routineTemplates, eq(routineTemplates.id, routineTemplateItems.routineTemplateId))
    .where(
      and(
        eq(routineTemplateItems.id, itemId),
        eq(routineTemplateItems.routineTemplateId, routineId),
        eq(routineTemplates.ownerUserId, userId),
      ),
    )
    .limit(1);

  return item ?? null;
}

export async function createRoutineAction(
  _previousState: RoutineActionState,
  formData: FormData,
): Promise<RoutineActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = routineSchema.parse({
      name: String(formData.get("name") ?? ""),
    });

    const [routine] = await db
      .insert(routineTemplates)
      .values({
        ownerUserId: user.id,
        name: parsed.name,
      })
      .returning({
        id: routineTemplates.id,
      });

    revalidatePath("/app");
    revalidatePath(`/app/routines/${routine.id}`);

    return createRoutineState(
      null,
      "Rutina creada.",
      `/app/routines/${routine.id}`,
      routine.id,
    );
  } catch (error) {
    return createRoutineState(
      toActionError(error, "No se ha podido crear la rutina."),
      null,
      null,
      null,
    );
  }
}

export async function generateStarterWeekAction(
  previousState: StarterPlanActionState,
): Promise<StarterPlanActionState> {
  try {
    void previousState;
    const user = await requireUser();
    const profile = await getUserProfile(user.id);

    if (!profile || !isProfileComplete(profile)) {
      return {
        error: "Completa tu perfil antes de generar tu semana inicial.",
        success: null,
      };
    }

    await createStarterWeek({
      userId: user.id,
      profile,
    });

    revalidatePath("/app");

    return {
      error: null,
      success: "Semana inicial creada.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido crear la semana inicial."),
      success: null,
    };
  }
}

export async function startWorkoutSessionAction(
  _previousState: WorkoutLaunchActionState,
  formData: FormData,
): Promise<WorkoutLaunchActionState> {
  try {
    const user = await requireUser();
    const parsed = routineLaunchSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      sessionDate: String(formData.get("sessionDate") ?? ""),
    });

    const session = await startOrResumeWorkoutSession(
      user.id,
      parsed.routineTemplateId,
      parsed.sessionDate || undefined,
    );

    revalidatePath("/app");
    revalidatePath(`/app/workouts/${session.sessionId}`);

    return createWorkoutLaunchState(
      null,
      session.resumed ? "Sesion reanudada." : "Sesion preparada.",
      `/app/workouts/${session.sessionId}`,
      session.resumed,
      parsed.routineTemplateId,
      session.sessionId,
    );
  } catch (error) {
    return createWorkoutLaunchState(
      toActionError(error, "No se ha podido iniciar la sesion."),
      null,
      null,
      false,
      null,
      null,
    );
  }
}

export async function saveWorkoutExerciseBlockAction(
  _previousState: WorkoutExerciseBlockActionState,
  formData: FormData,
): Promise<WorkoutExerciseBlockActionState> {
  try {
    const user = await requireUser();
    const parsed = workoutBlockSchema.parse({
      sessionId: String(formData.get("sessionId") ?? ""),
      exerciseId: String(formData.get("exerciseId") ?? ""),
      setsJson: String(formData.get("setsJson") ?? ""),
    });

    const sets = parseWorkoutSets(parsed.setsJson);

    await saveWorkoutExerciseBlock({
      userId: user.id,
      sessionId: parsed.sessionId,
      exerciseId: parsed.exerciseId,
      sets,
    });

    revalidatePath("/app");
    revalidatePath(`/app/workouts/${parsed.sessionId}`);

    return {
      error: null,
      success: "Bloque guardado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se han podido guardar los sets."),
      success: null,
    };
  }
}

export async function completeWorkoutSessionAction(
  _previousState: WorkoutCompleteActionState,
  formData: FormData,
): Promise<WorkoutCompleteActionState> {
  try {
    const user = await requireUser();
    const parsed = workoutCompleteSchema.parse({
      sessionId: String(formData.get("sessionId") ?? ""),
    });

    await completeWorkoutSession(user.id, parsed.sessionId);

    revalidatePath("/app");
    revalidatePath(`/app/workouts/${parsed.sessionId}`);
    redirect("/app?success=workout-completed");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return createWorkoutCompleteState(
      toActionError(error, "No se ha podido cerrar la sesion."),
      null,
      null,
    );
  }
}

export async function cancelWorkoutSessionAction(
  _previousState: WorkoutCompleteActionState,
  formData: FormData,
): Promise<WorkoutCompleteActionState> {
  try {
    const user = await requireUser();
    const parsed = workoutCompleteSchema.parse({
      sessionId: String(formData.get("sessionId") ?? ""),
    });

    await cancelWorkoutSession(user.id, parsed.sessionId);

    revalidatePath("/app");
    revalidatePath(`/app/workouts/${parsed.sessionId}`);
    redirect("/app?success=workout-cancelled");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return createWorkoutCompleteState(
      toActionError(error, "No se ha podido cancelar la sesion."),
      null,
      null,
    );
  }
}

export async function addRoutineItemAction(
  _previousState: RoutineItemActionState,
  formData: FormData,
): Promise<RoutineItemActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = routineItemAddSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      exerciseId: String(formData.get("exerciseId") ?? ""),
    });

    const [routine] = await db
      .select({
        id: routineTemplates.id,
      })
      .from(routineTemplates)
      .where(
        and(
          eq(routineTemplates.id, parsed.routineTemplateId),
          eq(routineTemplates.ownerUserId, user.id),
        ),
      )
      .limit(1);

    if (!routine) {
      throw new Error("No hemos encontrado esa rutina.");
    }

    const [existingItem] = await db
      .select({
        id: routineTemplateItems.id,
      })
      .from(routineTemplateItems)
      .where(
        and(
          eq(routineTemplateItems.routineTemplateId, parsed.routineTemplateId),
          eq(routineTemplateItems.exerciseId, parsed.exerciseId),
        ),
      )
      .limit(1);

    if (existingItem) {
      throw new Error("Ese ejercicio ya esta dentro de la rutina.");
    }

    const count = await getRoutineItemCount(user.id, parsed.routineTemplateId);

    if (count === null) {
      throw new Error("No hemos encontrado esa rutina.");
    }

    await db.insert(routineTemplateItems).values({
      routineTemplateId: parsed.routineTemplateId,
      exerciseId: parsed.exerciseId,
      sortOrder: count,
      targetSets: 3,
      targetRepsMin: 6,
      targetRepsMax: 10,
      targetRir: 2,
      restSeconds: 90,
      notes: "",
    });

    revalidatePath("/app");
    revalidatePath(`/app/routines/${parsed.routineTemplateId}`);

    return {
      error: null,
      success: "Ejercicio anadido.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido anadir el ejercicio."),
      success: null,
    };
  }
}

export async function updateRoutineItemAction(
  _previousState: RoutineItemActionState,
  formData: FormData,
): Promise<RoutineItemActionState> {
  try {
    const user = await requireUser();
    const parsedBase = routineItemUpdateBaseSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      itemId: String(formData.get("itemId") ?? ""),
      targetSets: formData.get("targetSets"),
      targetRepsMin: formData.get("targetRepsMin"),
      targetRepsMax: formData.get("targetRepsMax"),
      notes: String(formData.get("notes") ?? ""),
    });

    if (parsedBase.targetRepsMax < parsedBase.targetRepsMin) {
      throw new Error("El maximo de repeticiones no puede ser menor que el minimo.");
    }

    const targetRir = parseNullableInt(
      formData.get("targetRir"),
      "El RIR debe estar entre 0 y 5.",
      0,
      5,
    );
    const restSeconds = parseNullableInt(
      formData.get("restSeconds"),
      "El descanso debe estar entre 15 y 600 segundos.",
      15,
      600,
    );

    const db = getDb();
    const item = await findOwnedRoutineItem(
      user.id,
      parsedBase.routineTemplateId,
      parsedBase.itemId,
    );

    if (!item) {
      throw new Error("No hemos encontrado ese bloque.");
    }

    await db
      .update(routineTemplateItems)
      .set({
        targetSets: parsedBase.targetSets,
        targetRepsMin: parsedBase.targetRepsMin,
        targetRepsMax: parsedBase.targetRepsMax,
        targetRir,
        restSeconds,
        notes: parsedBase.notes,
      })
      .where(eq(routineTemplateItems.id, item.id));

    revalidatePath("/app");
    revalidatePath(`/app/routines/${parsedBase.routineTemplateId}`);

    return {
      error: null,
      success: "Bloque actualizado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido actualizar el bloque."),
      success: null,
    };
  }
}

export async function moveRoutineItemAction(
  _previousState: RoutineItemActionState,
  formData: FormData,
): Promise<RoutineItemActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = routineItemMoveSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      itemId: String(formData.get("itemId") ?? ""),
      direction: String(formData.get("direction") ?? ""),
    });

    const pair = await getAdjacentRoutineItem(
      user.id,
      parsed.routineTemplateId,
      parsed.itemId,
      parsed.direction,
    );

    if (!pair) {
      throw new Error("No hemos encontrado ese bloque.");
    }

    if (!pair.target) {
      return {
        error: null,
        success: null,
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(routineTemplateItems)
        .set({
          sortOrder: pair.target!.sortOrder,
        })
        .where(eq(routineTemplateItems.id, pair.current.id));

      await tx
        .update(routineTemplateItems)
        .set({
          sortOrder: pair.current.sortOrder,
        })
        .where(eq(routineTemplateItems.id, pair.target!.id));

      await normalizeRoutineItemSortOrder(tx, parsed.routineTemplateId);
    });

    revalidatePath(`/app/routines/${parsed.routineTemplateId}`);
    revalidatePath("/app");

    return {
      error: null,
      success: "Orden actualizado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido mover el bloque."),
      success: null,
    };
  }
}

export async function deleteRoutineItemAction(
  _previousState: RoutineItemActionState,
  formData: FormData,
): Promise<RoutineItemActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = routineItemDeleteSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      itemId: String(formData.get("itemId") ?? ""),
    });

    const item = await findOwnedRoutineItem(user.id, parsed.routineTemplateId, parsed.itemId);

    if (!item) {
      throw new Error("No hemos encontrado ese bloque.");
    }

    await db.transaction(async (tx) => {
      await tx.delete(routineTemplateItems).where(eq(routineTemplateItems.id, item.id));
      await normalizeRoutineItemSortOrder(tx, parsed.routineTemplateId);
    });

    revalidatePath(`/app/routines/${parsed.routineTemplateId}`);
    revalidatePath("/app");

    return {
      error: null,
      success: "Ejercicio eliminado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido eliminar el ejercicio."),
      success: null,
    };
  }
}

export async function logRunningSessionAction(
  previousState: RunLogActionState,
  formData: FormData,
): Promise<RunLogActionState> {
  try {
    void previousState;
    const user = await requireUser();
    const parsed = runningLogSchema.parse({
      kind: String(formData.get("kind") ?? ""),
      date: String(formData.get("date") ?? ""),
      distanceKm: formData.get("distanceKm") === "" ? undefined : formData.get("distanceKm"),
      durationMinutes:
        formData.get("durationMinutes") === "" ? undefined : formData.get("durationMinutes"),
      notes: String(formData.get("notes") ?? ""),
    });

    const distanceKm =
      parsed.distanceKm === undefined || Number.isNaN(parsed.distanceKm)
        ? null
        : parsed.distanceKm;
    const durationMinutes =
      parsed.durationMinutes === undefined || Number.isNaN(parsed.durationMinutes)
        ? null
        : parsed.durationMinutes;

    if (distanceKm === null && durationMinutes === null) {
      throw new Error("Anade al menos distancia o duracion para guardar la carrera.");
    }

    await createRunningSession(user.id, {
      kind: parsed.kind,
      date: parsed.date,
      distanceKm,
      durationMinutes,
      notes: parsed.notes,
    });

    revalidatePath("/app");
    revalidatePath("/app/history");
    revalidatePath("/app/progress");

    return {
      error: null,
      success: "Carrera guardada.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido guardar la carrera."),
      success: null,
    };
  }
}

export async function updateRunningSessionAction(
  previousState: RunLogActionState,
  formData: FormData,
): Promise<RunLogActionState> {
  try {
    void previousState;
    const user = await requireUser();
    const parsed = runningUpdateSchema.parse({
      sessionId: String(formData.get("sessionId") ?? ""),
      kind: String(formData.get("kind") ?? ""),
      date: String(formData.get("date") ?? ""),
      distanceKm: formData.get("distanceKm") === "" ? undefined : formData.get("distanceKm"),
      durationMinutes:
        formData.get("durationMinutes") === "" ? undefined : formData.get("durationMinutes"),
      notes: String(formData.get("notes") ?? ""),
    });

    const distanceKm =
      parsed.distanceKm === undefined || Number.isNaN(parsed.distanceKm)
        ? null
        : parsed.distanceKm;
    const durationMinutes =
      parsed.durationMinutes === undefined || Number.isNaN(parsed.durationMinutes)
        ? null
        : parsed.durationMinutes;

    await updateRunningSession(user.id, parsed.sessionId, {
      kind: parsed.kind,
      date: parsed.date,
      distanceKm,
      durationMinutes,
      notes: parsed.notes,
    });

    revalidatePath("/app");
    revalidatePath("/app/history");
    revalidatePath(`/app/history/runs/${parsed.sessionId}`);
    revalidatePath("/app/progress");

    return {
      error: null,
      success: "Carrera actualizada.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido actualizar la carrera."),
      success: null,
    };
  }
}

export async function createCustomExerciseAction(
  _previousState: ExerciseActionState,
  formData: FormData,
): Promise<ExerciseActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = customExerciseSchema.parse({
      name: String(formData.get("name") ?? ""),
      primaryMuscleGroup: String(formData.get("primaryMuscleGroup") ?? ""),
      equipment: String(formData.get("equipment") ?? ""),
      description: String(formData.get("description") ?? ""),
    });

    const [existingExercise] = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(and(eq(exercises.ownerUserId, user.id), eq(exercises.name, parsed.name)))
      .limit(1);

    if (existingExercise) {
      throw new Error("Ya tienes un ejercicio con ese nombre.");
    }

    await db.insert(exercises).values({
      ownerUserId: user.id,
      categoryId: null,
      name: parsed.name,
      description: parsed.description,
      primaryMuscleGroup: parsed.primaryMuscleGroup,
      equipment: parsed.equipment,
      tags: [],
      isSystem: false,
    });

    revalidatePath("/app");
    revalidatePath("/app/routines");

    return {
      error: null,
      success: "Ejercicio personalizado creado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido crear el ejercicio."),
      success: null,
    };
  }
}

export async function createScheduleEntryAction(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = scheduleEntrySchema.parse({
      entryType: String(formData.get("entryType") ?? ""),
      scheduledDate: String(formData.get("scheduledDate") ?? ""),
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
      runningKind: String(formData.get("runningKind") ?? runningKindEnum.enumValues[5]),
      runningTargetKm:
        formData.get("runningTargetKm") === "" ? undefined : formData.get("runningTargetKm"),
      title: String(formData.get("title") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });

    if (parsed.entryType === "gym") {
      if (!parsed.routineTemplateId) {
        throw new Error("Selecciona una rutina para planificar el gym.");
      }

      const [routine] = await db
        .select({
          id: routineTemplates.id,
          name: routineTemplates.name,
        })
        .from(routineTemplates)
        .where(
          and(
            eq(routineTemplates.id, parsed.routineTemplateId),
            eq(routineTemplates.ownerUserId, user.id),
          ),
        )
        .limit(1);

      if (!routine) {
        throw new Error("No hemos encontrado esa rutina.");
      }

      await db.insert(trainingScheduleEntries).values({
        userId: user.id,
        entryType: "gym",
        scheduledDate: parsed.scheduledDate,
        routineTemplateId: routine.id,
        title: routine.name,
        notes: parsed.notes,
      });
    } else {
      const runningTargetKm =
        parsed.runningTargetKm === undefined || Number.isNaN(parsed.runningTargetKm)
          ? null
          : parsed.runningTargetKm;

      await db.insert(trainingScheduleEntries).values({
        userId: user.id,
        entryType: "running",
        scheduledDate: parsed.scheduledDate,
        title: parsed.title || "Running",
        runningKind: parsed.runningKind ?? "free",
        runningTargetKm,
        notes: parsed.notes,
      });
    }

    revalidatePath("/app");

    return {
      error: null,
      success: "Entreno planificado.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido planificar el entreno."),
      success: null,
    };
  }
}

export async function deleteScheduleEntryAction(
  _previousState: ScheduleActionState,
  formData: FormData,
): Promise<ScheduleActionState> {
  try {
    const user = await requireUser();
    const db = getDb();
    const parsed = scheduleDeleteSchema.parse({
      entryId: String(formData.get("entryId") ?? ""),
    });

    const [entry] = await db
      .select({ id: trainingScheduleEntries.id })
      .from(trainingScheduleEntries)
      .where(
        and(
          eq(trainingScheduleEntries.id, parsed.entryId),
          eq(trainingScheduleEntries.userId, user.id),
        ),
      )
      .limit(1);

    if (!entry) {
      throw new Error("No hemos encontrado esa planificacion.");
    }

    await db.delete(trainingScheduleEntries).where(eq(trainingScheduleEntries.id, entry.id));

    revalidatePath("/app");

    return {
      error: null,
      success: "Planificacion eliminada.",
    };
  } catch (error) {
    return {
      error: toActionError(error, "No se ha podido eliminar la planificacion."),
      success: null,
    };
  }
}
