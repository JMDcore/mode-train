"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { createRoutineAction } from "@/server/training/actions";
import type { RoutineActionState } from "@/server/training/types";

const initialState: RoutineActionState = {
  error: null,
  success: null,
  nextPath: null,
  routineId: null,
};

export function QuickRoutineForm() {
  const [state, formAction] = useActionState(createRoutineAction, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    if (state.nextPath) {
      router.push(state.nextPath);
      return;
    }

    router.refresh();
  }, [router, state.nextPath, state.success]);

  return (
    <form ref={formRef} action={formAction} className="quick-routine-form">
      <div className="quick-routine-form__row">
        <input
          type="text"
          name="name"
          placeholder="Torso, Pierna, Push..."
          required
        />
        <button type="submit" className="quick-routine-form__submit" aria-label="Crear rutina">
          <Plus size={16} strokeWidth={2.4} />
        </button>
      </div>

      {state.error ? <p className="quick-routine-form__error">{state.error}</p> : null}
      {state.success ? <p className="quick-routine-form__success">{state.success}</p> : null}
    </form>
  );
}
