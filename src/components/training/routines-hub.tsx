"use client";

import {
  ArrowLeft,
  PencilLine,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

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
  const [activeView, setActiveView] = useState<"routines" | "pool">("routines");
  const featuredRoutine = props.data.routines[0] ?? null;
  const visibleExercises = props.data.availableExercises.slice(0, 8);
  const totalPool = props.data.librarySummary.systemCount + props.data.librarySummary.customCount;

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
          className="detail-hero routines-hero routines-hero--visual"
        >
          <div className="routines-hero__art" aria-hidden="true">
            <Image
              src="/media/anatomy-mannequin.svg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 30rem"
              className="routines-hero__image"
            />
          </div>
          <div className="routines-hero__veil" aria-hidden="true" />

          <div className="routines-hero__content">
            <div className="routines-hero__top">
              <span className="mt-chip mt-chip--violet">
                {featuredRoutine ? "Rutina foco" : "Pool abierto"}
              </span>
              <span className="mt-chip mt-chip--lime">
                {featuredRoutine ? `${featuredRoutine.itemCount} ejercicios` : `${totalPool} ejercicios`}
              </span>
            </div>

            <div className="routines-hero__copy">
              <p className="detail-kicker">Rutinas y ejercicios</p>
              <h1>{featuredRoutine ? featuredRoutine.name : "Tu base de entrenamiento"}</h1>
              <p>
                {featuredRoutine
                  ? featuredRoutine.notes ||
                    `Plantilla lista para entrenar y mover por la agenda cuando la necesites.`
                  : "Crea plantillas limpias, combina tu pool y deja listo cada entreno sin ruido."}
              </p>
            </div>

            <div className="routines-hero__footer">
              {featuredRoutine ? (
                <StartWorkoutButton
                  routineTemplateId={featuredRoutine.id}
                  label="Entrenar"
                  className="routine-hero-button"
                />
              ) : (
                <a href="#routine-create" className="routine-hero-button routine-hero-button--ghost">
                  Crear rutina
                </a>
              )}

              <div className="routines-hero__badge">
                <strong>{featuredRoutine ? formatScheduledDate(featuredRoutine.latestScheduledDate) : "Pool"}</strong>
                <span>
                  {featuredRoutine
                    ? `${featuredRoutine.itemCount} bloques`
                    : `${props.data.librarySummary.customCount} propios`}
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="routine-studio">
          <div className="routine-studio__switch">
            <button
              type="button"
              className={`routine-studio__switch-item${activeView === "routines" ? " routine-studio__switch-item--active" : ""}`}
              onClick={() => setActiveView("routines")}
            >
              Rutinas
            </button>
            <button
              type="button"
              className={`routine-studio__switch-item${activeView === "pool" ? " routine-studio__switch-item--active" : ""}`}
              onClick={() => setActiveView("pool")}
            >
              Pool
            </button>
          </div>

          <div className="routine-studio__summary">
            <div className="routine-studio__summary-item">
              <span>Rutinas</span>
              <strong>{props.data.routines.length}</strong>
            </div>
            <div className="routine-studio__summary-item">
              <span>Pool</span>
              <strong>{totalPool}</strong>
            </div>
            <div className="routine-studio__summary-item">
              <span>Propios</span>
              <strong>{props.data.librarySummary.customCount}</strong>
            </div>
          </div>

          {activeView === "routines" ? (
            <div className="detail-stack">
              <CreateRoutineCard />

              {props.data.routines.length > 0 ? (
                <div className="routine-gallery">
                  {props.data.routines.map((routine, index) => (
                    <RoutineStudioCard
                      key={routine.id}
                      routine={routine}
                      emphasized={index === 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="detail-empty">
                  <p className="detail-empty__title">Todavia no tienes rutinas</p>
                  <p className="detail-empty__body">
                    Empieza creando un bloque para pecho, espalda, pierna o el split que mas uses.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="detail-stack">
              <CreateExerciseCard />

              <section className="detail-card detail-card--surface routine-pool-card">
                <div className="detail-card__head">
                  <div>
                    <p className="detail-kicker">Pool total</p>
                    <h2>{totalPool} ejercicios</h2>
                  </div>
                  <div className="routine-pool-card__stats">
                    <span>Sistema {props.data.librarySummary.systemCount}</span>
                    <span>Propios {props.data.librarySummary.customCount}</span>
                  </div>
                </div>

                <div className="routine-pool-grid">
                  {visibleExercises.map((exercise) => (
                    <article key={exercise.id} className="routine-pool-item">
                      <div>
                        <strong>{exercise.name}</strong>
                        <span>{exercise.primaryMuscleGroup}</span>
                      </div>
                      <em>{exercise.equipment}</em>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RoutineStudioCard(props: {
  routine: RoutinesHubData["routines"][number];
  emphasized: boolean;
}) {
  const helper =
    props.routine.notes ||
    `Agendada ${formatScheduledDate(props.routine.latestScheduledDate)} · lista para registrar sets.`;

  return (
    <article
      className={`routine-studio-card${props.emphasized ? " routine-studio-card--emphasized" : ""}`}
    >
      <div className="routine-studio-card__thumb" aria-hidden="true">
        <Image
          src="/media/anatomy-mannequin.svg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 30rem"
          className="routine-studio-card__thumb-image"
        />
      </div>

      <div className="routine-studio-card__body">
        <div className="routine-studio-card__top">
          <span className="mt-chip mt-chip--violet">Plantilla</span>
          <span className="mt-chip mt-chip--lime">{props.routine.itemCount} ejercicios</span>
        </div>

        <div className="routine-studio-card__copy">
          <p className="detail-kicker">Rutina guardada</p>
          <h2>{props.routine.name}</h2>
          <p>{helper}</p>
        </div>

        <div className="routine-studio-card__meta">
          <span>{formatScheduledDate(props.routine.latestScheduledDate)}</span>
          <span>{props.routine.itemCount > 0 ? "Lista para registrar" : "Pendiente de completar"}</span>
        </div>

        <div className="routine-studio-card__footer">
          <StartWorkoutButton
            routineTemplateId={props.routine.id}
            label="Entrenar"
            className="routine-studio-card__primary"
          />
          <Link href={`/app/routines/${props.routine.id}`} className="routine-studio-card__secondary">
            <PencilLine size={16} strokeWidth={2.3} />
            Editar
          </Link>
        </div>
      </div>
    </article>
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
    <section id="routine-create" className="detail-card detail-card--surface routine-create-card">
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
    <section className="detail-card detail-card--surface routine-create-card routine-create-card--exercise">
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
