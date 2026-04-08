"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import {
  createUser,
  findUserByEmail,
  normalizeDisplayName,
  normalizeEmail,
  verifyUserCredentials,
} from "@/server/auth/user";

export type AuthActionState = {
  error: string | null;
};

const loginSchema = z.object({
  email: z.email("Introduce un email valido."),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .max(72, "La contrasena es demasiado larga."),
});

const registerSchema = loginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(40, "El nombre es demasiado largo."),
});

function toActionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Revisa los datos del formulario.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "Ese email ya esta en uso.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = loginSchema.parse({
      email: normalizeEmail(String(formData.get("email") ?? "")),
      password: String(formData.get("password") ?? ""),
    });

    const user = await verifyUserCredentials(parsed);

    if (!user) {
      return { error: "Email o contrasena incorrectos." };
    }

    await createSession(user.id);
  } catch (error) {
    return { error: toActionError(error) };
  }

  redirect("/app");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = registerSchema.parse({
      displayName: normalizeDisplayName(String(formData.get("displayName") ?? "")),
      email: normalizeEmail(String(formData.get("email") ?? "")),
      password: String(formData.get("password") ?? ""),
    });

    const existingUser = await findUserByEmail(parsed.email);

    if (existingUser) {
      return { error: "Ese email ya esta en uso." };
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser({
      displayName: parsed.displayName,
      email: parsed.email,
      passwordHash,
    });

    await createSession(user.id);
  } catch (error) {
    return { error: toActionError(error) };
  }

  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
