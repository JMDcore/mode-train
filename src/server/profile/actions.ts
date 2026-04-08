"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { normalizeDisplayName } from "@/server/auth/user";
import { getDb } from "@/server/db";
import { profiles } from "@/server/db/schema";
import type { ProfileActionState } from "@/server/profile/types";

const onboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Tu nombre debe tener al menos 2 caracteres.")
    .max(40, "Tu nombre es demasiado largo."),
  goal: z
    .string()
    .trim()
    .min(2, "Selecciona un objetivo principal.")
    .max(80, "El objetivo es demasiado largo."),
  experienceLevel: z
    .string()
    .trim()
    .min(2, "Selecciona tu nivel de experiencia.")
    .max(40, "El nivel es demasiado largo."),
  preferredWeeklySessions: z.coerce
    .number()
    .int("Debe ser un numero entero.")
    .min(1, "Debes entrenar al menos 1 vez por semana.")
    .max(14, "El numero es demasiado alto."),
  heightCm: z.coerce
    .number()
    .int("La altura debe ser un numero entero.")
    .min(100, "La altura parece incorrecta.")
    .max(250, "La altura parece incorrecta.")
    .nullable(),
  weightKg: z.coerce
    .number()
    .min(30, "El peso parece incorrecto.")
    .max(300, "El peso parece incorrecto.")
    .nullable(),
});

function nullableNumber(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();

  return stringValue === "" ? null : Number(stringValue);
}

function toActionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Revisa los datos del formulario.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
}

export async function completeOnboardingAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireUser();
    const db = getDb();

    const parsed = onboardingSchema.parse({
      displayName: normalizeDisplayName(String(formData.get("displayName") ?? "")),
      goal: String(formData.get("goal") ?? "").trim(),
      experienceLevel: String(formData.get("experienceLevel") ?? "").trim(),
      preferredWeeklySessions: formData.get("preferredWeeklySessions"),
      heightCm: nullableNumber(formData.get("heightCm")),
      weightKg: nullableNumber(formData.get("weightKg")),
    });

    await db
      .update(profiles)
      .set({
        displayName: parsed.displayName,
        goal: parsed.goal,
        experienceLevel: parsed.experienceLevel,
        preferredWeeklySessions: parsed.preferredWeeklySessions,
        heightCm: parsed.heightCm,
        weightKg: parsed.weightKg,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    revalidatePath("/app");
    revalidatePath("/onboarding");
    redirect("/app");
  } catch (error) {
    return {
      error: toActionError(error),
    };
  }
}
