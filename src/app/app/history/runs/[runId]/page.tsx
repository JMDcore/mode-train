import { notFound } from "next/navigation";

import { RunHistoryDetailView } from "@/components/training/run-history-detail";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getRunningHistoryDetail } from "@/server/training/history";

export default async function RunningHistoryPage(props: {
  params: Promise<{
    runId: string;
  }>;
}) {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const params = await props.params;
  const detail = await getRunningHistoryDetail(user.id, params.runId);

  if (!detail) {
    notFound();
  }

  return <RunHistoryDetailView detail={detail} />;
}
