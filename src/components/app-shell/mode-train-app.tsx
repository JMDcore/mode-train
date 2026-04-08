"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Dumbbell,
  Footprints,
  House,
  PencilLine,
  Route,
  Sparkles,
  Target,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import type { AppSnapshot } from "@/server/app/snapshot";
import type { AuthUser } from "@/server/auth/user";
import type { UserProfile } from "@/server/profile";
import {
  createScheduleEntryAction,
  deleteScheduleEntryAction,
  logRunningSessionAction,
} from "@/server/training/actions";
import type {
  RunLogActionState,
  ScheduleActionState,
} from "@/server/training/types";
import { StartWorkoutButton } from "@/components/training/start-workout-button";

const transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
};

const tabs = [
  { key: "home", label: "Inicio", icon: House },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "summary", label: "Resumen", icon: Activity },
  { key: "profile", label: "Yo", icon: User },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const initialScheduleState: ScheduleActionState = {
  error: null,
  success: null,
};

const initialRunState: RunLogActionState = {
  error: null,
  success: null,
};

function formatMetricCaption(key: AppSnapshot["focusMetrics"][number]["key"]) {
  switch (key) {
    case "gym":
      return "sesiones";
    case "running":
      return "este mes";
    case "routines":
      return "guardadas";
    default:
      return "";
  }
}

function formatRunningLabel(
  value: string,
  fallback = "Sin dato",
) {
  return value === "--" ? fallback : value;
}

export function ModeTrainApp(props: {
  user: AuthUser;
  profile: UserProfile;
  snapshot: AppSnapshot;
  completionMessage?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  return (
    <div className="app-wrap">
      <Backdrop />

      <motion.main
        initial={{ opacity: 0, y: 16, scale: 0.988 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...transition, duration: 0.56 }}
        className="app-shell mt-shell"
      >
        <header className="app-header mt-header">
          <div>
            <p className="app-eyebrow">Mode Train</p>
            <h1 className="mt-header__title">{props.snapshot.dateLabel}</h1>
          </div>

          <div className="header-actions">
            <Link href="/app/routines" className="icon-button" aria-label="Gestionar rutinas">
              <Dumbbell size={17} strokeWidth={2.2} />
            </Link>
            <button type="button" className="icon-button" aria-label="Avisos">
              <Bell size={17} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="profile-badge"
              aria-label="Abrir perfil"
              onClick={() => setActiveTab("profile")}
            >
              {props.user.initials}
            </button>
          </div>
        </header>

        <div className="screen-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={transition}
              className="screen-stack"
            >
              {activeTab === "home" ? (
                <HomeScreen
                  user={props.user}
                  snapshot={props.snapshot}
                  completionMessage={props.completionMessage ?? null}
                  onNavigate={setActiveTab}
                />
              ) : null}
              {activeTab === "agenda" ? <AgendaScreen snapshot={props.snapshot} /> : null}
              {activeTab === "summary" ? <SummaryScreen snapshot={props.snapshot} /> : null}
              {activeTab === "profile" ? (
                <ProfileScreen profile={props.profile} snapshot={props.snapshot} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="app-footer">
          <nav className="mt-tabbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={cn("mt-tabbar__item", active && "mt-tabbar__item--active")}
                  onClick={() => setActiveTab(tab.key)}
                  aria-label={tab.label}
                  aria-pressed={active}
                >
                  <Icon size={18} strokeWidth={2.3} />
                  {active ? <span className="mt-tabbar__dot" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </nav>
        </footer>
      </motion.main>
    </div>
  );
}

function HomeScreen(props: {
  user: AuthUser;
  snapshot: AppSnapshot;
  completionMessage: string | null;
  onNavigate: (tab: TabKey) => void;
}) {
  return (
    <div className="mt-screen">
      <section className="mt-dashboard-card">
        <div className="mt-dashboard-card__top">
          <div className="mt-greeting">
            <div className="mt-greeting__avatar">{props.user.initials}</div>
            <div>
              <p>{props.snapshot.dateLabel}</p>
              <h2>
                Hola, {props.snapshot.firstName}
                <span> 👋</span>
              </h2>
            </div>
          </div>
          <span className="mt-notification-badge">
            {props.snapshot.schedule.todayEntries.length}
          </span>
        </div>

        <div className="mt-dashboard-card__meta">
          <div>
            <span>Modo actual</span>
            <strong>{props.snapshot.goalLabel}</strong>
          </div>
          <div className="mt-level-pill">{props.snapshot.levelLabel}</div>
        </div>

        <div className="mt-ring-grid">
          {props.snapshot.focusMetrics.map((metric) => (
            <RingMetric key={metric.key} metric={metric} />
          ))}
        </div>

        <div className="mt-week-strip">
          {props.snapshot.schedule.days.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              className={cn("mt-week-dot", day.isToday && "mt-week-dot--today")}
              onClick={() => props.onNavigate("agenda")}
            >
              <span className="mt-week-dot__count">{day.plannedCount}</span>
              <span className="mt-week-dot__ring" />
              <span className="mt-week-dot__label">{day.dayShort}</span>
            </button>
          ))}
        </div>
      </section>

      {props.completionMessage ? (
        <div className="mt-inline-note">{props.completionMessage}</div>
      ) : null}

      <section className="mt-focus-card">
        <div className="mt-focus-card__art">
          <Image
            src="/media/anatomy-mannequin.svg"
            alt="Anatomia"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="mt-focus-card__image"
          />
          <div className="mt-focus-card__veil" />
        </div>

        <div className="mt-focus-card__content">
          <div className="mt-focus-card__head">
            <span className="mt-chip mt-chip--violet">Rutina principal</span>
            <span className="mt-chip mt-chip--lime">
              {props.snapshot.activeWorkoutSummary
                ? `${props.snapshot.activeWorkoutSummary.completedExercises}/${props.snapshot.activeWorkoutSummary.totalExercises}`
                : props.snapshot.defaultRoutine
                  ? "Lista"
                  : "Sin rutina"}
            </span>
          </div>

          <div className="mt-focus-card__copy">
            <p className="mt-kicker">En foco</p>
            <h3>
              {props.snapshot.activeWorkoutSummary
                ? props.snapshot.activeWorkoutSummary.routineName
                : props.snapshot.defaultRoutine?.name ?? "Crea tu primera rutina"}
            </h3>
            <p>
              {props.snapshot.activeWorkoutSummary
                ? `Guardaste ${props.snapshot.activeWorkoutSummary.savedSets} sets y puedes seguir donde lo dejaste.`
                : props.snapshot.defaultRoutine
                  ? "Usaremos la rutina agendada de hoy como seleccion predeterminada cuando vayas a entrenar."
                  : "Empieza creando una plantilla y dejala lista para agendarla en tu semana."}
            </p>
          </div>

          <div className="mt-focus-card__actions">
            {props.snapshot.activeWorkoutSummary ? (
              <Link
                href={`/app/workouts/${props.snapshot.activeWorkoutSummary.sessionId}`}
                className="mt-primary-pill"
              >
                <span className="mt-primary-pill__play" />
                Reanudar
              </Link>
            ) : props.snapshot.defaultRoutine ? (
              <StartWorkoutButton
                routineTemplateId={props.snapshot.defaultRoutine.id}
                label="Entrenar"
                className="mt-primary-pill"
              />
            ) : (
              <Link href="/app/routines" className="mt-primary-pill">
                <span className="mt-primary-pill__play" />
                Crear rutina
              </Link>
            )}

            <Link href="/app/routines" className="mt-secondary-pill">
              Gestionar rutinas
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-home-grid">
        <button
          type="button"
          className="mt-mini-panel"
          onClick={() => props.onNavigate("agenda")}
        >
          <div className="mt-mini-panel__icon">
            <CalendarDays size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p>Agenda</p>
            <span>
              {props.snapshot.schedule.todayEntries.length > 0
                ? `${props.snapshot.schedule.todayEntries.length} para hoy`
                : "Sin plan hoy"}
            </span>
          </div>
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          className="mt-mini-panel"
          onClick={() => props.onNavigate("summary")}
        >
          <div className="mt-mini-panel__icon">
            <Activity size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p>Resumen</p>
            <span>{props.snapshot.summary.gym.month.highlight} movidos este mes</span>
          </div>
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      </section>

      <section className="mt-list-section">
        <div className="mt-section-head">
          <span>Hoy</span>
          <button type="button" onClick={() => props.onNavigate("agenda")}>
            Ver agenda
          </button>
        </div>

        {props.snapshot.schedule.todayEntries.length > 0 ? (
          props.snapshot.schedule.todayEntries.map((entry) => (
            <article key={entry.id} className="mt-agenda-row">
              <div className={cn("mt-agenda-row__icon", entry.entryType === "gym" ? "mt-agenda-row__icon--violet" : "mt-agenda-row__icon--lime")}>
                {entry.entryType === "gym" ? (
                  <Dumbbell size={16} strokeWidth={2.2} />
                ) : (
                  <Footprints size={16} strokeWidth={2.2} />
                )}
              </div>
              <div className="mt-agenda-row__copy">
                <strong>{entry.title}</strong>
                <span>{entry.meta}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="mt-empty-panel">
            <strong>Semana despejada</strong>
            <span>Planifica gym o running en Agenda para tenerlo siempre a mano.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function AgendaScreen(props: {
  snapshot: AppSnapshot;
}) {
  const selectedInitialDate =
    props.snapshot.schedule.days.find((day) => day.isToday)?.isoDate ??
    props.snapshot.schedule.days[0]?.isoDate ??
    "";
  const [selectedDate, setSelectedDate] = useState(selectedInitialDate);
  const selectedDay =
    props.snapshot.schedule.days.find((day) => day.isoDate === selectedDate) ??
    props.snapshot.schedule.days[0];

  return (
    <div className="mt-screen">
      <section className="mt-planner-card">
        <div className="mt-planner-card__head">
          <div>
            <p className="mt-kicker">Agenda</p>
            <h2>{props.snapshot.schedule.weekRangeLabel}</h2>
          </div>
          <span className="mt-chip mt-chip--ghost">
            {selectedDay?.plannedCount ?? 0} eventos
          </span>
        </div>

        <div className="mt-day-selector">
          {props.snapshot.schedule.days.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              className={cn("mt-day-pill", day.isoDate === selectedDate && "mt-day-pill--active")}
              onClick={() => setSelectedDate(day.isoDate)}
            >
              <span>{day.dayShort}</span>
              <strong>{day.dayNumber}</strong>
            </button>
          ))}
        </div>

        <div className="mt-planner-card__body">
          <div className="mt-planner-card__dayhead">
            <div>
              <h3>{selectedDay?.dayLabel}</h3>
              <p>
                {selectedDay?.plannedCount ?? 0} planificados · {selectedDay?.completedCount ?? 0} registrados
              </p>
            </div>
          </div>

          {selectedDay && selectedDay.entries.length > 0 ? (
            <div className="mt-planner-list">
              {selectedDay.entries.map((entry) => (
                <AgendaEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="mt-empty-panel">
              <strong>Sin entrenos planificados</strong>
              <span>Usa los bloques de abajo para fijar gym o running este dia.</span>
            </div>
          )}
        </div>
      </section>

      <section className="mt-form-stack">
        <ScheduleGymCard snapshot={props.snapshot} selectedDate={selectedDate} />
        <ScheduleRunCard selectedDate={selectedDate} />
        <RunLogCard selectedDate={selectedDate} />
      </section>
    </div>
  );
}

function SummaryScreen(props: {
  snapshot: AppSnapshot;
}) {
  const [mode, setMode] = useState<"general" | "body" | "running">("body");
  const [scope, setScope] = useState<"week" | "month" | "total">("month");

  return (
    <div className="mt-screen">
      <section className="mt-summary-card">
        <div className="mt-summary-card__head">
          <div>
            <p className="mt-kicker">Analytics</p>
            <h2>Resumen</h2>
          </div>
        </div>

        <div className="mt-range-row">
          <div className="mt-range-pill">
            <CalendarDays size={15} strokeWidth={2.2} />
            <span>{props.snapshot.schedule.weekRangeLabel}</span>
          </div>
          <div className="mt-range-pill mt-range-pill--ghost">
            <Target size={15} strokeWidth={2.2} />
            <span>{props.snapshot.goalLabel}</span>
          </div>
        </div>

        <div className="mt-segmented">
          {[
            { key: "general", label: "General" },
            { key: "body", label: "Body" },
            { key: "running", label: "Running" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn("mt-segmented__item", mode === item.key && "mt-segmented__item--active")}
              onClick={() => setMode(item.key as "general" | "body" | "running")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-scope-row">
          {[
            { key: "week", label: "Semana" },
            { key: "month", label: "Mes" },
            { key: "total", label: "Total" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn("mt-scope-pill", scope === item.key && "mt-scope-pill--active")}
              onClick={() => setScope(item.key as "week" | "month" | "total")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "general" ? (
          <div className="mt-summary-stack">
            <div className="mt-summary-grid">
              <SummaryMetricCard
                icon={Dumbbell}
                label="Gym"
                metric={props.snapshot.summary.gym[scope]}
                tone="violet"
              />
              <SummaryMetricCard
                icon={Route}
                label="Running"
                metric={props.snapshot.summary.running[scope]}
                tone="lime"
              />
            </div>

            <section className="mt-activity-panel">
              <div className="mt-panel-headline">
                <h3>Actividad reciente</h3>
              </div>
              {props.snapshot.summary.recentActivity.length > 0 ? (
                props.snapshot.summary.recentActivity.slice(0, 6).map((entry) => (
                  <Link
                    key={`${entry.kind}-${entry.id}`}
                    href={entry.href ?? "/app"}
                    className="mt-activity-row"
                  >
                    <span className={cn("mt-activity-row__icon", entry.kind === "workout" ? "mt-activity-row__icon--violet" : "mt-activity-row__icon--lime")}>
                      {entry.kind === "workout" ? (
                        <Dumbbell size={15} strokeWidth={2.2} />
                      ) : (
                        <Footprints size={15} strokeWidth={2.2} />
                      )}
                    </span>
                    <div className="mt-activity-row__copy">
                      <strong>{entry.title}</strong>
                      <span>{entry.meta}</span>
                    </div>
                    <em>{entry.dateLabel}</em>
                  </Link>
                ))
              ) : (
                <div className="mt-empty-panel">
                  <strong>Sin actividad todavia</strong>
                  <span>Cuando guardes entrenos, el resumen empezara a cobrar vida.</span>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {mode === "body" ? (
          <div className="mt-summary-stack">
            <section className="mt-body-analytics">
              <div className="mt-body-analytics__art">
                <Image
                  src="/media/anatomy-mannequin.svg"
                  alt="Anatomia muscular"
                  fill
                  sizes="(max-width: 768px) 100vw, 44vw"
                  className="mt-body-analytics__image"
                />
              </div>

              <div className="mt-body-analytics__list">
                {props.snapshot.summary.gymRecords.length > 0 ? (
                  props.snapshot.summary.gymRecords.slice(0, 6).map((record) => (
                    <button key={record.exerciseId} type="button" className="mt-body-analytics__row">
                      <span>{record.exerciseName}</span>
                      <strong>{record.weightLabel}</strong>
                    </button>
                  ))
                ) : (
                  <div className="mt-empty-panel">
                    <strong>Sin records de gym</strong>
                    <span>Empieza a registrar sets y apareceran tus mejores marcas.</span>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-record-panel">
              <div className="mt-panel-headline">
                <h3>Records por ejercicio</h3>
              </div>
              {props.snapshot.summary.gymRecords.length > 0 ? (
                props.snapshot.summary.gymRecords.map((record) => (
                  <div key={record.exerciseId} className="mt-record-row">
                    <div>
                      <strong>{record.exerciseName}</strong>
                      <span>{record.dateLabel}</span>
                    </div>
                    <em>{record.weightLabel}</em>
                  </div>
                ))
              ) : (
                <div className="mt-empty-panel">
                  <strong>Sin records todavia</strong>
                  <span>Tu serie mas pesada se guardara automaticamente por ejercicio.</span>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {mode === "running" ? (
          <div className="mt-summary-stack">
            <section className="mt-running-panel">
              <div className="mt-running-panel__ring">
                <div className="mt-running-panel__ring-value">
                  <span>Distancia top</span>
                  <strong>{formatRunningLabel(props.snapshot.summary.runningRecords.longestDistance)}</strong>
                </div>
              </div>

              <div className="mt-running-panel__records">
                <RunningRecordRow label="Mejor ritmo 1 km" value={props.snapshot.summary.runningRecords.bestPace1k} />
                <RunningRecordRow label="Mejor ritmo 5 km" value={props.snapshot.summary.runningRecords.bestPace5k} />
                <RunningRecordRow label="Mejor ritmo 10 km" value={props.snapshot.summary.runningRecords.bestPace10k} />
              </div>
            </section>

            <SummaryMetricCard
              icon={Footprints}
              label="Running"
              metric={props.snapshot.summary.running[scope]}
              tone="lime"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ProfileScreen(props: {
  profile: UserProfile;
  snapshot: AppSnapshot;
}) {
  const metrics = [
    props.profile.heightCm ? `${props.profile.heightCm} cm` : "--",
    props.profile.weightKg ? `${props.profile.weightKg} kg` : "--",
    `${props.snapshot.librarySummary.systemCount + props.snapshot.librarySummary.customCount} ejercicios`,
  ];

  return (
    <div className="mt-screen">
      <section className="mt-profile-card">
        <div className="mt-profile-card__hero">
          <div className="mt-profile-avatar">{props.profile.displayName.charAt(0)}</div>
          <div>
            <p className="mt-kicker">Perfil</p>
            <h2>{props.profile.displayName}</h2>
            <span>{props.snapshot.goalLabel}</span>
          </div>
        </div>

        <div className="mt-profile-metrics">
          {metrics.map((metric) => (
            <div key={metric} className="mt-profile-metrics__item">
              {metric}
            </div>
          ))}
        </div>

        <div className="mt-profile-links">
          <Link href="/onboarding" className="mt-mini-panel mt-mini-panel--link">
            <div className="mt-mini-panel__icon">
              <PencilLine size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p>Editar perfil</p>
              <span>Ajusta tus datos base y tu objetivo</span>
            </div>
          </Link>

          <Link href="/app/routines" className="mt-mini-panel mt-mini-panel--link">
            <div className="mt-mini-panel__icon">
              <Sparkles size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p>Rutinas y ejercicios</p>
              <span>Gestiona tus plantillas y tu pool personalizado</span>
            </div>
          </Link>

          <Link href="/logout" className="mt-secondary-pill mt-secondary-pill--block">
            Cerrar sesion
          </Link>
        </div>
      </section>
    </div>
  );
}

function AgendaEntryCard(props: {
  entry: AppSnapshot["schedule"]["todayEntries"][number];
}) {
  return (
    <article className="mt-schedule-entry">
      <div className="mt-schedule-entry__main">
        <span className={cn("mt-schedule-entry__icon", props.entry.entryType === "gym" ? "mt-schedule-entry__icon--violet" : "mt-schedule-entry__icon--lime")}>
          {props.entry.entryType === "gym" ? (
            <Dumbbell size={16} strokeWidth={2.2} />
          ) : (
            <Footprints size={16} strokeWidth={2.2} />
          )}
        </span>
        <div>
          <strong>{props.entry.title}</strong>
          <span>{props.entry.meta}</span>
        </div>
      </div>

      <div className="mt-schedule-entry__actions">
        {props.entry.entryType === "gym" && props.entry.routineTemplateId ? (
          <StartWorkoutButton
            routineTemplateId={props.entry.routineTemplateId}
            label="Abrir"
            className="mt-inline-button"
          />
        ) : null}
        <DeleteScheduleEntryButton entryId={props.entry.id} />
      </div>
    </article>
  );
}

function ScheduleGymCard(props: {
  snapshot: AppSnapshot;
  selectedDate: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createScheduleEntryAction, initialScheduleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="mt-form-card">
      <div className="mt-form-card__head">
        <div>
          <p className="mt-kicker">Planificar</p>
          <h3>Gym</h3>
        </div>
        <span className="mt-chip mt-chip--violet">Rutina</span>
      </div>

      <form ref={formRef} action={formAction} className="mt-form-grid">
        <input type="hidden" name="entryType" value="gym" />

        <label className="mt-field">
          <span>Fecha</span>
          <input type="date" name="scheduledDate" defaultValue={props.selectedDate} required />
        </label>

        <label className="mt-field">
          <span>Rutina</span>
          <select
            name="routineTemplateId"
            defaultValue={props.snapshot.defaultRoutine?.id ?? props.snapshot.routines[0]?.id ?? ""}
            required
          >
            {props.snapshot.routines.length > 0 ? (
              props.snapshot.routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))
            ) : (
              <option value="">No hay rutinas</option>
            )}
          </select>
        </label>

        <label className="mt-field mt-field--full">
          <span>Nota</span>
          <input type="text" name="notes" placeholder="Opcional" />
        </label>

        <PlannerSubmitButton
          disabled={props.snapshot.routines.length === 0}
          className="mt-action-button mt-action-button--violet"
          label="Guardar en agenda"
        />
      </form>

      {state.error ? <p className="mt-form-feedback mt-form-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="mt-form-feedback">{state.success}</p> : null}
    </section>
  );
}

function ScheduleRunCard(props: {
  selectedDate: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createScheduleEntryAction, initialScheduleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="mt-form-card">
      <div className="mt-form-card__head">
        <div>
          <p className="mt-kicker">Planificar</p>
          <h3>Running</h3>
        </div>
        <span className="mt-chip mt-chip--lime">Libre o con objetivo</span>
      </div>

      <form ref={formRef} action={formAction} className="mt-form-grid">
        <input type="hidden" name="entryType" value="running" />

        <label className="mt-field">
          <span>Fecha</span>
          <input type="date" name="scheduledDate" defaultValue={props.selectedDate} required />
        </label>

        <label className="mt-field">
          <span>Tipo</span>
          <select name="runningKind" defaultValue="free">
            <option value="free">Libre</option>
            <option value="easy">Rodaje suave</option>
            <option value="tempo">Tempo</option>
            <option value="intervals">Series</option>
            <option value="long_run">Tirada larga</option>
            <option value="recovery">Recuperacion</option>
          </select>
        </label>

        <label className="mt-field">
          <span>Nombre</span>
          <input type="text" name="title" placeholder="Correr, rodaje, tempo..." />
        </label>

        <label className="mt-field">
          <span>Km objetivo</span>
          <input type="number" name="runningTargetKm" min="0.5" max="250" step="0.1" placeholder="Opcional" />
        </label>

        <label className="mt-field mt-field--full">
          <span>Nota</span>
          <input type="text" name="notes" placeholder="Opcional" />
        </label>

        <PlannerSubmitButton
          className="mt-action-button mt-action-button--lime"
          label="Guardar running"
        />
      </form>

      {state.error ? <p className="mt-form-feedback mt-form-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="mt-form-feedback">{state.success}</p> : null}
    </section>
  );
}

function RunLogCard(props: {
  selectedDate: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(logRunningSessionAction, initialRunState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state.success]);

  return (
    <section className="mt-form-card">
      <div className="mt-form-card__head">
        <div>
          <p className="mt-kicker">Registrar</p>
          <h3>Carrera hecha</h3>
        </div>
        <span className="mt-chip mt-chip--ghost">Manual</span>
      </div>

      <form ref={formRef} action={formAction} className="mt-form-grid">
        <label className="mt-field">
          <span>Fecha</span>
          <input type="date" name="date" defaultValue={props.selectedDate} required />
        </label>

        <label className="mt-field">
          <span>Tipo</span>
          <select name="kind" defaultValue="free">
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
          <input type="number" name="distanceKm" min="0.5" max="250" step="0.1" placeholder="Opcional" />
        </label>

        <label className="mt-field">
          <span>Minutos</span>
          <input type="number" name="durationMinutes" min="1" max="1440" step="1" placeholder="Opcional" />
        </label>

        <label className="mt-field mt-field--full">
          <span>Nota</span>
          <input type="text" name="notes" placeholder="Sensaciones, terreno, etc." />
        </label>

        <RunSubmitButton className="mt-action-button mt-action-button--ghost" />
      </form>

      {state.error ? <p className="mt-form-feedback mt-form-feedback--error">{state.error}</p> : null}
      {state.success ? <p className="mt-form-feedback">{state.success}</p> : null}
    </section>
  );
}

function DeleteScheduleEntryButton(props: {
  entryId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteScheduleEntryAction, initialScheduleState);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    router.refresh();
  }, [router, state.success]);

  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={props.entryId} />
      <DeleteScheduleSubmit />
    </form>
  );
}

function DeleteScheduleSubmit() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="mt-icon-button" disabled={pending} aria-label="Eliminar">
      <Trash2 size={14} strokeWidth={2.2} />
    </button>
  );
}

function PlannerSubmitButton(props: {
  className: string;
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={props.className} disabled={pending || props.disabled}>
      <CirclePlus size={16} strokeWidth={2.3} />
      {pending ? "Guardando..." : props.label}
    </button>
  );
}

function RunSubmitButton(props: {
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={props.className} disabled={pending}>
      <Route size={16} strokeWidth={2.3} />
      {pending ? "Guardando..." : "Guardar carrera"}
    </button>
  );
}

function RingMetric(props: {
  metric: AppSnapshot["focusMetrics"][number];
}) {
  const progress = useMemo(() => {
    if (props.metric.key === "running") {
      const parsed = Number(String(props.metric.value).replace(/[^\d.]/g, ""));
      return Math.min(0.92, Math.max(0.18, parsed / 40));
    }

    const parsed = Number(String(props.metric.value).replace(/[^\d.]/g, ""));
    return Math.min(0.92, Math.max(0.16, parsed / 10));
  }, [props.metric.key, props.metric.value]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="mt-ring-card">
      <svg viewBox="0 0 100 100" className="mt-ring-card__chart" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} className="mt-ring-card__track" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={cn("mt-ring-card__progress", `mt-ring-card__progress--${props.metric.tone}`)}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="mt-ring-card__copy">
        <strong>{props.metric.value}</strong>
        <span>{props.metric.label}</span>
        <em>{formatMetricCaption(props.metric.key)}</em>
      </div>
    </div>
  );
}

function SummaryMetricCard(props: {
  icon: LucideIcon;
  label: string;
  metric: AppSnapshot["summary"]["gym"]["week"];
  tone: "violet" | "lime";
}) {
  const Icon = props.icon;

  return (
    <section className={cn("mt-metric-card", `mt-metric-card--${props.tone}`)}>
      <div className="mt-metric-card__head">
        <span className="mt-metric-card__icon">
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <strong>{props.label}</strong>
      </div>

      <div className="mt-metric-card__body">
        <h3>{props.metric.sessions}</h3>
        <p>{props.metric.support}</p>
      </div>

      <div className="mt-metric-card__foot">{props.metric.highlight}</div>
    </section>
  );
}

function RunningRecordRow(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-record-row">
      <div>
        <strong>{props.label}</strong>
      </div>
      <em>{formatRunningLabel(props.value)}</em>
    </div>
  );
}

function Backdrop() {
  return (
    <div className="app-backdrop">
      <div className="app-backdrop__grid" />
      <div className="app-backdrop__orb app-backdrop__orb--left" />
      <div className="app-backdrop__orb app-backdrop__orb--right" />
      <div className="app-backdrop__orb app-backdrop__orb--bottom" />
    </div>
  );
}
