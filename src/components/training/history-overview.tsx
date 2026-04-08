"use client";

import { ArrowLeft, Clock3, Dumbbell, Footprints, History, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import type { HistoryOverview, TrainingHistoryEntry } from "@/server/training/history";

export function HistoryOverviewView(props: {
  overview: HistoryOverview;
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
            <p className="detail-kicker">Historial</p>
            <h1>Lo que ya has hecho</h1>
            <p>
              Aqui vive tu actividad cerrada: fuerza, carrera y la foto real de tu consistencia.
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
              <History size={16} strokeWidth={2.2} />
              Actividad reciente
            </span>
            <span>{props.overview.entries.length}</span>
          </div>

          <div className="detail-stack">
            {props.overview.entries.length > 0 ? (
              props.overview.entries.map((entry) => <HistoryEntryCard key={`${entry.kind}-${entry.id}`} entry={entry} />)
            ) : (
              <div className="detail-empty">
                <p className="detail-empty__title">Todavia no hay historial</p>
                <p className="detail-empty__body">
                  En cuanto cierres una sesion o guardes una carrera, aparecera aqui.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function HistoryEntryCard(props: {
  entry: TrainingHistoryEntry;
}) {
  const content = (
    <>
      <div className="history-entry__main">
        <span className="history-entry__icon">
          {props.entry.kind === "workout" ? (
            <Dumbbell size={16} strokeWidth={2.2} />
          ) : (
            <Footprints size={16} strokeWidth={2.2} />
          )}
        </span>

        <div className="history-entry__copy">
          <p className="row-card__title">{props.entry.title}</p>
          <p className="row-card__meta">{props.entry.meta}</p>
        </div>
      </div>

      <div className="history-entry__aside">
        <span className="detail-badge detail-badge--subtle">
          <Clock3 size={14} strokeWidth={2.2} />
          {props.entry.dateLabel}
        </span>
        {props.entry.href ? <ChevronRight size={16} strokeWidth={2.2} className="history-entry__chevron" /> : null}
      </div>
    </>
  );

  if (props.entry.href) {
    return (
      <Link href={props.entry.href} className="history-entry">
        {content}
      </Link>
    );
  }

  return <article className="history-entry">{content}</article>;
}
