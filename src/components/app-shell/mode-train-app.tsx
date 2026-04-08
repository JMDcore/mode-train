"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Dumbbell,
  Footprints,
  House,
  Play,
  Plus,
  Route,
  Trophy,
  Target,
  User,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { QuickRunForm } from "@/components/training/quick-run-form";
import { QuickRoutineForm } from "@/components/training/quick-routine-form";
import { RoutineLogButton } from "@/components/training/routine-log-button";
import { StarterWeekButton } from "@/components/training/starter-week-button";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/server/auth/user";
import type { UserProfile } from "@/server/profile";
import type { AppSnapshot } from "@/server/app/snapshot";

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
type QuickAction = { label: string; icon: LucideIcon; targetTab: TabKey };

const headerCopy: Record<TabKey, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Hoy", title: "Panel" },
  train: { eyebrow: "Plan semanal", title: "Entrena" },
  social: { eyebrow: "Privado", title: "Circulo" },
  profile: { eyebrow: "Progreso", title: "Perfil" },
};

const quickActions = [
  { label: "Plan", icon: CalendarDays, targetTab: "train" },
  { label: "Registrar", icon: Play, targetTab: "train" },
  { label: "Circulo", icon: Users, targetTab: "social" },
  { label: "Perfil", icon: User, targetTab: "profile" },
] satisfies QuickAction[];

const statIconMap: Record<string, LucideIcon> = {
  goal: Target,
  routines: Dumbbell,
  library: Route,
};

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

export function ModeTrainApp(props: {
  user: AuthUser;
  profile: UserProfile;
  snapshot: AppSnapshot;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const header = headerCopy[activeTab];

  return (
    <div className="app-wrap">
      <Backdrop />

      <motion.main
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...transition, duration: 0.58 }}
        className="app-shell"
      >
        <header className="app-header">
          <div>
            <p className="app-eyebrow">{header.eyebrow}</p>
            <h1 className="app-title">{header.title}</h1>
          </div>

          <div className="header-actions">
            <button type="button" className="icon-button" aria-label="Notificaciones">
              <Bell size={18} strokeWidth={2.1} />
            </button>
            <button type="button" className="profile-badge" aria-label="Perfil">
              {props.user.initials}
            </button>
          </div>
        </header>

        <div className="screen-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
              transition={transition}
              className="screen-stack"
            >
              {activeTab === "home" ? (
                <HomeScreen
                  snapshot={props.snapshot}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              ) : null}
              {activeTab === "train" ? <TrainScreen snapshot={props.snapshot} /> : null}
              {activeTab === "social" ? <SocialScreen snapshot={props.snapshot} /> : null}
              {activeTab === "profile" ? (
                <ProfileScreen user={props.user} profile={props.profile} snapshot={props.snapshot} />
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
                      <Icon size={18} strokeWidth={2.2} />
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
  snapshot: AppSnapshot;
  onNavigate: (tab: TabKey) => void;
}) {
  return (
    <>
      <SurfaceCard tone="accent" className="hero-card">
        <div className="hero-card__copy">
          <div className="hero-chip">
            <Dumbbell size={14} strokeWidth={2.2} />
            {props.snapshot.heroChip}
          </div>
          <h2 className="hero-card__title">{props.snapshot.heroTitle}</h2>
          <div className="hero-meta">
            <MetaPill icon={Clock3} label={props.snapshot.heroMeta[0] ?? "0x semana"} />
            <MetaPill icon={Zap} label={props.snapshot.heroMeta[1] ?? "0 bloques"} />
            <MetaPill icon={Target} label={props.snapshot.heroMeta[2] ?? "0 ejercicios"} />
          </div>
        </div>

        <div className="hero-card__aside">
          <ProgressRing value={props.snapshot.readiness} label="Listo" />
          {props.snapshot.canGenerateStarterWeek ? (
            <StarterWeekButton className="primary-button" />
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => props.onNavigate("train")}
            >
              <Play size={16} strokeWidth={2.4} />
              Ver plan
            </button>
          )}
        </div>
      </SurfaceCard>

      <div className="action-grid">
        {quickActions.map((action) => (
          <ActionTile
            key={action.label}
            icon={action.icon}
            label={action.label}
            onClick={() => props.onNavigate(action.targetTab)}
          />
        ))}
      </div>

      <div className="stat-grid">
        {props.snapshot.quickStats.map((stat) => (
          <MetricTile
            key={stat.key}
            icon={statIconMap[stat.key]}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <ScreenSection icon={CalendarDays} title="Hoy">
        <div className="list-stack">
          {props.snapshot.todayItems.map((item) => (
            <RowCard
              key={item.title}
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
          ))}
        </div>
      </ScreenSection>

      <ScreenSection icon={Activity} title="Actividad">
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
              title="Todavia no hay actividad"
              body="En cuanto registres una sesion o una carrera, veras aqui tu actividad reciente."
            />
          )}
        </div>
      </ScreenSection>
    </>
  );
}

function TrainScreen(props: { snapshot: AppSnapshot }) {
  return (
    <>
      <SurfaceCard tone="accent">
        <div className="compact-hero">
          <div>
            <p className="card-kicker">Plan semanal</p>
            <h2 className="compact-hero__title">{props.snapshot.weeklyPlan[0]?.title ?? "Crea tu primera semana"}</h2>
          </div>
          {props.snapshot.canGenerateStarterWeek ? (
            <StarterWeekButton compact />
          ) : (
            <div className="pill-soft">
              <CalendarDays size={14} strokeWidth={2.2} />
              {props.snapshot.weeklyPlan.length} dias
            </div>
          )}
        </div>
      </SurfaceCard>

      <ScreenSection icon={CalendarDays} title="Semana">
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
              title="Semana inicial lista para crear"
              body="Un toque y te montamos una semana inicial con rutinas y planning real segun tu perfil."
            />
          )}
        </div>
      </ScreenSection>

      <ScreenSection icon={Dumbbell} title="Rutinas">
        <QuickRoutineForm />
        <div className="list-stack">
          {props.snapshot.routines.length > 0 ? (
            props.snapshot.routines.map((routine) => (
              <WorkoutCard
                key={routine.id}
                icon={Dumbbell}
                name={routine.name}
                meta={`${routine.itemCount} ejercicios`}
                chips={["Rutina", "Lista"]}
                footer={<RoutineLogButton routineTemplateId={routine.id} />}
              />
            ))
          ) : (
            <EmptyCard
              title="Todavia no tienes rutinas"
              body="Crea una rutina rapida y luego iremos anadiendo bloques y ejercicios."
            />
          )}
        </div>
      </ScreenSection>

      <ScreenSection icon={Footprints} title="Carrera rapida">
        <QuickRunForm />
      </ScreenSection>

      <ScreenSection icon={Route} title="Biblioteca">
        <div className="list-stack">
          {props.snapshot.library.map((exercise) => (
            <WorkoutCard
              key={exercise.id}
              icon={exercise.primaryMuscleGroup === "Cardio" ? Footprints : Activity}
              name={exercise.name}
              meta={exercise.primaryMuscleGroup}
              chips={[exercise.equipment]}
            />
          ))}
        </div>
      </ScreenSection>
    </>
  );
}

function SocialScreen(props: { snapshot: AppSnapshot }) {
  return (
    <>
      <SurfaceCard tone="accent">
        <div className="compact-hero">
          <div>
            <p className="card-kicker">Solo amistades</p>
            <h2 className="compact-hero__title">Circulo privado</h2>
          </div>
          <div className="pill-soft">
            <Users size={14} strokeWidth={2.2} />
            {props.snapshot.socialCounts.friends}
          </div>
        </div>
      </SurfaceCard>

      <div className="social-stat-grid">
        <MetricTile icon={Users} label="Amistades" value={`${props.snapshot.socialCounts.friends}`} />
        <MetricTile icon={Bell} label="Avisos" value={`${props.snapshot.socialCounts.notifications}`} />
        <MetricTile icon={Plus} label="Pendientes" value={`${props.snapshot.socialCounts.pending}`} />
      </div>

      <ScreenSection icon={Activity} title="Estado">
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
              title="Tu circulo todavia esta vacio"
              body="La capa social ya esta lista para cuando empieces a invitar amistades privadas."
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
          <ChevronRight size={18} strokeWidth={2.2} className="text-white/50" />
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
      <SurfaceCard tone="accent">
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
          <SurfaceCard key={item.label}>
            <p className="tile-label">{item.label}</p>
            <p className="tile-value">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      <ScreenSection icon={Trophy} title="Perfil">
        <div className="list-stack">
          <CompactRow label="Objetivo" value={translateGoal(props.profile.goal)} />
          <CompactRow label="Nivel" value={translateLevel(props.profile.experienceLevel)} />
          <CompactRow
            label="Objetivo semanal"
            value={`${props.profile.preferredWeeklySessions ?? 0} sesiones`}
          />
        </div>
      </ScreenSection>

      <ScreenSection icon={Camera} title="Progreso">
        <div className="gallery-grid">
          <ProgressFrame label="Semana 1" />
          <ProgressFrame label="Semana 5" tone="mid" />
          <ProgressFrame label="Semana 9" tone="late" />
        </div>
      </ScreenSection>

      <Link href="/onboarding" className="logout-button logout-button--link">
        Editar perfil
      </Link>

      <form action="/logout" method="post">
        <button type="submit" className="logout-button">
          Cerrar sesion
        </button>
      </form>
    </>
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

function ActionTile(props: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  const Icon = props.icon;

  return (
    <button type="button" className="action-tile" onClick={props.onClick}>
      <span className="action-tile__icon">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span>{props.label}</span>
    </button>
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

function ProgressFrame(props: { label: string; tone?: "mid" | "late" }) {
  return (
    <div className="progress-frame">
      <div
        className={cn(
          "progress-frame__gradient",
          props.tone === "mid" && "progress-frame__gradient--mid",
          props.tone === "late" && "progress-frame__gradient--late",
        )}
      />
      <span className="progress-frame__label">{props.label}</span>
    </div>
  );
}

function MetaPill(props: { icon: LucideIcon; label: string }) {
  const Icon = props.icon;

  return (
    <span className="meta-pill">
      <Icon size={13} strokeWidth={2.2} />
      {props.label}
    </span>
  );
}

function ProgressRing(props: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference * (1 - props.value / 100);

  return (
    <div className="progress-ring">
      <svg viewBox="0 0 64 64" className="progress-ring__svg" aria-hidden>
        <circle className="progress-ring__track" cx="32" cy="32" r="26" />
        <motion.circle
          className="progress-ring__value"
          cx="32"
          cy="32"
          r="26"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="progress-ring__label">
        <strong>{props.value}</strong>
        <span>{props.label}</span>
      </div>
    </div>
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
