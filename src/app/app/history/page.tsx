import { HistoryOverviewView } from "@/components/training/history-overview";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getHistoryOverview } from "@/server/training/history";

export default async function HistoryPage() {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const overview = await getHistoryOverview(user.id);

  return <HistoryOverviewView overview={overview} />;
}
