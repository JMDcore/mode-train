import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getAuthenticatedRedirectPath, getUserProfile } from "@/server/profile";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile(user.id);

  if (!profile) {
    redirect("/login");
  }

  redirect(getAuthenticatedRedirectPath(profile));
}
