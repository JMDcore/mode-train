"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import {
  routineTemplates,
  runningKindEnum,
  runningSessions,
  workoutSessions,
} from "@/server/db/schema";
import { getUserProfile, isProfileComplete } from "@/server/profile";
import { createStarterWeek } from "@/server/training/starter-plan";
import type {
  RunLogActionState,
  RoutineActionState,
  StarterPlanActionState,
  WorkoutLogActionState,
} from "@/server/training/types";

const routineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ponle un nombre a la rutina.")
    .max(80, "El nombre es demasiado largo."),
});

const routineLogSchema = z.object({
  routineTemplateId: z.string().uuid("La rutina seleccionada no es valida."),
});

const runningLogSchema = z.object({
  kind: z.enum(runningKindEnum.enumValues),
  distanceKm: z.coerce
    .number()
    .min(0.5, "La distancia debe ser mayor de 0.5 km.")
    .max(120, "La distancia parece incorrecta."),
  durationMinutes: z.coerce
    .number()
    .int("La duracion debe ser un numero entero.")
    .min(5, "La duracion minima es de 5 minutos.")
    .max(600, "La duracion parece incorrecta."),
});

function toActionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Revisa el nombre de la rutina.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se ha podido crear la rutina.";
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

    await db.insert(routineTemplates).values({
      ownerUserId: user.id,
      name: parsed.name,
    });

    revalidatePath("/app");

    return {
      error: null,
      success: "Rutina creada.",
    };
  } catch (error) {
    return {
      error: toActionError(error),
      success: null,
    };
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
      error: toActionError(error),
      success: null,
    };
  }
}

export async function logRoutineSessionAction(
  previousState: WorkoutLogActionState,
  formData: FormData,
): Promise<WorkoutLogActionState> {
  try {
    void previousState;
    const user = await requireUser();
    const db = getDb();
    const parsed = routineLogSchema.parse({
      routineTemplateId: String(formData.get("routineTemplateId") ?? ""),
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
      return {
        error: "No hemos encontrado esa rutina en tu cuenta.",
        success: null,
      };
    }

    const now = new Date();

    await db.insert(workoutSessions).values({
      userId: user.id,
      routineTemplateId: routine.id,
      startedAt: now,
      finishedAt: now,
      notes: "Registro rapido",
    });

    revalidatePath("/app");

    return {
      error: null,
      success: "Sesion guardada.",
    };
  } catch (error) {
    return {
      error: toActionError(error),
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
    const db = getDb();
    const parsed = runningLogSchema.parse({
      kind: String(formData.get("kind") ?? ""),
      distanceKm: formData.get("distanceKm"),
      durationMinutes: formData.get("durationMinutes"),
    });

    const durationSeconds = parsed.durationMinutes * 60;
    const averagePaceSeconds = Math.round(durationSeconds / parsed.distanceKm);

    await db.insert(runningSessions).values({
      userId: user.id,
      kind: parsed.kind,
      date: new Date(),
      distanceKm: parsed.distanceKm,
      durationSeconds,
      averagePaceSeconds,
      notes: "Registro rapido",
    });

    revalidatePath("/app");

    return {
      error: null,
      success: "Carrera guardada.",
    };
  } catch (error) {
    return {
      error: toActionError(error),
      success: null,
    };
  }
}
