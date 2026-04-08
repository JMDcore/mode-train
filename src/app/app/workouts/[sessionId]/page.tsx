import { notFound } from "next/navigation";

import { WorkoutSession } from "@/components/training/workout-session";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getWorkoutSessionDetail } from "@/server/training/workouts";

export default async function WorkoutSessionPage(props: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const params = await props.params;
  const detail = await getWorkoutSessionDetail(user.id, params.sessionId);

  if (!detail) {
    notFound();
  }

  return <WorkoutSession detail={detail} />;
}
