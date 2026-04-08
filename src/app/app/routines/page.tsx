import { RoutinesHub } from "@/components/training/routines-hub";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getRoutinesHubData } from "@/server/training/routines";

export default async function RoutinesPage() {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const data = await getRoutinesHubData(user.id);

  return <RoutinesHub data={data} />;
}
