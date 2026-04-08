"use client";

import { ArrowLeft, ArrowUpRight, Dumbbell, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { ProgressOverview } from "@/server/training/progress";

export function ProgressOverviewView(props: {
  overview: ProgressOverview;
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
            <p className="detail-kicker">Progreso</p>
            <h1>Lo que ya esta mejorando</h1>
            <p>
              Un vistazo rapido a tus ejercicios vivos, mejores bloques y señales de avance.
            </p>
          </div>

          <div className="detail-hero__stats">
            {props.overview.summaryMetrics.map((metric) => (
              <div key={metric.label} className="detail-stat">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <TrendingUp size={16} strokeWidth={2.2} />
              Ejercicios vivos
            </span>
            <span>{props.overview.cards.length}</span>
          </div>

          <div className="detail-stack">
            {props.overview.cards.length > 0 ? (
              props.overview.cards.map((card) => (
                <article key={card.exerciseId} className="progress-card">
                  <div className="progress-card__head">
                    <div>
                      <h2>{card.exerciseName}</h2>
                      <p>{card.primaryMuscleGroup}</p>
                    </div>
                    <span className="detail-badge detail-badge--subtle">
                      <Dumbbell size={14} strokeWidth={2.2} />
                      {card.totalSets} sets
                    </span>
                  </div>

                  <div className="progress-card__body">
                    <div className="progress-card__metric">
                      <span>Ultimo bloque</span>
                      <strong>{card.latestPerformanceLabel}</strong>
                    </div>
                    <div className="progress-card__metric">
                      <span>Mejor bloque</span>
                      <strong>{card.bestPerformanceLabel}</strong>
                    </div>
                  </div>

                  <div className="progress-card__footer">
                    <span className="progress-card__date">{card.lastLoggedAtLabel}</span>
                    {card.trendLabel ? (
                      <span className="progress-card__trend">
                        <ArrowUpRight size={14} strokeWidth={2.2} />
                        {card.trendLabel}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="detail-empty">
                <p className="detail-empty__title">Todavia no hay progreso que mostrar</p>
                <p className="detail-empty__body">
                  Cierra una sesion y empezaremos a comparar tus bloques por ejercicio.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Sparkles size={16} strokeWidth={2.2} />
              Señales rapidas
            </span>
            <span>{props.overview.milestones.length}</span>
          </div>

          <div className="detail-stack">
            {props.overview.milestones.map((milestone) => (
              <article key={milestone.id} className="history-entry">
                <div className="history-entry__main">
                  <span className="history-entry__icon">
                    <Sparkles size={16} strokeWidth={2.2} />
                  </span>
                  <div className="history-entry__copy">
                    <p className="row-card__title">{milestone.title}</p>
                    <p className="row-card__meta">{milestone.meta}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
