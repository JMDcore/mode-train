"use client";

import {
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Footprints,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { ProgressOverview } from "@/server/training/progress";

const analyticsTabs = [
  { key: "general", label: "General" },
  { key: "body", label: "Body" },
  { key: "mode", label: "Mode" },
  { key: "training", label: "Training" },
] as const;

type AnalyticsTab = (typeof analyticsTabs)[number]["key"];

type DonutSegment = {
  label: string;
  value: number;
  tone: "yellow" | "violet" | "pink" | "cyan";
};

const bodyHotspotMap: Record<
  string,
  Array<{ className: string; label: string }>
> = {
  Hombros: [
    { className: "body-hotspot body-hotspot--shoulder-left", label: "Shoulder left" },
    { className: "body-hotspot body-hotspot--shoulder-right", label: "Shoulder right" },
  ],
  Pecho: [{ className: "body-hotspot body-hotspot--chest", label: "Chest" }],
  Espalda: [{ className: "body-hotspot body-hotspot--back", label: "Back" }],
  Pierna: [{ className: "body-hotspot body-hotspot--leg", label: "Leg" }],
  Core: [{ className: "body-hotspot body-hotspot--core", label: "Core" }],
  Cardio: [{ className: "body-hotspot body-hotspot--cardio", label: "Cardio" }],
};

const fallbackBodyGroups = [
  { name: "Hombros", trend: "up", value: "115 - 128 cm" },
  { name: "Pecho", trend: "up", value: "81 - 88 cm" },
  { name: "Core", trend: "flat", value: "Control" },
  { name: "Pierna", trend: "up", value: "Potencia" },
] as const;

const fallbackMeasurementMap: Record<
  string,
  { exerciseName: string; latestPerformanceLabel: string; bestPerformanceLabel: string; trendLabel: string }
> = {
  Hombros: {
    exerciseName: "Shoulders",
    latestPerformanceLabel: "81 cm",
    bestPerformanceLabel: "88 cm",
    trendLabel: "+6 cm",
  },
  Pecho: {
    exerciseName: "Chest",
    latestPerformanceLabel: "102 cm",
    bestPerformanceLabel: "108 cm",
    trendLabel: "+4 cm",
  },
  Core: {
    exerciseName: "Core",
    latestPerformanceLabel: "Base estable",
    bestPerformanceLabel: "Mejor control",
    trendLabel: "+ focus",
  },
  Pierna: {
    exerciseName: "Leg power",
    latestPerformanceLabel: "24 reps",
    bestPerformanceLabel: "30 reps",
    trendLabel: "+6 reps",
  },
};

export function ProgressOverviewView(props: {
  overview: ProgressOverview;
}) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("body");

  const segments = useMemo<DonutSegment[]>(() => {
    const sessions = Number(props.overview.summaryMetrics[0]?.value ?? 0);
    const sets = Number(props.overview.summaryMetrics[1]?.value ?? 0);
    const volume = Number(
      (props.overview.summaryMetrics[2]?.value ?? "0").replace(/[^\d,.]/g, "").replace(",", "."),
    );
    const runs = Number(props.overview.summaryMetrics[3]?.value ?? 0);

    return [
      { label: "Power", value: Math.max(18, Math.min(68, Math.round(volume / 120))), tone: "yellow" },
      { label: "Cardio", value: Math.max(12, Math.min(26, runs * 6)), tone: "pink" },
      { label: "Stretching", value: Math.max(10, Math.min(22, Math.round(sets / 8))), tone: "cyan" },
      { label: "Focus", value: Math.max(8, Math.min(24, sessions * 5)), tone: "violet" },
    ];
  }, [props.overview.summaryMetrics]);

  const bodyGroups = useMemo(() => {
    const seen = new Set<string>();

    return props.overview.cards
      .map((card) => ({
        name: card.primaryMuscleGroup,
        trend:
          card.trendLabel && card.trendLabel.startsWith("+")
            ? "up"
            : card.trendLabel
              ? "down"
              : "flat",
        value: card.bestPerformanceLabel,
      }))
      .filter((card) => {
        if (seen.has(card.name)) {
          return false;
        }

        seen.add(card.name);
        return true;
      })
      .slice(0, 6);
  }, [props.overview.cards]);

  const resolvedBodyGroups = bodyGroups.length > 0 ? bodyGroups : [...fallbackBodyGroups];
  const [selectedGroup, setSelectedGroup] = useState(resolvedBodyGroups[0]?.name ?? "Hombros");

  const resolvedSelectedGroup = resolvedBodyGroups.some((group) => group.name === selectedGroup)
    ? selectedGroup
    : resolvedBodyGroups[0]?.name ?? "Hombros";

  const selectedBodyCard =
    props.overview.cards.find((card) => card.primaryMuscleGroup === resolvedSelectedGroup) ??
    (resolvedSelectedGroup
      ? {
          primaryMuscleGroup: resolvedSelectedGroup,
          exerciseName:
            fallbackMeasurementMap[resolvedSelectedGroup]?.exerciseName ?? resolvedSelectedGroup,
          latestPerformanceLabel:
            fallbackMeasurementMap[resolvedSelectedGroup]?.latestPerformanceLabel ?? "81 cm",
          bestPerformanceLabel:
            fallbackMeasurementMap[resolvedSelectedGroup]?.bestPerformanceLabel ?? "88 cm",
          trendLabel:
            fallbackMeasurementMap[resolvedSelectedGroup]?.trendLabel ?? "+ progreso",
        }
      : null);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 30);

  const formatAnalyticsDate = (value: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(value);

  const fromDate = formatAnalyticsDate(startDate);
  const toDate = formatAnalyticsDate(today);

  return (
    <main className="detail-page analytics-page">
      <div className="detail-shell analytics-shell">
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
          className="analytics-screen"
        >
          <div className="analytics-screen__title">Analytics</div>

          <div className="analytics-range">
            <div className="analytics-range__pill">
              <CalendarDays size={16} strokeWidth={2.2} />
              <span>{fromDate}</span>
            </div>
            <button type="button" className="analytics-range__close" aria-label="Cerrar rango">
              <X size={15} strokeWidth={2.2} />
            </button>
            <div className="analytics-range__pill analytics-range__pill--right">
              <CalendarDays size={16} strokeWidth={2.2} />
              <span>{toDate}</span>
            </div>
          </div>

          <div className="analytics-segmented">
            {analyticsTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "analytics-segmented__item",
                  tab.key === activeTab && "analytics-segmented__item--active",
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "general" ? (
            <div className="analytics-stack">
              <section className="analytics-card analytics-card--feature">
                <div className="analytics-legend">
                  {segments.slice(0, 3).map((segment) => (
                    <span key={segment.label} className="analytics-legend__item">
                      <span className={cn("analytics-legend__dot", `analytics-legend__dot--${segment.tone}`)} />
                      {segment.label} - {segment.value}%
                    </span>
                  ))}
                </div>

                <div className="analytics-card__chart">
                  <DonutBreakdown segments={segments} />
                </div>

                <div className="analytics-results">
                  <h3>The best results</h3>
                  {props.overview.cards.slice(0, 3).map((card) => (
                    <article key={card.exerciseId} className="analytics-result-row">
                      <div className="analytics-result-row__icon">
                        {card.primaryMuscleGroup === "Cardio" ? (
                          <Footprints size={16} strokeWidth={2.2} />
                        ) : (
                          <Dumbbell size={16} strokeWidth={2.2} />
                        )}
                      </div>
                      <div className="analytics-result-row__copy">
                        <p>{card.exerciseName}</p>
                        <span>{card.bestPerformanceLabel}</span>
                      </div>
                      <span className="analytics-result-row__badge">
                        {card.trendLabel ?? "+ progreso"}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="analytics-card analytics-card--radar">
                <div className="analytics-card__head">
                  <div>
                    <p className="card-kicker">General</p>
                    <h3>Perfil de rendimiento</h3>
                  </div>
                  <span className="meta-pill">30d</span>
                </div>
                <RadarStatsChart values={[54, 42, 71, 63, 49]} />
              </section>
            </div>
          ) : null}

          {activeTab === "body" ? (
            <div className="analytics-stack">
              <section className="analytics-card analytics-card--body">
                <div className="analytics-card__head analytics-card__head--dense">
                  <div>
                    <p className="card-kicker">Your weight</p>
                    <h3>89 kg</h3>
                  </div>
                  <span className="summary-panel__meta">Muscle groups</span>
                </div>

                <div className="body-analytics">
                  <div className="body-analytics__figure">
                    <div className="body-analytics__glow" />
                    <Image
                      src="/media/bodybuilder-program.png"
                      alt="Body analytics"
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="body-analytics__photo"
                    />
                    <div className="body-analytics__overlay" />
                    <span className="body-highlight body-highlight--left" aria-hidden="true" />
                    <span className="body-highlight body-highlight--right" aria-hidden="true" />
                    {(bodyHotspotMap[selectedGroup] ?? bodyHotspotMap.Hombros).map((spot) => (
                      <span
                        key={spot.label}
                        className={spot.className}
                        aria-label={spot.label}
                      />
                    ))}
                  </div>

                  <div className="body-analytics__groups">
                    {resolvedBodyGroups.map((group) => (
                      <button
                        key={group.name}
                        type="button"
                        className={cn(
                          "body-group-row",
                          group.name === resolvedSelectedGroup && "body-group-row--active",
                        )}
                        onClick={() => setSelectedGroup(group.name)}
                      >
                        <span>{group.name.toUpperCase()}</span>
                        <strong>{group.trend === "up" ? "↗" : group.trend === "down" ? "↘" : "•"}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {selectedBodyCard ? (
                <section className="analytics-card analytics-card--line">
                  <div className="analytics-measurement">
                    <div>
                      <p className="card-kicker">{selectedBodyCard.primaryMuscleGroup}</p>
                      <h3>{selectedBodyCard.exerciseName}</h3>
                    </div>
                    <span className="analytics-measurement__delta">
                      {selectedBodyCard.trendLabel ?? "+ progreso"}
                    </span>
                  </div>

                  <div className="analytics-comparison">
                    <span>Past: {selectedBodyCard.latestPerformanceLabel}</span>
                    <span className="analytics-comparison__arrow">→</span>
                    <span>Current: {selectedBodyCard.bestPerformanceLabel}</span>
                  </div>

                  <MiniLineChart />
                </section>
              ) : null}
            </div>
          ) : null}

          {activeTab === "mode" ? (
            <div className="analytics-stack">
              <section className="analytics-card analytics-card--radar analytics-card--mode">
                <div className="analytics-card__head">
                  <div>
                    <p className="card-kicker">Mode</p>
                    <h3>Cómo estás rindiendo</h3>
                  </div>
                  <span className="meta-pill">Live</span>
                </div>
                <RadarStatsChart values={[68, 48, 76, 71, 56]} />
              </section>

              <section className="analytics-card analytics-card--summary">
                {props.overview.summaryMetrics.map((metric) => (
                  <article key={metric.label} className="analytics-summary-row">
                    <div>
                      <p>{metric.label}</p>
                      <span>{metric.caption}</span>
                    </div>
                    <strong>{metric.value}</strong>
                  </article>
                ))}
              </section>
            </div>
          ) : null}

          {activeTab === "training" ? (
            <div className="analytics-stack">
              <section className="analytics-card analytics-card--interactive">
                <div>
                  <h3>Interactive view</h3>
                  <p>Modo visual para seguir el bloque, revisar el cuerpo y entrenar con más contexto.</p>
                </div>
                <div className="analytics-card__interactive">
                  <button type="button" className="primary-button">
                    Start
                  </button>
                  <div className="analytics-card__interactive-image">
                    <Image
                      src="/media/fitness-model.jpg"
                      alt="Interactive training"
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="analytics-card__interactive-photo"
                    />
                  </div>
                </div>
              </section>

              <section className="analytics-card analytics-card--summary">
                {props.overview.cards.slice(0, 4).map((card) => (
                  <article key={card.exerciseId} className="analytics-summary-row analytics-summary-row--stacked">
                    <div>
                      <p>{card.exerciseName}</p>
                      <span>{card.latestPerformanceLabel}</span>
                    </div>
                    <strong>{card.lastLoggedAtLabel}</strong>
                  </article>
                ))}
              </section>
            </div>
          ) : null}
        </motion.section>
      </div>
    </main>
  );
}

function DonutBreakdown(props: { segments: DonutSegment[] }) {
  const size = 240;
  const strokeWidth = 34;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const total = props.segments.reduce((sum, segment) => sum + segment.value, 0);
  const segmentsWithOffset = props.segments.map((segment, index) => {
    const previousValue = props.segments
      .slice(0, index)
      .reduce((sum, current) => sum + current.value, 0);

    return {
      ...segment,
      offset: (previousValue / total) * circumference,
    };
  });

  return (
    <div className="donut-breakdown">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {segmentsWithOffset.map((segment) => {
          const segmentLength = (segment.value / total) * circumference;
          const dashArray = `${segmentLength} ${circumference - segmentLength}`;
          const dashOffset = -segment.offset;

          return (
            <circle
              key={segment.label}
              className={cn("donut-breakdown__segment", `donut-breakdown__segment--${segment.tone}`)}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <div className="donut-breakdown__center">
        <strong>{props.segments[0]?.value ?? 0}%</strong>
        <span>Power</span>
      </div>
    </div>
  );
}

function RadarStatsChart(props: { values: number[] }) {
  const points = useMemo(() => {
    const centerX = 140;
    const centerY = 140;
    const maxRadius = 92;
    const axes = props.values.length;

    return props.values
      .map((value, index) => {
        const angle = (Math.PI * 2 * index) / axes - Math.PI / 2;
        const radius = (value / 100) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return `${x},${y}`;
      })
      .join(" ");
  }, [props.values]);

  return (
    <div className="radar-chart">
      <svg viewBox="0 0 280 280" aria-hidden>
        <polygon className="radar-chart__grid" points="140,36 230,88 230,192 140,244 50,192 50,88" />
        <polygon className="radar-chart__grid radar-chart__grid--inner" points="140,62 205,101 205,179 140,218 75,179 75,101" />
        <polygon className="radar-chart__grid radar-chart__grid--inner" points="140,88 182,114 182,166 140,192 98,166 98,114" />
        <polygon className="radar-chart__value" points={points} />
      </svg>
      <div className="radar-chart__labels">
        <span>Cardio</span>
        <span>Effect.</span>
        <span>Endurance</span>
        <span>Power</span>
        <span>Speed</span>
        <span>Flexibility</span>
      </div>
    </div>
  );
}

function MiniLineChart() {
  return (
    <div className="mini-line-chart">
      <svg viewBox="0 0 320 160" aria-hidden>
        <path
          className="mini-line-chart__grid"
          d="M8 24H312 M8 56H312 M8 88H312 M8 120H312 M8 152H312"
        />
        <path
          className="mini-line-chart__path"
          d="M8 138 C 38 124, 54 122, 72 108 S 114 94, 132 86 S 176 78, 194 74 S 234 66, 252 54 S 290 40, 312 48"
        />
      </svg>
    </div>
  );
}
