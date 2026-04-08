import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/server/auth/session";
import { registerAction } from "@/server/auth/actions";
import { getAuthenticatedRedirectPath, getUserProfile } from "@/server/profile";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getUserProfile(user.id);

    if (!profile) {
      redirect("/login");
    }

    redirect(getAuthenticatedRedirectPath(profile));
  }

  return (
    <main className="auth-page">
      <div className="auth-page__shell">
        <AuthCard
          action={registerAction}
          mode="register"
          title="Crea tu cuenta"
          eyebrow="Nuevo acceso"
          subtitle="Monta una base propia, privada y lista para registrar progreso serio desde el primer dia."
        />
      </div>
    </main>
  );
}
