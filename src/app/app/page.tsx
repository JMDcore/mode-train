import { redirect } from "next/navigation";

import { ModeTrainApp } from "@/components/app-shell/mode-train-app";
import { getAppSnapshot } from "@/server/app/snapshot";
import { requireUser } from "@/server/auth/session";
import { getUserProfile, isProfileComplete } from "@/server/profile";

export default async function ProtectedAppPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

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

  return <ModeTrainApp user={user} profile={profile} snapshot={snapshot} />;
}
