import { redirect } from "next/navigation";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { requireUser } from "@/server/auth/session";
import { getAuthenticatedRedirectPath, getUserProfile } from "@/server/profile";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  if (!profile) {
    redirect("/login");
  }

  const destination = getAuthenticatedRedirectPath(profile);

  if (destination === "/app") {
    redirect("/app");
  }

  return (
    <main className="auth-page">
      <div className="auth-page__shell">
        <OnboardingCard profile={profile} />
      </div>
    </main>
  );
}
