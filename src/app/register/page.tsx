import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/server/auth/session";
import { registerAction } from "@/server/auth/actions";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="auth-page">
      <div className="auth-page__shell">
        <AuthCard
          action={registerAction}
          mode="register"
          title="Crea tu cuenta"
          subtitle="Una base propia, privada y pensada para entrenar sin friccion."
        />
      </div>
    </main>
  );
}
