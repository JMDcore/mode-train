"use client";

import { Footprints } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { logRunningSessionAction } from "@/server/training/actions";
import type { RunLogActionState } from "@/server/training/types";

const initialState: RunLogActionState = {
  error: null,
  success: null,
};

const runOptions = [
  { value: "easy", label: "Rodaje suave" },
  { value: "tempo", label: "Tempo" },
  { value: "intervals", label: "Series" },
  { value: "long_run", label: "Tirada larga" },
  { value: "recovery", label: "Recuperacion" },
  { value: "free", label: "Libre" },
];

export function QuickRunForm() {
  const [state, formAction] = useActionState(logRunningSessionAction, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="quick-run-form">
      <div className="quick-run-form__grid">
        <label className="quick-run-form__field">
          <span>Tipo</span>
          <select name="kind" defaultValue="easy" required>
            {runOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="quick-run-form__field">
          <span>Km</span>
          <input type="number" name="distanceKm" min="0.5" max="120" step="0.1" placeholder="5.0" required />
        </label>

        <label className="quick-run-form__field">
          <span>Min</span>
          <input type="number" name="durationMinutes" min="5" max="600" step="1" placeholder="30" required />
        </label>
      </div>

      <button type="submit" className="quick-run-form__submit">
        <Footprints size={15} strokeWidth={2.3} />
        Guardar carrera
      </button>

      {state.error ? <p className="quick-run-form__error">{state.error}</p> : null}
      {state.success ? <p className="quick-run-form__success">{state.success}</p> : null}
    </form>
  );
}
