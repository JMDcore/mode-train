"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { generateStarterWeekAction } from "@/server/training/actions";
import type { StarterPlanActionState } from "@/server/training/types";

const initialState: StarterPlanActionState = {
  error: null,
  success: null,
};

export function StarterWeekButton(props: {
  className?: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(generateStarterWeekAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction} className="starter-week">
      <SubmitButton className={props.className} compact={props.compact} />
      {state.error ? <p className="starter-week__error">{state.error}</p> : null}
      {state.success ? <p className="starter-week__success">{state.success}</p> : null}
    </form>
  );
}

function SubmitButton(props: {
  className?: string;
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={
        props.compact
          ? "starter-week__button starter-week__button--compact"
          : props.className ?? "primary-button"
      }
      disabled={pending}
    >
      <Sparkles size={16} strokeWidth={2.3} />
      {pending ? "Building..." : "Build week"}
    </button>
  );
}
