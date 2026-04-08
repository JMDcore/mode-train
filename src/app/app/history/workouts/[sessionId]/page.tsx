import { notFound } from "next/navigation";

import { WorkoutHistoryDetailView } from "@/components/training/workout-history-detail";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getWorkoutHistoryDetail } from "@/server/training/history";

export default async function WorkoutHistoryPage(props: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const params = await props.params;
  const detail = await getWorkoutHistoryDetail(user.id, params.sessionId);

  if (!detail) {
    notFound();
  }

  return <WorkoutHistoryDetailView detail={detail} />;
}
