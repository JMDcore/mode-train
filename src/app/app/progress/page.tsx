import { ProgressOverviewView } from "@/components/training/progress-overview";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getProgressOverview } from "@/server/training/progress";

export default async function ProgressPage() {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const overview = await getProgressOverview(user.id);

  return <ProgressOverviewView overview={overview} />;
}
