import { redirect } from "next/navigation";

import { ModeTrainApp } from "@/components/app-shell/mode-train-app";
import { getAppSnapshot } from "@/server/app/snapshot";
import { requireUser } from "@/server/auth/session";
import { getUserProfile, isProfileComplete } from "@/server/profile";

export default async function ProtectedAppPage(props: {
  searchParams?: Promise<{
    success?: string;
  }>;
}) {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  if (!profile) {
    redirect("/login");
  }

  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  const snapshot = await getAppSnapshot({
    user,
    profile,
  });

  return (
    <ModeTrainApp
      user={user}
      profile={profile}
      snapshot={snapshot}
      completionMessage={(() => {
        if (searchParams?.success === "workout-completed") {
          return "Sesion completada y guardada.";
        }

        if (searchParams?.success === "workout-cancelled") {
          return "Sesion cancelada.";
        }

        return null;
      })()}
    />
  );
}
