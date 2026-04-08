import { ModeTrainApp } from "@/components/app-shell/mode-train-app";
import { requireUser } from "@/server/auth/session";

export default async function ProtectedAppPage() {
  const user = await requireUser();

  return <ModeTrainApp user={user} />;
}
