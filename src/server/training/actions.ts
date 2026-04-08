"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db";
import { routineTemplates } from "@/server/db/schema";
import { getUserProfile, isProfileComplete } from "@/server/profile";
import { createStarterWeek } from "@/server/training/starter-plan";
import type {
  RoutineActionState,
  StarterPlanActionState,
} from "@/server/training/types";

const routineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ponle un nombre a la rutina.")
    .max(80, "El nombre es demasiado largo."),
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
