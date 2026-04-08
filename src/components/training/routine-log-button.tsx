"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { logRoutineSessionAction } from "@/server/training/actions";
import type { WorkoutLogActionState } from "@/server/training/types";

const initialState: WorkoutLogActionState = {
  error: null,
  success: null,
};

export function RoutineLogButton(props: { routineTemplateId: string }) {
  const [state, formAction] = useActionState(logRoutineSessionAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="inline-action-form">
      <input type="hidden" name="routineTemplateId" value={props.routineTemplateId} />
      <SubmitButton />
      {state.error ? <p className="inline-action-form__error">{state.error}</p> : null}
      {state.success ? <p className="inline-action-form__success">{state.success}</p> : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="inline-action" disabled={pending}>
      <Check size={15} strokeWidth={2.3} />
      {pending ? "Guardando..." : "Registrar sesion"}
    </button>
  );
}
