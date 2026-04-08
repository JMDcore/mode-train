"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  History,
  House,
  Pause,
  PencilLine,
  Play,
  Plus,
  RefreshCcw,
  Route,
  TrendingUp,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { QuickRunForm } from "@/components/training/quick-run-form";
import { QuickRoutineForm } from "@/components/training/quick-routine-form";
import { StartWorkoutButton } from "@/components/training/start-workout-button";
import { StarterWeekButton } from "@/components/training/starter-week-button";
import { cn } from "@/lib/utils";
import type { AppSnapshot } from "@/server/app/snapshot";
import type { AuthUser } from "@/server/auth/user";
import type { UserProfile } from "@/server/profile";

const transition = {
  duration: 0.44,
  ease: [0.22, 1, 0.36, 1] as const,
};

const tabs = [
  { key: "home", label: "Inicio", icon: House },
  { key: "train", label: "Entrena", icon: Dumbbell },
  { key: "social", label: "Circulo", icon: Users },
  { key: "profile", label: "Yo", icon: User },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const headerCopy: Record<TabKey, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Mode Train", title: "" },
  train: { eyebrow: "Programas", title: "" },
  social: { eyebrow: "Privado", title: "" },
  profile: { eyebrow: "Cuenta", title: "" },
};

const weekOrder = [
  { key: "monday", shortLabel: "L" },
  { key: "tuesday", shortLabel: "M" },
  { key: "wednesday", shortLabel: "X" },
  { key: "thursday", shortLabel: "J" },
  { key: "friday", shortLabel: "V" },
  { key: "saturday", shortLabel: "S" },
  { key: "sunday", shortLabel: "D" },
] as const;

const featuredPrograms = [
  {
    id: "upper-power",
    title: "Torso potente",
    body: "Pecho, hombro y brazo con lectura clara y fuerza limpia.",
    difficulty: "Intermedio",
    duration: "4 semanas",
    progress: "24 / 36",
    imageSrc: "/media/anatomy-mannequin.svg",
    imagePosition: "center 22%",
    accent: "violet" as const,
  },
  {
    id: "shape-mode",
    title: "Shape limpio",
    body: "Torso visual, hombro fino y volumen medio bien controlado.",
    difficulty: "Shape",
    duration: "3 semanas",
    progress: "12 / 18",
    imageSrc: "/media/anatomy-mannequin.svg",
    imagePosition: "center 14%",
    accent: "lime" as const,
  },
] as const;

function normalizeCopyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function translateGoal(value: string) {
  const normalized = normalizeCopyValue(value);

  if (normalized.includes("musculo") || normalized.includes("muscle")) {
    return "Ganar musculo";
  }

  if (normalized.includes("grasa") || normalized.includes("fat")) {
    return "Perder grasa";
  }

  if (normalized.includes("fuerte") || normalized.includes("strong")) {
    return "Ser mas fuerte";
  }

  if (normalized.includes("hibrid") || normalized.includes("hybrid")) {
    return "Fitness hibrido";
  }

  if (normalized.includes("consisten")) {
    return "Crear constancia";
  }

  return value;
}

function translateLevel(value: string) {
  const normalized = normalizeCopyValue(value);

  if (normalized.includes("beginner") || normalized.includes("principiante")) {
    return "Principiante";
  }

  if (normalized.includes("intermediate") || normalized.includes("intermedio")) {
    return "Intermedio";
  }

  if (normalized.includes("advanced") || normalized.includes("avanzado")) {
    return "Avanzado";
  }

  return value;
}

function extractFirstName(value: string) {
  return value.trim().split(/\s+/)[0] ?? value;
}

function formatDashboardDate() {
  const value = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ModeTrainApp(props: {
  user: AuthUser;
  profile: UserProfile;
  snapshot: AppSnapshot;
  completionMessage?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const header = headerCopy[activeTab];

  return (
    <div className="app-wrap">
      <Backdrop />

      <motion.main
        initial={{ opacity: 0, y: 18, scale: 0.988 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...transition, duration: 0.58 }}
        className="app-shell"
      >
        <header className={cn("app-header", !header.title && "app-header--minimal")}>
          <div>
            <p className="app-eyebrow">{header.eyebrow}</p>
            {header.title ? <h1 className="app-title">{header.title}</h1> : null}
          </div>

          <div className="header-actions">
            <Link href="/app/history" className="icon-button" aria-label="Historial">
              <History size={17} strokeWidth={2.2} />
            </Link>
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
              exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
              transition={transition}
              className="screen-stack"
            >
              {activeTab === "home" ? (
                <HomeScreen
                  user={props.user}
                  completionMessage={props.completionMessage ?? null}
                  snapshot={props.snapshot}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              ) : null}
              {activeTab === "train" ? <TrainScreen snapshot={props.snapshot} /> : null}
              {activeTab === "social" ? <SocialScreen snapshot={props.snapshot} /> : null}
              {activeTab === "profile" ? (
                <ProfileScreen
                  user={props.user}
                  profile={props.profile}
                  snapshot={props.snapshot}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="app-footer">
          <LayoutGroup id="tab-bar">
            <nav className="tab-bar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn("tab-item", active && "tab-item--active")}
                    aria-label={tab.label}
                    aria-pressed={active}
                  >
                    {active ? (
                      <motion.span
                        layoutId="tab-highlight"
                        className="tab-item__highlight"
                        transition={transition}
                      />
                    ) : null}
                    <span className="tab-item__content">
                      <Icon size={18} strokeWidth={2.15} />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>
        </footer>
      </motion.main>
    </div>
  );
}

function HomeScreen(props: {
  user: AuthUser;
  snapshot: AppSnapshot;
  onNavigate: (tab: TabKey) => void;
  completionMessage: string | null;
}) {
  const heroMeta = props.snapshot.heroMeta.filter(Boolean).join(" · ");
  const greetingName = extractFirstName(props.user.displayName);
  const notificationCount = Math.max(1, props.snapshot.socialCounts.notifications);
  const routinesStat = props.snapshot.quickStats[1];
  const baseStat = props.snapshot.quickStats[2];
  const sessionsPlanned = Math.max(props.snapshot.weeklyPlan.length, props.snapshot.todayItems.length);

  return (
    <>
      {props.completionMessage ? (
        <SurfaceCard className="status-card">
          <div className="status-card__icon">
            <Zap size={16} strokeWidth={2.3} />
          </div>
          <div>
            <p className="row-card__title">{props.completionMessage}</p>
            <p className="row-card__meta">Tu panel ya esta actualizado.</p>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard tone="accent" className="dashboard-greeting-card">
        <div className="dashboard-greeting-card__profile">
          <div className="dashboard-greeting-card__avatar">{props.user.initials}</div>
          <div>
            <p className="dashboard-greeting-card__date">{formatDashboardDate()}</p>
            <h2 className="dashboard-greeting-card__title">Hola, {greetingName}</h2>
          </div>
        </div>

        <button type="button" className="dashboard-greeting-card__notify" aria-label="Notificaciones">
          <span className="dashboard-greeting-card__notify-count">{notificationCount}</span>
          <Bell size={18} strokeWidth={2.2} />
        </button>
      </SurfaceCard>

      <SurfaceCard tone="accent" className="analytics-board analytics-board--home">
        <div className="analytics-board__program-status">
          <div>
            <p className="analytics-board__kicker">Actual</p>
            <h3 className="analytics-board__status-title">
              {props.snapshot.activeWorkoutSummary
                ? "1 bloque en marcha"
                : props.snapshot.routines.length > 0
                  ? `${props.snapshot.routines.length} bloques activos`
                  : "Sin programas"}
            </h3>
          </div>

          <div className="program-bubble-stack">
            <span className="program-bubble program-bubble--violet">
              <Dumbbell size={13} strokeWidth={2.2} />
            </span>
            <span className="program-bubble program-bubble--lime">
              <Route size={13} strokeWidth={2.2} />
            </span>
            <span className="program-bubble program-bubble--pink">
              <Zap size={13} strokeWidth={2.2} />
            </span>
            <button type="button" className="program-bubble program-bubble--ghost">
              Nuevo
            </button>
          </div>
        </div>

        <div className="period-selector">
          <button type="button" className="period-selector__arrow" aria-label="Periodo anterior">
            <ChevronLeft size={16} strokeWidth={2.3} />
          </button>
          <button type="button" className="period-selector__label">
            Este mes
          </button>
          <button type="button" className="period-selector__arrow" aria-label="Periodo siguiente">
            <ChevronRight size={16} strokeWidth={2.3} />
          </button>
        </div>

        <div className="analytics-board__metrics analytics-board__metrics--hero">
          <OrbitMetric
            label="Ritmo"
            value={`${props.snapshot.readiness}`}
            note="Hoy"
            progress={props.snapshot.readiness}
            tone="pink"
          />
          <OrbitMetric
            label="Bloques"
            value={routinesStat?.value ?? "0"}
            note="Activos"
            progress={Math.min(100, Number(routinesStat?.value ?? 0) * 22)}
            tone="lime"
          />
          <OrbitMetric
            label="Base"
            value={baseStat?.value ?? "0"}
            note="Items"
            progress={Math.min(100, Number(baseStat?.value ?? 0) * 4)}
            tone="cyan"
          />
        </div>

        <div className="analytics-board__program analytics-board__program--home">
          <div className="analytics-board__copy">
            <p className="analytics-board__kicker">Programa actual</p>
            <h2 className="analytics-board__headline">{props.snapshot.heroTitle}</h2>
            <p className="analytics-board__subline">
              {heroMeta || "Activa un bloque limpio y empieza a generar progreso real."}
            </p>
          </div>
        </div>

        <div className="dashboard-inline-actions">
          {props.snapshot.activeWorkoutSummary ? (
            <Link
              href={`/app/workouts/${props.snapshot.activeWorkoutSummary.sessionId}`}
              className="dashboard-inline-actions__button dashboard-inline-actions__button--cta"
            >
              <Play size={15} strokeWidth={2.2} />
              Reanudar
            </Link>
          ) : props.snapshot.canGenerateStarterWeek ? (
            <StarterWeekButton className="dashboard-inline-actions__button dashboard-inline-actions__button--cta" />
          ) : (
            <button type="button" className="dashboard-inline-actions__button">
              <Pause size={15} strokeWidth={2.2} />
              Pausar bloque
            </button>
          )}

          <button type="button" className="dashboard-inline-actions__button dashboard-inline-actions__button--accent">
            <RefreshCcw size={15} strokeWidth={2.2} />
            Cambiar plan
          </button>
        </div>

        <div className="analytics-board__footer analytics-board__footer--home">
          <WeekStrip weeklyPlan={props.snapshot.weeklyPlan} />
          <div className="analytics-board__note analytics-board__note--home">
            <span>Semana</span>
            <strong>{sessionsPlanned} dias</strong>
            <p>
              {props.snapshot.activeWorkoutSummary
                ? `${props.snapshot.activeWorkoutSummary.completedExercises}/${props.snapshot.activeWorkoutSummary.totalExercises} ejercicios ya tocados`
                : props.snapshot.canGenerateStarterWeek
                  ? "Genera tu primera semana con un toque."
                  : `${props.snapshot.weeklyPlan.length} dias planificados para seguir el bloque.`}
            </p>
          </div>
        </div>
      </SurfaceCard>

      {props.snapshot.activeWorkoutSummary ? (
        <ActiveWorkoutCard summary={props.snapshot.activeWorkoutSummary} compact />
      ) : null}

      <div className="dashboard-grid">
        <SurfaceCard className="module-panel">
          <div className="section-panel-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <CalendarDays size={15} strokeWidth={2.2} />
              </span>
              <span>Hoy</span>
            </div>
            <span className="meta-pill">
              {props.snapshot.todayItems.length > 0 ? `${props.snapshot.todayItems.length} items` : "Sin carga"}
            </span>
          </div>
          <div className="list-stack">
            {props.snapshot.todayItems.length > 0 ? (
              props.snapshot.todayItems.map((item) => (
                <RowCard
                  key={`${item.kind}-${item.title}`}
                  icon={
                    item.kind === "run"
                      ? Footprints
                      : item.kind === "library"
                        ? Route
                        : Dumbbell
                  }
                  title={item.title}
                  meta={item.meta}
                />
              ))
            ) : (
              <EmptyCard
                title="Nada pendiente"
                body="Cuando montes tu semana, veras aqui el foco de hoy."
              />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="module-panel module-panel--quiet">
          <div className="section-panel-head">
            <div className="section-head__title">
              <span className="section-head__icon">
                <Activity size={15} strokeWidth={2.2} />
              </span>
              <span>Actividad reciente</span>
            </div>
            <span className="summary-panel__meta">Ultimo cierre</span>
          </div>
          <div className="list-stack">
            {props.snapshot.recentActivity.length > 0 ? (
              props.snapshot.recentActivity.map((item) => (
                <RowCard
                  key={item.id}
                  icon={item.kind === "run" ? Footprints : Dumbbell}
                  title={item.title}
                  meta={item.meta}
                />
              ))
            ) : (
              <EmptyCard
                title="Actividad vacia"
                body="Empieza una sesion o guarda una carrera y apareceran aqui."
              />
            )}
          </div>
        </SurfaceCard>
      </div>

      <div className="insight-pair-grid">
          <InsightLinkCard
          href="/app/history"
          icon={History}
          title="Historial"
          body="Todo lo que ya has cerrado."
        />
        <InsightLinkCard
          href="/app/progress"
          icon={TrendingUp}
          title="Progreso"
          body="Tus ejercicios y bloques vivos."
        />
      </div>

      <section className="section-stack">
        <div className="section-head">
          <div className="section-head__title">
            <span className="section-head__icon">
              <Dumbbell size={15} strokeWidth={2.2} />
            </span>
            <span>Programas</span>
          </div>
        </div>
        <div className="program-showcase-grid">
          {featuredPrograms.map((program, index) => (
            <ProgramShowcaseCard
              key={program.id}
              program={program}
              actionLabel={index === 0 ? "Continuar" : "Ver"}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function TrainScreen(props: { snapshot: AppSnapshot }) {
  const primaryRoutine = props.snapshot.routines[0];
  const routineCount = `${props.snapshot.routines.length}`;
  const planCount = `${props.snapshot.weeklyPlan.length}`;

  return (
    <>
      <SurfaceCard tone="accent" className="train-canvas">
        <div className="train-canvas__head">
          <p className="analytics-board__eyebrow">Programas</p>
          <span className="meta-pill">{routineCount}</span>
        </div>

        <div className="train-canvas__tabs">
          <button type="button" className="train-canvas__tab train-canvas__tab--active">Mios</button>
          <button type="button" className="train-canvas__tab">Base</button>
          <button type="button" className="train-canvas__tab">Drafts</button>
        </div>

        <div className="train-canvas__switch">
          <button type="button" className="train-canvas__switch-item train-canvas__switch-item--active">Casa</button>
          <button type="button" className="train-canvas__switch-item">Gym</button>
        </div>

        <div className="program-showcase-grid">
          {featuredPrograms.map((program, index) => (
            <ProgramShowcaseCard
              key={program.id}
              program={program}
              actionLabel={index === 0 ? "Continuar" : "Abrir"}
            />
          ))}
        </div>

        <div className="train-canvas__footer">
          <div>
            <p className="analytics-board__kicker">Bloque principal</p>
            <h3 className="analytics-board__status-title">
              {props.snapshot.activeWorkoutSummary?.routineName ??
                primaryRoutine?.name ??
                "Prepara tu semana"}
            </h3>
          </div>

          {props.snapshot.activeWorkoutSummary ? (
            <Link
              href={`/app/workouts/${props.snapshot.activeWorkoutSummary.sessionId}`}
              className="primary-button"
            >
              <Play size={16} strokeWidth={2.3} />
              Reanudar
            </Link>
          ) : props.snapshot.canGenerateStarterWeek ? (
            <StarterWeekButton className="primary-button" />
          ) : (
            <div className="meta-pill">
              <CalendarDays size={13} strokeWidth={2.2} />
              {planCount} dias
            </div>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="module-panel">
        <div className="section-panel-head">
          <div className="section-head__title">
            <span className="section-head__icon">
              <Dumbbell size={15} strokeWidth={2.2} />
            </span>
            <span>Rutinas</span>
          </div>
          <span className="meta-pill">{props.snapshot.routines.length}</span>
        </div>

        <QuickRoutineForm />
        <div className="list-stack">
          {props.snapshot.routines.length > 0 ? (
            props.snapshot.routines.map((routine) => (
              <WorkoutCard
                key={routine.id}
                icon={Dumbbell}
                name={routine.name}
                meta={`${routine.itemCount} ejercicios`}
                chips={routine.itemCount > 0 ? ["Lista"] : ["Vacia"]}
                footer={
                  <RoutineCardFooter
                    activeWorkoutSummary={props.snapshot.activeWorkoutSummary}
                    itemCount={routine.itemCount}
                    routineId={routine.id}
                  />
                }
              />
            ))
          ) : (
            <EmptyCard
              title="Aun no tienes rutinas"
              body="Crea una y dejala lista para entrenar."
            />
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="module-panel">
        <div className="section-panel-head">
          <div className="section-head__title">
            <span className="section-head__icon">
              <CalendarDays size={15} strokeWidth={2.2} />
            </span>
            <span>Semana</span>
          </div>
          <span className="summary-panel__meta">
            {props.snapshot.weeklyPlan.length > 0 ? `${props.snapshot.weeklyPlan.length} dias` : "Sin plan"}
          </span>
        </div>
        <div className="list-stack">
          {props.snapshot.weeklyPlan.length > 0 ? (
            props.snapshot.weeklyPlan.map((entry) => (
              <RowCard
                key={entry.id}
                icon={entry.kind === "run" ? Footprints : CalendarDays}
                title={entry.dayLabel}
                meta={`${entry.title} · ${entry.meta}`}
              />
            ))
          ) : (
            <EmptyCard
              title="Sin plan semanal"
              body="La semana inicial te deja la base lista en un toque."
            />
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="module-panel module-panel--quiet">
        <div className="section-panel-head">
          <div className="section-head__title">
            <span className="section-head__icon">
              <Footprints size={15} strokeWidth={2.2} />
            </span>
            <span>Carrera</span>
          </div>
          <span className="summary-panel__meta">Registro rapido</span>
        </div>
        <QuickRunForm />
      </SurfaceCard>

      <SurfaceCard className="module-panel">
        <div className="section-panel-head">
          <div className="section-head__title">
            <span className="section-head__icon">
              <Route size={15} strokeWidth={2.2} />
            </span>
            <span>Biblioteca</span>
          </div>
          <span className="summary-panel__meta">{props.snapshot.library.length} ejercicios</span>
        </div>
        <div className="list-stack">
          {props.snapshot.library.slice(0, 5).map((exercise) => (
            <RowCard
              key={exercise.id}
              icon={exercise.primaryMuscleGroup === "Cardio" ? Footprints : Activity}
              title={exercise.name}
              meta={`${exercise.primaryMuscleGroup} · ${exercise.equipment}`}
            />
          ))}
        </div>
      </SurfaceCard>
    </>
  );
}

function SocialScreen(props: { snapshot: AppSnapshot }) {
  return (
    <>
      <SurfaceCard tone="accent" className="hero-card hero-card--compact">
        <div className="hero-card__copy">
          <div className="hero-chip">
            <Users size={14} strokeWidth={2.2} />
            Solo amistades
          </div>
          <h2 className="hero-card__title">Circulo privado</h2>
          <p className="hero-card__subline">
            Progreso compartido solo con la gente que tu aceptes.
          </p>
        </div>

        <div className="hero-card__footer hero-card__footer--stack">
          <div className="pill-soft">
            <Users size={14} strokeWidth={2.2} />
            {props.snapshot.socialCounts.friends} amistades
          </div>
          <div className="pill-soft">
            <Plus size={14} strokeWidth={2.2} />
            {props.snapshot.socialCounts.pending} pendientes
          </div>
        </div>
      </SurfaceCard>

      <div className="social-stat-grid">
        <MetricTile icon={Users} label="Amistades" value={`${props.snapshot.socialCounts.friends}`} />
        <MetricTile icon={Activity} label="Avisos" value={`${props.snapshot.socialCounts.notifications}`} />
        <MetricTile icon={Plus} label="Pendientes" value={`${props.snapshot.socialCounts.pending}`} />
      </div>

      <ScreenSection icon={Activity} title="Preview">
        <div className="list-stack">
          {props.snapshot.socialCounts.friends > 0 ? (
            props.snapshot.socialPreview.map((item) => (
              <FeedCard
                key={item.name}
                name={item.name}
                title={item.caption}
                value={item.value}
                tint={item.tint}
              />
            ))
          ) : (
            <EmptyCard
              title="Tu circulo esta vacio"
              body="La capa social ya esta preparada para cuando invites a tu gente."
            />
          )}
        </div>
      </ScreenSection>

      <SurfaceCard>
        <div className="challenge-card">
          <div className="challenge-card__icon">
            <Trophy size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p className="card-kicker">Reto</p>
            <h3 className="challenge-card__title">4 sesiones esta semana</h3>
          </div>
          <ChevronRight size={18} strokeWidth={2.2} className="history-entry__chevron" />
        </div>
      </SurfaceCard>
    </>
  );
}

function ProfileScreen(props: {
  user: AuthUser;
  profile: UserProfile;
  snapshot: AppSnapshot;
}) {
  return (
    <>
      <SurfaceCard tone="accent" className="hero-card hero-card--compact">
        <div className="profile-head">
          <div className="profile-head__avatar">{props.user.initials}</div>
          <div>
            <p className="card-kicker">Mode Train</p>
            <h2 className="compact-hero__title">{props.user.displayName}</h2>
            <p className="profile-head__meta">{props.user.email}</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="stat-grid">
        {props.snapshot.profileMetrics.map((item) => (
          <SurfaceCard key={item.label} className="metric-tile">
            <div className="metric-tile__head">
              <span className="tile-label">{item.label}</span>
            </div>
            <p className="tile-value">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      <ScreenSection icon={Trophy} title="Base">
        <div className="list-stack">
          <CompactRow label="Objetivo" value={translateGoal(props.profile.goal)} />
          <CompactRow label="Nivel" value={translateLevel(props.profile.experienceLevel)} />
          <CompactRow
            label="Frecuencia"
            value={`${props.profile.preferredWeeklySessions ?? 0} sesiones`}
          />
        </div>
      </ScreenSection>

      <div className="profile-link-grid">
        <Link href="/onboarding" className="ghost-button">
          <PencilLine size={15} strokeWidth={2.3} />
          Editar perfil
        </Link>
        <Link href="/app/history" className="ghost-button">
          <History size={15} strokeWidth={2.3} />
          Ver historial
        </Link>
        <Link href="/app/progress" className="ghost-button">
          <TrendingUp size={15} strokeWidth={2.3} />
          Ver progreso
        </Link>
      </div>

      <form action="/logout" method="post">
        <button type="submit" className="logout-button">
          Cerrar sesion
        </button>
      </form>
    </>
  );
}

function WeekStrip(props: { weeklyPlan: AppSnapshot["weeklyPlan"] }) {
  return (
    <div className="week-strip">
      {weekOrder.map((day) => {
        const entry = props.weeklyPlan.find((item) => item.dayKey === day.key);
        const toneClass =
          entry?.kind === "run"
            ? "week-strip__ring--cyan"
            : entry
              ? "week-strip__ring--pink"
              : "week-strip__ring--idle";

        return (
          <div
            key={day.key}
            className={cn(
              "week-strip__day",
              entry && "week-strip__day--filled",
              entry?.kind === "run" && "week-strip__day--run",
            )}
          >
            <span className={cn("week-strip__ring", toneClass)}>
              <span className="week-strip__ring-core" />
            </span>
            <small>{day.shortLabel}</small>
          </div>
        );
      })}
    </div>
  );
}

function OrbitMetric(props: {
  label: string;
  value: string;
  note: string;
  progress: number;
  tone: "violet" | "lime" | "cyan" | "pink";
  compact?: boolean;
}) {
  const radius = props.compact ? 19 : 24;
  const strokeWidth = props.compact ? 5 : 6;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(8, Math.min(100, props.progress));
  const dashOffset = circumference * (1 - clampedProgress / 100);
  const boxSize = props.compact ? 48 : 62;
  const center = boxSize / 2;

  return (
    <div className={cn("orbit-metric", props.compact && "orbit-metric--compact")}>
      <div className="orbit-metric__ring">
        <svg viewBox={`0 0 ${boxSize} ${boxSize}`} aria-hidden>
          <circle
            className="orbit-metric__track"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            className={cn("orbit-metric__value", `orbit-metric__value--${props.tone}`)}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference * 0.84 }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="orbit-metric__center">
          <strong>{props.value}</strong>
        </div>
      </div>
      <div className="orbit-metric__copy">
        <span>{props.label}</span>
        <small>{props.note}</small>
      </div>
    </div>
  );
}

function SurfaceCard(props: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "accent";
}) {
  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "surface-card",
        props.tone === "accent" && "surface-card--accent",
        props.className,
      )}
    >
      {props.children}
    </motion.section>
  );
}

function ScreenSection(props: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = props.icon;

  return (
    <section className="section-stack">
      <div className="section-head">
        <div className="section-head__title">
          <span className="section-head__icon">
            <Icon size={15} strokeWidth={2.2} />
          </span>
          <span>{props.title}</span>
        </div>
      </div>
      {props.children}
    </section>
  );
}

function MetricTile(props: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const Icon = props.icon;

  return (
    <SurfaceCard className="metric-tile">
      <div className="metric-tile__head">
        <span className="metric-tile__icon">
          <Icon size={15} strokeWidth={2.2} />
        </span>
        <span className="tile-label">{props.label}</span>
      </div>
      <p className="tile-value">{props.value}</p>
    </SurfaceCard>
  );
}

function RowCard(props: { icon: LucideIcon; title: string; meta: string }) {
  const Icon = props.icon;

  return (
    <div className="row-card">
      <span className="row-card__icon">
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <span className="row-card__copy">
        <span className="row-card__title">{props.title}</span>
        <span className="row-card__meta">{props.meta}</span>
      </span>
    </div>
  );
}

function WorkoutCard(props: {
  icon: LucideIcon;
  name: string;
  meta: string;
  chips: string[];
  footer?: React.ReactNode;
}) {
  const Icon = props.icon;

  return (
    <div className="workout-card">
      <div className="workout-card__main">
        <span className="workout-card__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="workout-card__copy">
          <span className="row-card__title">{props.name}</span>
          <span className="row-card__meta">{props.meta}</span>
          <span className="chip-row">
            {props.chips.map((chip) => (
              <span key={chip} className="chip">
                {chip}
              </span>
            ))}
          </span>
        </span>
      </div>
      {props.footer ? <div className="workout-card__footer">{props.footer}</div> : null}
    </div>
  );
}

function InsightLinkCard(props: {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  const Icon = props.icon;

  return (
    <Link
      href={props.href}
      className="history-entry insight-link-card"
        aria-label={
        props.title === "Historial"
          ? "Ver registro detallado"
          : props.title === "Progreso"
            ? "Ver evolucion detallada"
            : props.title
      }
    >
      <div className="history-entry__main">
        <span className="history-entry__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <div className="history-entry__copy">
          <p className="row-card__title">{props.title}</p>
          <p className="row-card__meta">{props.body}</p>
        </div>
      </div>
      <ChevronRight size={16} strokeWidth={2.2} className="history-entry__chevron" />
    </Link>
  );
}

function ActiveWorkoutCard(props: {
  summary: NonNullable<AppSnapshot["activeWorkoutSummary"]>;
  compact?: boolean;
}) {
  return (
    <SurfaceCard className={cn("active-workout-card", props.compact && "active-workout-card--compact")}>
      <div className="active-workout-card__copy">
        <p className="card-kicker">Sesion activa</p>
        <h3 className="compact-hero__title">{props.summary.routineName}</h3>
        <p className="row-card__meta">
          {props.summary.completedExercises}/{props.summary.totalExercises} ejercicios ·{" "}
          {props.summary.savedSets} sets
        </p>
      </div>

      <Link href={`/app/workouts/${props.summary.sessionId}`} className="secondary-button">
        <Play size={15} strokeWidth={2.3} />
        Reanudar
      </Link>
    </SurfaceCard>
  );
}

function RoutineCardFooter(props: {
  routineId: string;
  itemCount: number;
  activeWorkoutSummary: AppSnapshot["activeWorkoutSummary"];
}) {
  const hasActiveWorkout = Boolean(props.activeWorkoutSummary);
  const isCurrentRoutineActive = props.activeWorkoutSummary?.routineId === props.routineId;

  return (
    <div className="workout-card__actions">
      <Link href={`/app/routines/${props.routineId}`} className="ghost-button">
        <PencilLine size={15} strokeWidth={2.3} />
        {props.itemCount > 0 ? "Editar" : "Completar"}
      </Link>

      {props.itemCount === 0 ? null : hasActiveWorkout && !isCurrentRoutineActive ? (
        <Link
          href={`/app/workouts/${props.activeWorkoutSummary!.sessionId}`}
          className="secondary-button"
        >
          <Play size={15} strokeWidth={2.3} />
          Ver activa
        </Link>
      ) : (
        <StartWorkoutButton
          compact
          routineTemplateId={props.routineId}
          label={isCurrentRoutineActive ? "Reanudar" : "Iniciar"}
          resume={isCurrentRoutineActive}
        />
      )}
    </div>
  );
}

function FeedCard(props: {
  name: string;
  title: string;
  value: string;
  tint: "cyan" | "violet" | "pink";
}) {
  return (
    <SurfaceCard className="feed-card">
      <div className={cn("mini-avatar", `mini-avatar--${props.tint}`)}>{props.name[0]}</div>
      <div className="feed-card__copy">
        <p>{props.name}</p>
        <span>{props.title}</span>
      </div>
      <span className="pill-soft">{props.value}</span>
    </SurfaceCard>
  );
}

function ProgramShowcaseCard(props: {
  program: (typeof featuredPrograms)[number];
  actionLabel: string;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "program-showcase-card",
        props.compact && "program-showcase-card--compact",
      )}
    >
      <div className="program-showcase-card__media">
        <Image
          src={props.program.imageSrc}
          alt={props.program.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="program-showcase-card__image"
          style={{ objectPosition: props.program.imagePosition }}
        />
      </div>

      <div className="program-showcase-card__overlay" />

      <div className="program-showcase-card__content">
        <div className="program-showcase-card__head">
          <span
            className={cn(
              "program-showcase-card__pill",
              `program-showcase-card__pill--${props.program.accent}`,
            )}
          >
            {props.program.difficulty}
          </span>
          <span className="program-showcase-card__meta">{props.program.duration}</span>
        </div>

        <div className="program-showcase-card__copy">
          <span className="program-showcase-card__eyebrow">Bloque curado</span>
          <h3>{props.program.title}</h3>
          <p>{props.program.body}</p>
        </div>

        <div className="program-showcase-card__footer">
          <button type="button" className="program-showcase-card__action">
            <span className="program-showcase-card__play" />
            {props.actionLabel}
          </button>
          <span className="program-showcase-card__progress">{props.program.progress}</span>
        </div>
      </div>
    </article>
  );
}

function CompactRow(props: { label: string; value: string }) {
  return (
    <SurfaceCard className="compact-row">
      <span className="tile-label">{props.label}</span>
      <span className="row-card__title">{props.value}</span>
    </SurfaceCard>
  );
}

function EmptyCard(props: { title: string; body: string }) {
  return (
    <SurfaceCard className="empty-card">
      <p className="row-card__title">{props.title}</p>
      <p className="row-card__meta">{props.body}</p>
    </SurfaceCard>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="app-backdrop">
      <div className="app-backdrop__grid" />
      <div className="app-backdrop__orb app-backdrop__orb--left" />
      <div className="app-backdrop__orb app-backdrop__orb--right" />
      <div className="app-backdrop__orb app-backdrop__orb--bottom" />
    </div>
  );
}
