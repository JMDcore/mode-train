"use client";

import { ArrowLeft, Clock3, Dumbbell, Layers3, Scale, TimerReset } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { WorkoutHistoryDetail } from "@/server/training/history";

export function WorkoutHistoryDetailView(props: {
  detail: WorkoutHistoryDetail;
}) {
  return (
    <main className="detail-page">
      <div className="detail-shell">
        <div className="detail-topbar">
          <Link href="/app/history" className="detail-back">
            <ArrowLeft size={16} strokeWidth={2.2} />
            Historial
          </Link>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="detail-hero"
        >
          <div className="detail-hero__copy">
            <p className="detail-kicker">Sesion cerrada</p>
            <h1>{props.detail.routineName}</h1>
            <p>{props.detail.dateLabel}</p>
          </div>

          <div className="detail-hero__stats">
            <div className="detail-stat">
              <span>Duracion</span>
              <strong>{props.detail.durationLabel}</strong>
            </div>
            <div className="detail-stat">
              <span>Volumen</span>
              <strong>{new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(props.detail.totalVolumeKg)} kg</strong>
            </div>
            <div className="detail-stat">
              <span>Sets</span>
              <strong>{props.detail.savedSets}</strong>
            </div>
            <div className="detail-stat">
              <span>Ejercicios</span>
              <strong>{props.detail.exerciseCount}</strong>
            </div>
          </div>
        </motion.section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Layers3 size={16} strokeWidth={2.2} />
              Bloques guardados
            </span>
            <span>{props.detail.exerciseCount}</span>
          </div>

          <div className="detail-stack">
            {props.detail.exercises.map((exercise) => (
              <article key={exercise.exerciseId} className="session-card">
                <div className="session-card__head">
                  <div>
                    <h2>{exercise.exerciseName}</h2>
                    <p>
                      {exercise.primaryMuscleGroup} · {exercise.equipment}
                    </p>
                  </div>
                  {exercise.targetRangeLabel ? (
                    <span className="detail-badge detail-badge--subtle">
                      <TimerReset size={14} strokeWidth={2.2} />
                      {exercise.targetRangeLabel}
                    </span>
                  ) : null}
                </div>

                <div className="history-set-list">
                  {exercise.sets.map((set) => (
                    <div key={`${exercise.exerciseId}-${set.setNumber}`} className="history-set-row">
                      <span className="history-set-row__index">
                        <Dumbbell size={14} strokeWidth={2.2} />
                        Set {set.setNumber}
                      </span>
                      <span className="history-set-row__metric">
                        <Scale size={14} strokeWidth={2.2} />
                        {set.weightKg ?? "--"} kg
                      </span>
                      <span className="history-set-row__metric">
                        <Clock3 size={14} strokeWidth={2.2} />
                        {set.reps ?? "--"} reps
                      </span>
                      <span className="history-set-row__metric">RIR {set.rir ?? "--"}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
