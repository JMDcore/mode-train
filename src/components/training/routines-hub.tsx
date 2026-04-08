"use client";

import {
  ArrowLeft,
  Dumbbell,
  PencilLine,
  Plus,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { StartWorkoutButton } from "@/components/training/start-workout-button";
import {
  createCustomExerciseAction,
  createRoutineAction,
} from "@/server/training/actions";
import type { RoutinesHubData } from "@/server/training/routines";
import type {
  ExerciseActionState,
  RoutineActionState,
} from "@/server/training/types";

const initialRoutineState: RoutineActionState = {
  error: null,
  success: null,
  nextPath: null,
  routineId: null,
};

const initialExerciseState: ExerciseActionState = {
  error: null,
  success: null,
};

function formatScheduledDate(value: string | null) {
  if (!value) {
    return "Sin agendar";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function RoutinesHub(props: {
  data: RoutinesHubData;
}) {
  return (
    <main className="detail-page routines-page">
      <div className="detail-shell routines-shell">
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
          className="detail-hero routines-hero"
        >
          <div className="detail-hero__copy">
            <p className="detail-kicker">Rutinas</p>
            <h1>Plantillas para entrenar sin friccion</h1>
            <p>Crea tus bloques, combina ejercicios del pool y guarda tus propios movimientos.</p>
          </div>

          <div className="detail-hero__stats">
            <div className="detail-stat">
              <span>Rutinas</span>
              <strong>{props.data.routines.length}</strong>
            </div>
            <div className="detail-stat">
              <span>Pool</span>
              <strong>
                {props.data.librarySummary.systemCount + props.data.librarySummary.customCount}
              </strong>
            </div>
          </div>
        </motion.section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Sparkles size={16} strokeWidth={2.2} />
              Crear
            </span>
          </div>

          <div className="detail-stack">
            <CreateRoutineCard />
            <CreateExerciseCard />
          </div>
        </section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Dumbbell size={16} strokeWidth={2.2} />
              Tus rutinas
            </span>
            <span>{props.data.routines.length}</span>
          </div>

          <div className="detail-stack">
            {props.data.routines.length > 0 ? (
              props.data.routines.map((routine) => (
                <article key={routine.id} className="routine-hub-card">
                  <div className="routine-hub-card__copy">
                    <div>
                      <p className="detail-kicker">Rutina guardada</p>
                      <h2>{routine.name}</h2>
                    </div>
                    <div className="routine-hub-card__meta">
                      <span>{routine.itemCount} ejercicios</span>
                      <span>{formatScheduledDate(routine.latestScheduledDate)}</span>
                    </div>
                    {routine.notes ? <p>{routine.notes}</p> : null}
                  </div>

                  <div className="routine-hub-card__actions">
                    <StartWorkoutButton
                      routineTemplateId={routine.id}
                      label="Entrenar"
                      className="primary-button"
                    />
                    <Link href={`/app/routines/${routine.id}`} className="secondary-button">
                      <PencilLine size={16} strokeWidth={2.3} />
                      Editar
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="detail-empty">
                <p className="detail-empty__title">Todavia no tienes rutinas</p>
                <p className="detail-empty__body">
                  Empieza creando un bloque para pecho, espalda, pierna o el split que mas uses.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CreateRoutineCard() {
  const [state, formAction] = useActionState(createRoutineAction, initialRoutineState);
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
    <section className="detail-card detail-card--surface">
      <div className="detail-card__head">
        <div>
          <p className="detail-kicker">Plantilla</p>
          <h2>Nueva rutina</h2>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="quick-routine-form quick-routine-form--full">
        <div className="quick-routine-form__row">
          <input type="text" name="name" placeholder="Pecho, Espalda, Pierna..." required />
          <button type="submit" className="quick-routine-form__submit" aria-label="Crear rutina">
            <Plus size={16} strokeWidth={2.4} />
          </button>
        </div>
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </section>
  );
}

function CreateExerciseCard() {
  const [state, formAction] = useActionState(createCustomExerciseAction, initialExerciseState);
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
    <section className="detail-card detail-card--surface">
      <div className="detail-card__head">
        <div>
          <p className="detail-kicker">Pool propio</p>
          <h2>Nuevo ejercicio</h2>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="editor-grid-form editor-grid-form--wide">
        <label className="editor-field">
          <span>Nombre</span>
          <input type="text" name="name" placeholder="Curl inclinado" required />
        </label>

        <label className="editor-field">
          <span>Grupo principal</span>
          <input type="text" name="primaryMuscleGroup" placeholder="Biceps" required />
        </label>

        <label className="editor-field">
          <span>Material</span>
          <input type="text" name="equipment" placeholder="Mancuernas" required />
        </label>

        <label className="editor-field editor-field--full">
          <span>Nota</span>
          <input type="text" name="description" placeholder="Variante o detalle tecnico" />
        </label>

        <button type="submit" className="primary-button primary-button--block">
          <Plus size={16} strokeWidth={2.3} />
          Guardar ejercicio
        </button>
      </form>

      {state.error ? <p className="detail-feedback detail-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="detail-feedback">{state.success}</p> : null}
    </section>
  );
}
