import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { buildInitials } from "@/server/auth/user";
import { getDb } from "@/server/db";
import { appUsers, profiles } from "@/server/db/schema";

export type UserProfile = {
  userId: string;
  email: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
  goal: string;
  experienceLevel: string;
  heightCm: number | null;
  weightKg: number | null;
  preferredWeeklySessions: number | null;
  initials: string;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getDb();

  const [record] = await db
    .select({
      userId: profiles.userId,
      email: appUsers.email,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarPath: profiles.avatarPath,
      goal: profiles.goal,
      experienceLevel: profiles.experienceLevel,
      heightCm: profiles.heightCm,
      weightKg: profiles.weightKg,
      preferredWeeklySessions: profiles.preferredWeeklySessions,
    })
    .from(profiles)
    .innerJoin(appUsers, eq(appUsers.id, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    ...record,
    initials: buildInitials(record.displayName),
  };
}

export function isProfileComplete(profile: Pick<
  UserProfile,
  "goal" | "experienceLevel" | "preferredWeeklySessions"
>) {
  return Boolean(
    profile.goal.trim() &&
      profile.experienceLevel.trim() &&
      (profile.preferredWeeklySessions ?? 0) > 0,
  );
}

export function getAuthenticatedRedirectPath(profile: Pick<
  UserProfile,
  "goal" | "experienceLevel" | "preferredWeeklySessions"
>) {
  return isProfileComplete(profile) ? "/app" : "/onboarding";
}

export async function requireCompleteProfile(userId: string) {
  const profile = await getUserProfile(userId);

  if (!profile) {
    redirect("/login");
  }

  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  return profile;
}
