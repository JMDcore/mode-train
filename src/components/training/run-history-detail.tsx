"use client";

import { ArrowLeft, Footprints, Save } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { updateRunningSessionAction } from "@/server/training/actions";
import type { RunningHistoryDetail } from "@/server/training/history";
import type { RunLogActionState } from "@/server/training/types";

const initialState: RunLogActionState = {
  error: null,
  success: null,
};

export function RunHistoryDetailView(props: {
  detail: RunningHistoryDetail;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(updateRunningSessionAction, initialState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

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
            <p className="detail-kicker">Running</p>
            <h1>{props.detail.kindLabel}</h1>
            <p>{props.detail.dateLabel}</p>
          </div>

          <div className="detail-hero__stats">
            <div className="detail-stat">
              <span>Distancia</span>
              <strong>
                {props.detail.distanceKm !== null
                  ? `${props.detail.distanceKm.toFixed(props.detail.distanceKm % 1 === 0 ? 0 : 1)} km`
                  : "--"}
              </strong>
              <small>Registrada</small>
            </div>
            <div className="detail-stat">
              <span>Duracion</span>
              <strong>
                {props.detail.durationMinutes !== null ? `${props.detail.durationMinutes} min` : "--"}
              </strong>
              <small>Total</small>
            </div>
            <div className="detail-stat">
              <span>Ritmo</span>
              <strong>{props.detail.averagePaceLabel ?? "--"}</strong>
              <small>Promedio</small>
            </div>
          </div>
        </motion.section>

        <section className="detail-section">
          <div className="detail-section__head">
            <span>
              <Footprints size={16} strokeWidth={2.2} />
              Editar carrera
            </span>
            <span>{props.detail.kindLabel}</span>
          </div>

          <form ref={formRef} action={formAction} className="mt-form-card mt-form-card--detail">
            <input type="hidden" name="sessionId" value={props.detail.id} />

            <div className="mt-form-grid">
              <label className="mt-field">
                <span>Fecha</span>
                <input type="date" name="date" defaultValue={props.detail.date} required />
              </label>

              <label className="mt-field">
                <span>Tipo</span>
                <select name="kind" defaultValue={props.detail.kind}>
                  <option value="free">Libre</option>
                  <option value="easy">Rodaje suave</option>
                  <option value="tempo">Tempo</option>
                  <option value="intervals">Series</option>
                  <option value="long_run">Tirada larga</option>
                  <option value="recovery">Recuperacion</option>
                </select>
              </label>

              <label className="mt-field">
                <span>Km</span>
                <input
                  type="number"
                  name="distanceKm"
                  min="0.5"
                  max="250"
                  step="0.1"
                  defaultValue={props.detail.distanceKm ?? ""}
                  placeholder="Opcional"
                />
              </label>

              <label className="mt-field">
                <span>Minutos</span>
                <input
                  type="number"
                  name="durationMinutes"
                  min="1"
                  max="1440"
                  step="1"
                  defaultValue={props.detail.durationMinutes ?? ""}
                  placeholder="Opcional"
                />
              </label>

              <label className="mt-field mt-field--full">
                <span>Nota</span>
                <input type="text" name="notes" defaultValue={props.detail.notes} placeholder="Sensaciones, terreno, etc." />
              </label>

              <RunUpdateSubmit />
            </div>

            {state.error ? <p className="mt-form-feedback mt-form-feedback--error">{state.error}</p> : null}
            {state.success ? <p className="mt-form-feedback">{state.success}</p> : null}
          </form>
        </section>
      </div>
    </main>
  );
}

function RunUpdateSubmit() {
  return (
    <button type="submit" className="mt-action-button mt-action-button--ghost">
      <Save size={16} strokeWidth={2.3} />
      Guardar cambios
    </button>
  );
}
