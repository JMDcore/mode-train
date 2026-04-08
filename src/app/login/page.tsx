import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { loginAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
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
