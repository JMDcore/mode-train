"use client";

import {
  ArrowLeft,
  Check,
  Clock3,
  LoaderCircle,
  Plus,
  Save,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  completeWorkoutSessionAction,
  saveWorkoutExerciseBlockAction,
} from "@/server/training/actions";
import type { WorkoutSessionDetail } from "@/server/training/workouts";
import type {
  WorkoutCompleteActionState,
  WorkoutExerciseBlockActionState,
} from "@/server/training/types";

type SetDraft = {
  id: string;
  weightKg: string;
  reps: string;
  rir: string;
};

const initialBlockState: WorkoutExerciseBlockActionState = {
  error: null,
  success: null,
};

const initialCompleteState: WorkoutCompleteActionState = {
  error: null,
  success: null,
  nextPath: null,
};

function createSetDraft(index: number, input?: WorkoutSessionDetail["exercises"][number]["currentSets"][number]): SetDraft {
  return {
    id: `${index}-${input?.setNumber ?? index + 1}`,
    weightKg: input?.weightKg !== null && input?.weightKg !== undefined ? `${input.weightKg}` : "",
    reps: input?.reps !== null && input?.reps !== undefined ? `${input.reps}` : "",
    rir: input?.rir !== null && input?.rir !== undefined ? `${input.rir}` : "",
  };
}

function buildInitialSetDrafts(exercise: WorkoutSessionDetail["exercises"][number]) {
  const baseCount = Math.max(exercise.targetSets, exercise.currentSets.length, 1);

  return Array.from({ length: baseCount }, (_, index) =>
    createSetDraft(index, exercise.currentSets[index]),
  );
}

export function WorkoutSession(props: {
  detail: WorkoutSessionDetail;
}) {
  return (
    <main className="detail-page">
      <div className="detail-shell">
        <div className="detail-topbar">
          <Link href="/app" className="detail-back">
            <ArrowLeft size={16} strokeWidth={2.2} />
            Volver
          </Link>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="detail-hero"
        >
          <div className="detail-hero__copy">
            <p className="detail-kicker">Sesion activa</p>
            <h1>{props.detail.routineName}</h1>
            <p>
              Empezaste el {props.detail.startedAtLabel}. Guarda cada bloque para no perder progreso.
            </p>
          </div>

          <div className="detail-hero__stats">
            <div className="detail-stat">
              <span>Sets</span>
              <strong>{props.detail.savedSets}</strong>
            </div>
            <div className="detail-stat">
              <span>Ejercicios</span>
              <strong>
                {props.detail.completedExercises}/{props.detail.totalExercises}
              </strong>
            </div>
          </div>
        </motion.section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Target size={16} strokeWidth={2.2} />
              Ejercicios
            </span>
            <span>{props.detail.totalExercises}</span>
          </div>

          <div className="detail-stack">
            {props.detail.exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={`${exercise.routineItemId}-${exercise.currentSets.map((set) => `${set.setNumber}:${set.weightKg ?? ""}:${set.reps ?? ""}:${set.rir ?? ""}`).join("|")}`}
                exercise={exercise}
                sessionId={props.detail.sessionId}
              />
            ))}
          </div>
        </section>

        <CompleteWorkoutCard sessionId={props.detail.sessionId} />
      </div>
    </main>
  );
}

function WorkoutExerciseCard(props: {
  sessionId: string;
  exercise: WorkoutSessionDetail["exercises"][number];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(saveWorkoutExerciseBlockAction, initialBlockState);
  const [sets, setSets] = useState<SetDraft[]>(() => buildInitialSetDrafts(props.exercise));

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  const setsJson = useMemo(
    () =>
      JSON.stringify(
        sets.map((set) => ({
          weightKg: set.weightKg,
          reps: set.reps,
          rir: set.rir,
        })),
      ),
    [sets],
  );

  return (
    <article className="session-card">
      <div className="session-card__head">
        <div>
          <h2>{props.exercise.exerciseName}</h2>
          <p>
            {props.exercise.primaryMuscleGroup} · {props.exercise.equipment}
          </p>
        </div>
        <span className="detail-badge">
          <Trophy size={14} strokeWidth={2.3} />
          {props.exercise.currentSets.length > 0 ? `${props.exercise.currentSets.length} guardados` : "Pendiente"}
        </span>
      </div>

      <div className="session-meta-row">
        <span>
          Objetivo {props.exercise.targetSets} x {props.exercise.targetRepsMin}-{props.exercise.targetRepsMax}
        </span>
        <span>
          <Clock3 size={14} strokeWidth={2.2} />
          {props.exercise.restSeconds ?? 0}s
        </span>
        {props.exercise.targetRir !== null ? <span>RIR {props.exercise.targetRir}</span> : null}
      </div>

      {props.exercise.lastPerformanceSummary ? (
        <div className="session-note">
          <strong>Ultimo registro</strong>
          <span>{props.exercise.lastPerformanceSummary}</span>
        </div>
      ) : null}

      <form action={formAction} className="session-form">
        <input type="hidden" name="sessionId" value={props.sessionId} />
        <input type="hidden" name="exerciseId" value={props.exercise.exerciseId} />
        <input type="hidden" name="setsJson" value={setsJson} />

        <div className="session-sets">
          {sets.map((set, index) => (
            <div key={set.id} className="set-row">
              <span className="set-row__label">Set {index + 1}</span>

              <label className="set-row__field">
                <span>Kg</span>
                <input
                  type="number"
                  min="0"
                  max="600"
                  step="0.5"
                  value={set.weightKg}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSets((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, weightKg: next } : entry,
                      ),
                    );
                  }}
                />
              </label>

              <label className="set-row__field">
                <span>Reps</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={set.reps}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSets((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, reps: next } : entry,
                      ),
                    );
                  }}
                />
              </label>

              <label className="set-row__field">
                <span>RIR</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={set.rir}
                  onChange={(event) => {
                    const next = event.target.value;
                    setSets((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, rir: next } : entry,
                      ),
                    );
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        <div className="session-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              setSets((current) => [...current, createSetDraft(current.length)])
            }
          >
            <Plus size={15} strokeWidth={2.3} />
            Anadir set
          </button>

          <button
            type="button"
            className="ghost-button"
            disabled={sets.length <= 1}
            onClick={() =>
              setSets((current) => (current.length > 1 ? current.slice(0, -1) : current))
            }
          >
            <X size={15} strokeWidth={2.3} />
            Quitar ultimo
          </button>

          <SaveBlockButton />
        </div>
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </article>
  );
}

function SaveBlockButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="secondary-button" disabled={pending}>
      {pending ? (
        <LoaderCircle size={15} strokeWidth={2.3} className="spin-icon" />
      ) : (
        <Save size={15} strokeWidth={2.3} />
      )}
      {pending ? "Guardando..." : "Guardar bloque"}
    </button>
  );
}

function CompleteWorkoutCard(props: { sessionId: string }) {
  const [state, formAction] = useActionState(completeWorkoutSessionAction, initialCompleteState);

  return (
    <section className="detail-card detail-card--surface">
      <div className="detail-card__head">
        <div>
          <p className="detail-kicker">Cerrar sesion</p>
          <h2>Terminar entrenamiento</h2>
        </div>
        <span className="detail-badge">
          <Check size={14} strokeWidth={2.3} />
          Listo
        </span>
      </div>

      <p className="detail-body-copy">
        Cuando cierres la sesion, el panel principal reflejara tu actividad reciente y progreso.
      </p>

      <form action={formAction}>
        <input type="hidden" name="sessionId" value={props.sessionId} />
        <CompleteWorkoutButton />
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </section>
  );
}

function CompleteWorkoutButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="primary-button primary-button--block" disabled={pending}>
      {pending ? (
        <LoaderCircle size={16} strokeWidth={2.3} className="spin-icon" />
      ) : (
        <Check size={16} strokeWidth={2.3} />
      )}
      {pending ? "Cerrando..." : "Completar sesion"}
    </button>
  );
}
