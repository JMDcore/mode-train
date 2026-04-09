"use client";

import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Clock3,
  Dumbbell,
  Grip,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import {
  addRoutineItemAction,
  deleteRoutineItemAction,
  moveRoutineItemAction,
  updateRoutineVisualAction,
  updateRoutineItemAction,
} from "@/server/training/actions";
import { AnatomyFocusArt } from "@/components/visuals/anatomy-focus-art";
import { trainingFocusOptions } from "@/lib/training-visuals";
import type { RoutineEditorData, RoutineItemDetail } from "@/server/training/routines";
import type { RoutineItemActionState } from "@/server/training/types";

const initialState: RoutineItemActionState = {
  error: null,
  success: null,
};

export function RoutineEditor(props: {
  data: RoutineEditorData;
}) {
  const usedExerciseIds = new Set(props.data.items.map((item) => item.exerciseId));
  const availableExercises = props.data.availableExercises.filter(
    (exercise) => !usedExerciseIds.has(exercise.id),
  );

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
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="detail-hero"
        >
          <div className="routines-hero__art" aria-hidden="true">
            <AnatomyFocusArt
              focus={props.data.routine.focusKey}
              frame="focus"
              className="routines-hero__image"
            />
          </div>
          <div className="routines-hero__veil" aria-hidden="true" />

          <div className="detail-hero__copy">
            <p className="detail-kicker">Rutina</p>
            <h1>{props.data.routine.name}</h1>
            <p>
              {props.data.items.length > 0
                ? `${props.data.items.length} ejercicios listos para entrenar.`
                : "Empieza con uno o dos ejercicios base y ajusta lo esencial."}
            </p>
          </div>

          <div className="detail-hero__stats">
            <div className="detail-stat">
              <span>Ejercicios</span>
              <strong>{props.data.items.length}</strong>
            </div>
            <div className="detail-stat">
              <span>Actualizada</span>
              <strong>
                {new Intl.DateTimeFormat("es-ES", {
                  day: "numeric",
                  month: "short",
                }).format(props.data.routine.updatedAt)}
              </strong>
            </div>
            <div className="detail-stat">
              <span>Visual</span>
              <strong>{props.data.routine.focusLabel}</strong>
            </div>
          </div>
        </motion.section>

        <RoutineVisualCard
          routineId={props.data.routine.id}
          selectedFocus={props.data.routine.focusOverride}
          resolvedFocus={props.data.routine.focusKey}
        />

        <AddExerciseCard
          availableExercises={availableExercises}
          routineId={props.data.routine.id}
        />

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Dumbbell size={16} strokeWidth={2.2} />
              Bloques
            </span>
            <span>{props.data.items.length}</span>
          </div>

          <div className="detail-stack">
            {props.data.items.length > 0 ? (
              props.data.items.map((item, index) => (
                <RoutineItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === props.data.items.length - 1}
                />
              ))
            ) : (
              <div className="detail-empty">
                <p className="detail-empty__title">La rutina esta vacia</p>
                <p className="detail-empty__body">
                  Anade un ejercicio y define sets, reps y RIR.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RoutineVisualCard(props: {
  routineId: string;
  selectedFocus: RoutineEditorData["routine"]["focusOverride"];
  resolvedFocus: RoutineEditorData["routine"]["focusKey"];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateRoutineVisualAction, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <section className="detail-card detail-card--surface">
      <div className="detail-card__head">
        <div>
          <p className="detail-kicker">Dirección visual</p>
          <h2>Arte de la rutina</h2>
        </div>
        <span className="detail-badge">
          <Dumbbell size={14} strokeWidth={2.3} />
          {props.selectedFocus ? "Manual" : "Auto"}
        </span>
      </div>

      <form action={formAction} className="editor-add-form">
        <input type="hidden" name="routineTemplateId" value={props.routineId} />
        <label className="editor-field">
          <span>Foco anatómico</span>
          <select name="focusOverride" defaultValue={props.selectedFocus ?? "auto"}>
            <option value="auto">Automatico ({props.resolvedFocus})</option>
            {trainingFocusOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <EditorSubmitButton
          className="secondary-button"
          label="Guardar visual"
          icon={Save}
        />
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </section>
  );
}

function AddExerciseCard(props: {
  routineId: string;
  availableExercises: RoutineEditorData["availableExercises"];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(addRoutineItemAction, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <section className="detail-card detail-card--surface">
      <div className="detail-card__head">
        <div>
          <p className="detail-kicker">Biblioteca</p>
          <h2>Anadir ejercicio</h2>
        </div>
        <span className="detail-badge">
          <Plus size={14} strokeWidth={2.3} />
          {props.availableExercises.length}
        </span>
      </div>

      <form action={formAction} className="editor-add-form">
        <input type="hidden" name="routineTemplateId" value={props.routineId} />
        <label className="editor-field">
          <span>Ejercicio</span>
          <select
            name="exerciseId"
            defaultValue={props.availableExercises[0]?.id ?? ""}
            disabled={props.availableExercises.length === 0}
            required
          >
            {props.availableExercises.length > 0 ? (
              props.availableExercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} · {exercise.primaryMuscleGroup}
                </option>
              ))
            ) : (
              <option value="">No quedan ejercicios libres</option>
            )}
          </select>
        </label>

        <EditorSubmitButton
          className="primary-button primary-button--block"
          label="Anadir a la rutina"
          disabled={props.availableExercises.length === 0}
        />
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </section>
  );
}

function RoutineItemCard(props: {
  item: RoutineItemDetail;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [updateState, updateAction] = useActionState(updateRoutineItemAction, initialState);
  const [moveState, moveAction] = useActionState(moveRoutineItemAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteRoutineItemAction, initialState);

  useEffect(() => {
    if (!updateState.success && !moveState.success && !deleteState.success) {
      return;
    }

    router.refresh();
  }, [deleteState.success, moveState.success, router, updateState.success]);

  const feedback =
    updateState.error ??
    moveState.error ??
    deleteState.error ??
    updateState.success ??
    moveState.success ??
    deleteState.success;
  const feedbackIsError = Boolean(updateState.error || moveState.error || deleteState.error);

  return (
    <article className="editor-item-card">
      <div className="editor-item-card__head">
        <div className="editor-item-card__title">
          <span className="editor-item-card__index">
            <Grip size={13} strokeWidth={2.3} />
            {props.index + 1}
          </span>
          <div>
            <h3>{props.item.exerciseName}</h3>
            <p>
              {props.item.primaryMuscleGroup} · {props.item.equipment}
            </p>
          </div>
        </div>

        <div className="editor-item-card__moves">
          <form action={moveAction}>
            <input type="hidden" name="routineTemplateId" value={props.item.routineTemplateId} />
            <input type="hidden" name="itemId" value={props.item.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className="icon-button icon-button--small" disabled={props.isFirst}>
              <ArrowUp size={15} strokeWidth={2.3} />
            </button>
          </form>

          <form action={moveAction}>
            <input type="hidden" name="routineTemplateId" value={props.item.routineTemplateId} />
            <input type="hidden" name="itemId" value={props.item.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className="icon-button icon-button--small" disabled={props.isLast}>
              <ArrowDown size={15} strokeWidth={2.3} />
            </button>
          </form>
        </div>
      </div>

      <form action={updateAction} className="editor-grid-form">
        <input type="hidden" name="routineTemplateId" value={props.item.routineTemplateId} />
        <input type="hidden" name="itemId" value={props.item.id} />

        <label className="editor-field">
          <span>Sets</span>
          <input type="number" name="targetSets" min="1" max="10" defaultValue={props.item.targetSets} required />
        </label>

        <label className="editor-field">
          <span>Reps min</span>
          <input type="number" name="targetRepsMin" min="1" max="40" defaultValue={props.item.targetRepsMin} required />
        </label>

        <label className="editor-field">
          <span>Reps max</span>
          <input type="number" name="targetRepsMax" min="1" max="60" defaultValue={props.item.targetRepsMax} required />
        </label>

        <label className="editor-field">
          <span>RIR</span>
          <input
            type="number"
            name="targetRir"
            min="0"
            max="5"
            step="1"
            placeholder="Opcional"
            defaultValue={props.item.targetRir ?? ""}
          />
        </label>

        <label className="editor-field">
          <span>Descanso</span>
          <input
            type="number"
            name="restSeconds"
            min="15"
            max="600"
            step="15"
            placeholder="90"
            defaultValue={props.item.restSeconds ?? ""}
          />
        </label>

        <label className="editor-field editor-field--full">
          <span>Notas</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Tempo, agarre, foco tecnico..."
            defaultValue={props.item.notes}
          />
        </label>

        <div className="editor-item-card__actions">
          <EditorSubmitButton className="secondary-button" label="Guardar bloque" icon={Save} />
          <button type="submit" formAction={deleteAction} className="ghost-button ghost-button--danger">
            <Trash2 size={15} strokeWidth={2.3} />
            Eliminar
          </button>
        </div>
      </form>

      <div className="editor-inline-meta">
        <span>
          <Clock3 size={14} strokeWidth={2.3} />
          {props.item.restSeconds ?? 0}s
        </span>
        <span>
          Objetivo {props.item.targetSets} x {props.item.targetRepsMin}-{props.item.targetRepsMax}
        </span>
      </div>

      {feedback ? (
        <p className={feedbackIsError ? "detail-feedback detail-feedback--error" : "detail-feedback"}>
          {feedback}
        </p>
      ) : null}
    </article>
  );
}

function EditorSubmitButton(props: {
  label: string;
  className: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const Icon = props.icon;

  return (
    <button type="submit" className={props.className} disabled={pending || props.disabled}>
      {Icon ? <Icon size={15} strokeWidth={2.3} /> : null}
      {pending ? "Guardando..." : props.label}
    </button>
  );
}
