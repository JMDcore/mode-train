import { notFound } from "next/navigation";

import { RoutineEditor } from "@/components/training/routine-editor";
import { requireUser } from "@/server/auth/session";
import { requireCompleteProfile } from "@/server/profile";
import { getRoutineEditorData } from "@/server/training/routines";

export default async function RoutineEditorPage(props: {
  params: Promise<{
    routineId: string;
  }>;
}) {
  const user = await requireUser();
  await requireCompleteProfile(user.id);
  const params = await props.params;
  const data = await getRoutineEditorData(user.id, params.routineId);

  if (!data) {
    notFound();
  }

  return <RoutineEditor data={data} />;
}
