"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronLeft,
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
import { useActionState, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";
import type { AppSnapshot } from "@/server/app/snapshot";
import type { AuthUser } from "@/server/auth/user";
import type { UserProfile } from "@/server/profile";
import {
  createScheduleEntryAction,
  deleteScheduleEntryAction,
  logRunningSessionAction,
  startWorkoutSessionAction,
} from "@/server/training/actions";
import type {
  RunLogActionState,
  ScheduleActionState,
  WorkoutLaunchActionState,
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

const initialWorkoutLaunchState: WorkoutLaunchActionState = {
  error: null,
  success: null,
  nextPath: null,
  resumed: false,
  routineId: null,
  sessionId: null,
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

function splitRangeLabel(value: string) {
  const [start, end] = value.split(" - ");

  return {
    start: start ?? value,
    end: end ?? value,
  };
}

function parseMetricNumber(value: string) {
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
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
  const routineCards = props.snapshot.routines.slice(0, 3);
  const featuredRoutine = props.snapshot.activeWorkoutSummary
    ? props.snapshot.routines.find(
        (routine) => routine.id === props.snapshot.activeWorkoutSummary?.routineId,
      ) ?? props.snapshot.routines[0] ?? null
    : props.snapshot.routines[0] ?? null;
  const gymTodayCount = props.snapshot.schedule.todayEntries.filter((entry) => entry.entryType === "gym").length;
  const runTodayCount = props.snapshot.schedule.todayEntries.filter((entry) => entry.entryType === "running").length;
  const weekPlanned = props.snapshot.schedule.days.reduce((acc, day) => acc + day.plannedCount, 0);
  const weekLogged = props.snapshot.schedule.days.reduce((acc, day) => acc + day.completedCount, 0);

  return (
    <div className="mt-screen mt-screen--home">
      <section className="mt-home-analytics">
        <div className="mt-home-analytics__art" aria-hidden="true">
          <Image
            src="/media/anatomy-mannequin.svg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="mt-home-analytics__image"
          />
        </div>
        <div className="mt-home-analytics__veil" aria-hidden="true" />

        <div className="mt-home-analytics__surface">
          <div className="mt-home-analytics__greeting">
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
            <button
              type="button"
              className="mt-home-analytics__bell"
              aria-label="Ir a agenda"
              onClick={() => props.onNavigate("agenda")}
            >
              <span className="mt-home-analytics__bell-count">
                {props.snapshot.schedule.todayEntries.length}
              </span>
              <Bell size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-home-analytics__current">
            <div>
              <span>Actual</span>
              <strong>{props.snapshot.routines.length} rutinas listas</strong>
            </div>
            <div className="mt-home-analytics__cluster" aria-hidden="true">
              <span className="mt-home-analytics__cluster-dot mt-home-analytics__cluster-dot--violet" />
              <span className="mt-home-analytics__cluster-dot mt-home-analytics__cluster-dot--lime" />
              <span className="mt-home-analytics__cluster-dot mt-home-analytics__cluster-dot--pink" />
              <Link href="/app/routines" className="mt-home-analytics__cluster-link">
                Add +
              </Link>
            </div>
          </div>

          <div className="mt-home-period">
            <button type="button" className="mt-home-period__control" aria-label="Periodo anterior">
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <div className="mt-home-period__label">Para esta semana</div>
            <button type="button" className="mt-home-period__control" aria-label="Periodo siguiente">
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-ring-grid mt-ring-grid--hero">
            {props.snapshot.focusMetrics.map((metric) => (
              <RingMetric key={metric.key} metric={metric} />
            ))}
          </div>

          <div className="mt-home-analytics__actions">
            <button
              type="button"
              className="mt-home-inline-action"
              onClick={() => props.onNavigate("agenda")}
            >
              <CalendarDays size={16} strokeWidth={2.2} />
              Agenda
            </button>
            <button
              type="button"
              className="mt-home-inline-action mt-home-inline-action--accent"
              onClick={() => props.onNavigate("summary")}
            >
              <Activity size={16} strokeWidth={2.2} />
              Resumen
            </button>
          </div>

          <div className="mt-week-strip mt-week-strip--hero">
            {props.snapshot.schedule.days.map((day) => (
              <button
                key={day.isoDate}
                type="button"
                className={cn(
                  "mt-week-dot",
                  day.isToday && "mt-week-dot--today",
                  day.plannedCount + day.completedCount > 0 && "mt-week-dot--filled",
                )}
                onClick={() => props.onNavigate("agenda")}
              >
                <span className="mt-week-dot__count">{day.plannedCount + day.completedCount}</span>
                <span className="mt-week-dot__ring" />
                <span className="mt-week-dot__label">{day.dayShort}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {props.completionMessage ? (
        <div className="mt-inline-note">{props.completionMessage}</div>
      ) : null}

      <section className="mt-home-focusboard">
        <div className="mt-program-board__head">
          <div>
            <span>Bloque principal</span>
            <strong>
              {featuredRoutine
                ? props.snapshot.activeWorkoutSummary
                  ? "Sesion abierta y lista para continuar"
                  : "Plantilla principal de la semana"
                : "Base pendiente"}
            </strong>
          </div>
          <button type="button" onClick={() => props.onNavigate("agenda")}>
            Ver agenda
          </button>
        </div>

        {featuredRoutine ? (
          <HomeFeatureCard
            routine={featuredRoutine}
            activeSessionId={props.snapshot.activeWorkoutSummary?.sessionId ?? null}
            scheduledCount={weekPlanned}
            gymTodayCount={gymTodayCount}
            runTodayCount={runTodayCount}
            levelLabel={props.snapshot.levelLabel}
            goalLabel={props.snapshot.goalLabel}
          />
        ) : (
          <div className="mt-empty-panel">
            <strong>Sin plantilla principal todavia</strong>
            <span>Crea una rutina para que la app empiece a parecerse a tu semana real.</span>
          </div>
        )}
      </section>

      <section className="mt-home-secondary">
        <div className="mt-home-mini-grid">
          <button type="button" className="mt-home-mini-card" onClick={() => props.onNavigate("agenda")}>
            <span className="mt-home-mini-card__icon mt-home-mini-card__icon--violet">
              <CalendarDays size={16} strokeWidth={2.2} />
            </span>
            <div>
              <p>Semana</p>
              <strong>{weekPlanned} bloques</strong>
              <span>{gymTodayCount + runTodayCount} para hoy</span>
            </div>
          </button>

          <button type="button" className="mt-home-mini-card" onClick={() => props.onNavigate("summary")}>
            <span className="mt-home-mini-card__icon mt-home-mini-card__icon--lime">
              <Activity size={16} strokeWidth={2.2} />
            </span>
            <div>
              <p>Resumen</p>
              <strong>{weekLogged} registros</strong>
              <span>{props.snapshot.summary.gym.month.sessions} gym este mes</span>
            </div>
          </button>
        </div>

        <div className="mt-home-routine-rail">
          <div className="mt-program-board__head">
            <div>
              <span>Rutinas activas</span>
              <strong>{routineCards.length > 0 ? "Tus bloques guardados" : "Todavia no hay plantillas"}</strong>
            </div>
            <Link href="/app/routines">Ver todas</Link>
          </div>

          {routineCards.length > 0 ? (
            <div className="mt-home-routine-rail__list">
              {routineCards.map((routine) => (
                <RoutineMiniCard
                  key={routine.id}
                  routine={routine}
                  isActive={props.snapshot.activeWorkoutSummary?.routineId === routine.id}
                  activeSessionId={
                    props.snapshot.activeWorkoutSummary?.routineId === routine.id
                      ? props.snapshot.activeWorkoutSummary.sessionId
                      : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-empty-panel">
              <strong>Sin rutinas todavia</strong>
              <span>Crea una plantilla y la dejaremos lista para agenda y registro.</span>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

function HomeFeatureCard(props: {
  routine: AppSnapshot["routines"][number];
  activeSessionId: string | null;
  scheduledCount: number;
  gymTodayCount: number;
  runTodayCount: number;
  levelLabel: string;
  goalLabel: string;
}) {
  const hasAgenda = props.gymTodayCount + props.runTodayCount > 0;

  return (
    <article className="mt-home-feature-card">
      <div className="mt-home-feature-card__art" aria-hidden="true">
        <Image
          src="/media/anatomy-mannequin.svg"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="mt-home-feature-card__image"
        />
      </div>
      <div className="mt-home-feature-card__veil" aria-hidden="true" />

      <div className="mt-home-feature-card__body">
        <div className="mt-home-feature-card__top">
          <span className="mt-chip mt-chip--violet">{props.levelLabel}</span>
          <span className="mt-chip mt-chip--lime">
            {props.routine.itemCount > 0 ? `${props.routine.itemCount} ejercicios` : "Vacia"}
          </span>
        </div>

        <div className="mt-home-feature-card__copy">
          <p className="mt-kicker">Bloque curado</p>
          <h3>{props.routine.name}</h3>
          <p>
            {hasAgenda
              ? `${props.gymTodayCount} gym · ${props.runTodayCount} running hoy. Todo listo para ${props.goalLabel.toLowerCase()}.`
              : `Plantilla principal preparada para registrar sets y construir progreso real.`}
          </p>
        </div>

        <div className="mt-home-feature-card__meta">
          <div className="mt-home-feature-card__metric">
            <span>Semana</span>
            <strong>{props.scheduledCount} eventos</strong>
          </div>
          <div className="mt-home-feature-card__metric">
            <span>Hoy</span>
            <strong>{props.gymTodayCount + props.runTodayCount}</strong>
          </div>
        </div>

        <div className="mt-home-feature-card__footer">
          {props.activeSessionId ? (
            <Link href={`/app/workouts/${props.activeSessionId}`} className="mt-primary-pill mt-primary-pill--compact">
              <span className="mt-primary-pill__play" />
              Continuar
            </Link>
          ) : (
            <StartWorkoutButton
              routineTemplateId={props.routine.id}
              label="Entrenar"
              className="mt-primary-pill mt-primary-pill--compact"
            />
          )}
          <Link href="/app/routines" className="mt-secondary-pill">
            Gestionar
          </Link>
        </div>
      </div>
    </article>
  );
}

function RoutineMiniCard(props: {
  routine: AppSnapshot["routines"][number];
  isActive: boolean;
  activeSessionId: string | null;
}) {
  return (
    <article className={cn("mt-routine-mini-card", props.isActive && "mt-routine-mini-card--active")}>
      <div className="mt-routine-mini-card__copy">
        <span>{props.isActive ? "Sesion abierta" : "Plantilla"}</span>
        <strong>{props.routine.name}</strong>
        <p>
          {props.routine.itemCount > 0
            ? `${props.routine.itemCount} ejercicios listos`
            : "Completa la rutina con ejercicios de tu pool"}
        </p>
      </div>

      {props.isActive && props.activeSessionId ? (
        <Link href={`/app/workouts/${props.activeSessionId}`} className="mt-mini-pill">
          Continuar
        </Link>
      ) : (
        <Link href={`/app/routines/${props.routine.id}`} className="mt-mini-pill mt-mini-pill--ghost">
          Abrir
        </Link>
      )}
    </article>
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
  const [composerMode, setComposerMode] = useState<
    "plan-gym" | "plan-running" | "log-gym" | "log-running"
  >("plan-gym");
  const selectedDay =
    props.snapshot.schedule.days.find((day) => day.isoDate === selectedDate) ??
    props.snapshot.schedule.days[0];
  const weekPlanned = props.snapshot.schedule.days.reduce((acc, day) => acc + day.plannedCount, 0);
  const weekLogged = props.snapshot.schedule.days.reduce((acc, day) => acc + day.completedCount, 0);
  const composerMeta = {
    "plan-gym": {
      title: "Planifica gym",
      description: "Deja fijada la rutina del dia y la app la propondrá cuando toque entrenar.",
    },
    "plan-running": {
      title: "Planifica running",
      description: "Agenda una salida suave, tempo o libre aunque no sepas aun la distancia.",
    },
    "log-gym": {
      title: "Registrar gym",
      description: "Lanza un entreno hoy o a posteriori y deja los sets guardados con fecha real.",
    },
    "log-running": {
      title: "Registrar running",
      description: "Guarda una carrera hecha y súmala al historial y al resumen al instante.",
    },
  }[composerMode];

  return (
    <div className="mt-screen">
      <section className="mt-planner-card mt-planner-card--feature">
        <div className="mt-planner-card__head">
          <div>
            <p className="mt-kicker">Agenda</p>
            <h2>{props.snapshot.schedule.weekRangeLabel}</h2>
          </div>
          <span className="mt-chip mt-chip--ghost">
            {selectedDay?.plannedCount ?? 0} eventos
          </span>
        </div>

        <div className="mt-agenda-overview">
          <div className="mt-agenda-overview__copy">
            <p className="mt-kicker">Dia activo</p>
            <h3>{selectedDay?.dayLabel}</h3>
            <p>
              {selectedDay?.plannedCount ?? 0} planificados · {selectedDay?.completedCount ?? 0} registrados
            </p>
          </div>
          <div className="mt-agenda-overview__stats">
            <div className="mt-agenda-overview__stat">
              <span>Semana</span>
              <strong>{weekPlanned}</strong>
            </div>
            <div className="mt-agenda-overview__stat">
              <span>Registrados</span>
              <strong>{weekLogged}</strong>
            </div>
            <div className="mt-agenda-overview__stat">
              <span>Gym</span>
              <strong>
                {selectedDay?.entries.filter((entry) => entry.entryType === "gym").length ?? 0}
              </strong>
            </div>
            <div className="mt-agenda-overview__stat">
              <span>Run</span>
              <strong>
                {selectedDay?.entries.filter((entry) => entry.entryType === "running").length ?? 0}
              </strong>
            </div>
          </div>
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
          <div className="mt-agenda-dayhead">
            <div>
              <p className="mt-kicker">Bloques del dia</p>
              <h3>{selectedDay?.dayLabel ?? "Semana"}</h3>
            </div>
            <span className="mt-chip mt-chip--ghost">
              {selectedDay?.entries.length ?? 0} eventos
            </span>
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

      <section className="mt-agenda-composer">
        <div className="mt-agenda-composer__head">
          <div>
            <p className="mt-kicker">Composer</p>
            <h3>{composerMeta.title}</h3>
          </div>
          <p>{composerMeta.description}</p>
        </div>

        <div className="mt-agenda-composer__tabs">
          {[
            { key: "plan-gym", label: "Gym", icon: Dumbbell },
            { key: "plan-running", label: "Run", icon: Footprints },
            { key: "log-gym", label: "Gym hecho", icon: PencilLine },
            { key: "log-running", label: "Run hecho", icon: Route },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "mt-agenda-composer__tab",
                composerMode === item.key && "mt-agenda-composer__tab--active",
              )}
              onClick={() =>
                setComposerMode(item.key as "plan-gym" | "plan-running" | "log-gym" | "log-running")
              }
            >
              <item.icon size={15} strokeWidth={2.2} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-agenda-composer__panel">
          {composerMode === "plan-gym" ? (
            <ScheduleGymCard snapshot={props.snapshot} selectedDate={selectedDate} />
          ) : null}
          {composerMode === "plan-running" ? (
            <ScheduleRunCard selectedDate={selectedDate} />
          ) : null}
          {composerMode === "log-gym" ? (
            <GymLogCard snapshot={props.snapshot} selectedDate={selectedDate} />
          ) : null}
          {composerMode === "log-running" ? (
            <RunLogCard selectedDate={selectedDate} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SummaryScreen(props: {
  snapshot: AppSnapshot;
}) {
  const weekRange = splitRangeLabel(props.snapshot.schedule.weekRangeLabel);
  const [mode, setMode] = useState<"general" | "body" | "running">("body");
  const [scope, setScope] = useState<"week" | "month" | "total">("month");
  const [selectedGymRecordId, setSelectedGymRecordId] = useState(
    props.snapshot.summary.gymRecords[0]?.exerciseId ?? "",
  );

  const selectedGymRecord =
    props.snapshot.summary.gymRecords.find((record) => record.exerciseId === selectedGymRecordId) ??
    props.snapshot.summary.gymRecords[0] ??
    null;
  const bodyRecords = props.snapshot.summary.gymRecords.slice(0, 6);
  const gymSessions = parseMetricNumber(props.snapshot.summary.gym[scope].sessions);
  const runningSessions = parseMetricNumber(props.snapshot.summary.running[scope].sessions);
  const routinesCount = props.snapshot.routines.length;
  const totalMix = Math.max(gymSessions + runningSessions + routinesCount, 1);
  const generalMix = {
    gym: Math.max(0.12, gymSessions / totalMix),
    running: Math.max(0.12, runningSessions / totalMix),
    routines: Math.max(0.08, routinesCount / totalMix),
  };

  return (
    <div className="mt-screen">
      <section className="mt-summary-card">
        <div className="mt-summary-card__head">
          <div>
            <p className="mt-kicker">Analytics</p>
            <h2>Resumen</h2>
          </div>
        </div>

        <div className="mt-range-row mt-range-row--analytics">
          <div className="mt-range-pill">
            <CalendarDays size={15} strokeWidth={2.2} />
            <span>{weekRange.start}</span>
          </div>
          <div className="mt-range-pill mt-range-pill--cross" aria-hidden="true">
            ×
          </div>
          <div className="mt-range-pill">
            <CalendarDays size={15} strokeWidth={2.2} />
            <span>{weekRange.end}</span>
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
            <section className="mt-summary-hero-card">
              <div className="mt-summary-hero-card__head">
                <div>
                  <p className="mt-kicker">General</p>
                  <h3>Balance del bloque</h3>
                </div>
                <span className="mt-chip mt-chip--lime">{scope === "week" ? "7 dias" : scope === "month" ? "30 dias" : "Total"}</span>
              </div>

              <div className="mt-summary-hero-card__body">
                <div
                  className="mt-summary-mix"
                  style={
                    {
                      "--mix-gym": `${generalMix.gym}`,
                      "--mix-running": `${generalMix.running}`,
                      "--mix-routines": `${generalMix.routines}`,
                    } as CSSProperties
                  }
                >
                  <div className="mt-summary-mix__center">
                    <span>Bloque</span>
                    <strong>{gymSessions + runningSessions}</strong>
                  </div>
                </div>

                <div className="mt-summary-legend">
                  <SummaryLegend tone="pink" label="Gym" value={props.snapshot.summary.gym[scope].sessions} />
                  <SummaryLegend tone="lime" label="Running" value={props.snapshot.summary.running[scope].sessions} />
                  <SummaryLegend tone="cyan" label="Rutinas" value={`${routinesCount}`} />
                </div>
              </div>
            </section>

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
            <section className="mt-body-stage">
              <div className="mt-body-stage__hud">
                <div className="mt-body-stage__hud-item">
                  <span>Serie top</span>
                  <strong>{selectedGymRecord?.weightLabel ?? "--"}</strong>
                </div>
                <div className="mt-body-stage__hud-item">
                  <span>Records</span>
                  <strong>{props.snapshot.summary.gymRecords.length}</strong>
                </div>
              </div>

              <div className="mt-body-stage__art">
                <Image
                  src="/media/anatomy-mannequin.svg"
                  alt="Anatomia muscular"
                  fill
                  sizes="(max-width: 768px) 100vw, 44vw"
                  className="mt-body-stage__image"
                />

                <div className="mt-body-stage__overlay" />

                {selectedGymRecord ? (
                  <div className="mt-body-stage__measure">
                    <div>
                      <strong>{selectedGymRecord.exerciseName}</strong>
                      <span>Top set · {selectedGymRecord.dateLabel}</span>
                    </div>
                    <div className="mt-body-stage__measure-aside">
                      <small>Actual</small>
                      <em>{selectedGymRecord.weightLabel}</em>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-body-stage__list">
                {bodyRecords.length > 0 ? (
                  bodyRecords.map((record) => (
                    <button
                      key={record.exerciseId}
                      type="button"
                      className={cn(
                        "mt-body-stage__row",
                        selectedGymRecord?.exerciseId === record.exerciseId && "mt-body-stage__row--active",
                      )}
                      onClick={() => setSelectedGymRecordId(record.exerciseId)}
                    >
                      <span>{record.exerciseName}</span>
                      <div className="mt-body-stage__row-main">
                        <strong>{record.weightLabel}</strong>
                        <ArrowUpRight size={13} strokeWidth={2.2} />
                      </div>
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
                <>
                  <label className="mt-field">
                    <span>Ejercicio</span>
                    <select
                      value={selectedGymRecord?.exerciseId ?? ""}
                      onChange={(event) => setSelectedGymRecordId(event.target.value)}
                    >
                      {props.snapshot.summary.gymRecords.map((record) => (
                        <option key={record.exerciseId} value={record.exerciseId}>
                          {record.exerciseName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedGymRecord ? (
                    <div className="mt-record-row mt-record-row--feature">
                      <div>
                        <strong>{selectedGymRecord.exerciseName}</strong>
                        <span>Serie mas pesada registrada el {selectedGymRecord.dateLabel}</span>
                      </div>
                      <em>{selectedGymRecord.weightLabel}</em>
                    </div>
                  ) : null}
                </>
              ) : null}
              {props.snapshot.summary.gymRecords.length > 0 ? (
                props.snapshot.summary.gymRecords.slice(0, 6).map((record) => (
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

            <div className="mt-summary-grid">
              <SummaryMetricCard
                icon={Footprints}
                label="Running"
                metric={props.snapshot.summary.running[scope]}
                tone="lime"
              />
              <SummaryMetricCard
                icon={CalendarDays}
                label="Agenda"
                metric={{
                  sessions: `${props.snapshot.schedule.todayEntries.filter((entry) => entry.entryType === "running").length}`,
                  support: "running hoy",
                  highlight: props.snapshot.summary.runningRecords.longestDistance,
                }}
                tone="violet"
              />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryLegend(props: {
  tone: "pink" | "lime" | "cyan";
  label: string;
  value: string;
}) {
  return (
    <div className="mt-summary-legend__item">
      <span className={cn("mt-summary-legend__swatch", `mt-summary-legend__swatch--${props.tone}`)} />
      <div>
        <strong>{props.label}</strong>
        <span>{props.value}</span>
      </div>
    </div>
  );
}

function ProfileScreen(props: {
  profile: UserProfile;
  snapshot: AppSnapshot;
}) {
  const weekPlanned = props.snapshot.schedule.days.reduce((acc, day) => acc + day.plannedCount, 0);
  const totalPool = props.snapshot.librarySummary.systemCount + props.snapshot.librarySummary.customCount;
  const metrics = [
    { label: "Altura", value: props.profile.heightCm ? `${props.profile.heightCm} cm` : "--" },
    { label: "Peso", value: props.profile.weightKg ? `${props.profile.weightKg} kg` : "--" },
    { label: "Rutinas", value: `${props.snapshot.routines.length}` },
    { label: "Pool", value: `${totalPool}` },
  ];

  return (
    <div className="mt-screen">
      <section className="mt-profile-card mt-profile-card--feature">
        <div className="mt-profile-card__art" aria-hidden="true">
          <Image
            src="/media/anatomy-mannequin.svg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="mt-profile-card__image"
          />
        </div>
        <div className="mt-profile-card__veil" aria-hidden="true" />

        <div className="mt-profile-card__surface">
          <div className="mt-profile-card__hero">
            <div className="mt-profile-card__identity">
              <div className="mt-profile-avatar">{props.profile.displayName.charAt(0)}</div>
              <div>
                <p className="mt-kicker">Perfil</p>
                <h2>{props.profile.displayName}</h2>
                <span>{props.snapshot.goalLabel}</span>
              </div>
            </div>
            <span className="mt-chip mt-chip--violet">{props.snapshot.levelLabel}</span>
          </div>

          <div className="mt-profile-metrics mt-profile-metrics--grid">
            {metrics.map((metric) => (
              <div key={metric.label} className="mt-profile-metrics__item mt-profile-metrics__item--detailed">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-profile-summary-row">
            <div className="mt-profile-summary-pill">
              <span>Semana</span>
              <strong>{weekPlanned} bloques</strong>
            </div>
            <div className="mt-profile-summary-pill mt-profile-summary-pill--ghost">
              <span>Mes</span>
              <strong>
                {props.snapshot.summary.gym.month.sessions} gym · {props.snapshot.summary.running.month.sessions} run
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-profile-links mt-profile-links--grid">
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

        <div className="mt-mini-panel mt-profile-note">
          <div className="mt-mini-panel__icon">
            <CalendarDays size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p>Bloque activo</p>
            <span>Tu agenda y tu resumen ya están conectados al mismo sistema de progreso.</span>
          </div>
        </div>

        <Link href="/logout" className="mt-secondary-pill mt-secondary-pill--block">
          Cerrar sesion
        </Link>
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
            sessionDate={props.entry.scheduledDate}
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

function GymLogCard(props: {
  snapshot: AppSnapshot;
  selectedDate: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(startWorkoutSessionAction, initialWorkoutLaunchState);

  useEffect(() => {
    if (!state.nextPath) {
      return;
    }

    router.push(state.nextPath);
    router.refresh();
  }, [router, state.nextPath]);

  return (
    <section className="mt-form-card">
      <div className="mt-form-card__head">
        <div>
          <p className="mt-kicker">Registrar</p>
          <h3>Gym hecho</h3>
        </div>
        <span className="mt-chip mt-chip--violet">Manual o en directo</span>
      </div>

      <form action={formAction} className="mt-form-grid">
        <label className="mt-field">
          <span>Fecha</span>
          <input type="date" name="sessionDate" defaultValue={props.selectedDate} required />
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

        <GymSubmitButton
          className="mt-action-button mt-action-button--ghost"
          disabled={props.snapshot.routines.length === 0}
        />
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

function GymSubmitButton(props: {
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={props.className} disabled={pending || props.disabled}>
      <Dumbbell size={16} strokeWidth={2.3} />
      {pending ? "Abriendo..." : "Registrar gym"}
    </button>
  );
}

function RingMetric(props: {
  metric: AppSnapshot["focusMetrics"][number];
}) {
  const Icon = props.metric.key === "gym" ? Dumbbell : props.metric.key === "running" ? Footprints : Target;
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
      <span className="mt-ring-card__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </span>
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
