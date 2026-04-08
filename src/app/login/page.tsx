import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";
import { getAuthenticatedRedirectPath, getUserProfile } from "@/server/profile";

export default async function LoginPage() {
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
          action={loginAction}
          mode="login"
          title="Bienvenido"
          subtitle="Accede a tu espacio y sigue construyendo tu sistema de entrenamiento."
        />
      </div>
    </main>
  );
}
