"use client";

import { LoaderCircle, Play, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { startWorkoutSessionAction } from "@/server/training/actions";
import type { WorkoutLaunchActionState } from "@/server/training/types";

const initialState: WorkoutLaunchActionState = {
  error: null,
  success: null,
  nextPath: null,
  resumed: false,
  routineId: null,
  sessionId: null,
};

export function StartWorkoutButton(props: {
  routineTemplateId: string;
  sessionDate?: string;
  label?: string;
  className?: string;
  compact?: boolean;
  resume?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(startWorkoutSessionAction, initialState);

  useEffect(() => {
    if (!state.nextPath) {
      return;
    }

    router.push(state.nextPath);
    router.refresh();
  }, [router, state.nextPath]);

  return (
    <form action={formAction} className="inline-action-form">
      <input type="hidden" name="routineTemplateId" value={props.routineTemplateId} />
      {props.sessionDate ? <input type="hidden" name="sessionDate" value={props.sessionDate} /> : null}
      <StartWorkoutSubmit
        className={props.className}
        compact={props.compact}
        label={props.label}
        resume={props.resume}
      />
      {state.error ? <p className="inline-form-feedback inline-form-feedback--error">{state.error}</p> : null}
    </form>
  );
}

function StartWorkoutSubmit(props: {
  label?: string;
  className?: string;
  compact?: boolean;
  resume?: boolean;
}) {
  const { pending } = useFormStatus();
  const Icon = pending ? LoaderCircle : props.resume ? RotateCw : Play;

  return (
    <button
      type="submit"
      className={props.className ?? (props.compact ? "secondary-button" : "primary-button")}
      disabled={pending}
    >
      <Icon
        size={props.compact ? 15 : 16}
        strokeWidth={2.3}
        className={pending ? "spin-icon" : undefined}
      />
      {pending
        ? "Abriendo..."
        : props.label ?? (props.resume ? "Reanudar" : "Iniciar sesion")}
    </button>
  );
}
