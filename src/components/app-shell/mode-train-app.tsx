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
  Flame,
  Footprints,
  HeartPulse,
  House,
  MoonStar,
  Play,
  Plus,
  Trophy,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { AuthUser } from "@/server/auth/user";

const transition = {
  duration: 0.44,
  ease: [0.22, 1, 0.36, 1] as const,
};

const tabs = [
  { key: "home", label: "Home", icon: House },
  { key: "train", label: "Train", icon: Dumbbell },
  { key: "social", label: "Circle", icon: Users },
  { key: "profile", label: "Me", icon: User },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const headerCopy: Record<TabKey, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Wednesday", title: "Tonight" },
  train: { eyebrow: "Session", title: "Train" },
  social: { eyebrow: "Private", title: "Circle" },
  profile: { eyebrow: "Progress", title: "Me" },
};

const quickActions = [
  { label: "Plan", icon: CalendarDays },
  { label: "Log", icon: Play },
  { label: "Run", icon: Footprints },
  { label: "Add", icon: Plus },
] satisfies { label: string; icon: LucideIcon }[];

const dailyStats = [
  { label: "Streak", value: "19", icon: Flame },
  { label: "Sleep", value: "7.4", icon: MoonStar },
  { label: "Load", value: "82%", icon: HeartPulse },
] satisfies { label: string; value: string; icon: LucideIcon }[];

const dayFlow = [
  { title: "Upper focus", meta: "18:30 · 52 min", icon: Dumbbell },
  { title: "Easy run", meta: "Tomorrow · 5.2 km", icon: Footprints },
];

const socialPulse = [
  { name: "Nora", event: "Tempo run", meta: "6.4 km", tint: "cyan" },
  { name: "Ares", event: "Incline PR", meta: "4 x 6", tint: "violet" },
  { name: "Leo", event: "Recovery", meta: "Mobility", tint: "pink" },
] as const;

const workoutRows = [
  {
    name: "Trap bar deadlift",
    meta: "5 sets",
    chips: ["75 kg", "4 reps"],
    icon: Dumbbell,
  },
  {
    name: "Chest-supported row",
    meta: "4 sets",
    chips: ["32 kg", "8 reps"],
    icon: Activity,
  },
  {
    name: "Lat pulldown",
    meta: "3 sets",
    chips: ["55 kg", "12 reps"],
    icon: Zap,
  },
] satisfies {
  name: string;
  meta: string;
  chips: string[];
  icon: LucideIcon;
}[];

const circleFeed = [
  { name: "Nora", title: "Tempo block", value: "+14", tint: "cyan" },
  { name: "Ares", title: "Press PR", value: "92%", tint: "violet" },
  { name: "Leo", title: "Recovery note", value: "Soft", tint: "pink" },
] as const;

const profileStats = [
  { label: "Weight", value: "77.4" },
  { label: "5k", value: "24:58" },
  { label: "Squat", value: "92.5" },
];

export function ModeTrainApp(props: { user: AuthUser }) {
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
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} strokeWidth={2.1} />
            </button>
            <button type="button" className="profile-badge" aria-label="Profile">
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
              {activeTab === "home" ? <HomeScreen /> : null}
              {activeTab === "train" ? <TrainScreen /> : null}
              {activeTab === "social" ? <SocialScreen /> : null}
              {activeTab === "profile" ? <ProfileScreen user={props.user} /> : null}
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

function HomeScreen() {
  return (
    <>
      <SurfaceCard tone="accent" className="hero-card">
        <div className="hero-card__copy">
          <div className="hero-chip">
            <Dumbbell size={14} strokeWidth={2.2} />
            Pull day
          </div>
          <h2 className="hero-card__title">52 min. Clean, focused, ready.</h2>
          <div className="hero-meta">
            <MetaPill icon={Clock3} label="18:30" />
            <MetaPill icon={Zap} label="6 blocks" />
            <MetaPill icon={TrendingUp} label="82%" />
          </div>
        </div>

        <div className="hero-card__aside">
          <ProgressRing value={82} label="Ready" />
          <button type="button" className="primary-button">
            <Play size={16} strokeWidth={2.4} />
            Start
          </button>
        </div>
      </SurfaceCard>

      <div className="action-grid">
        {quickActions.map((action) => (
          <ActionTile key={action.label} icon={action.icon} label={action.label} />
        ))}
      </div>

      <div className="stat-grid">
        {dailyStats.map((stat) => (
          <MetricTile
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <ScreenSection icon={CalendarDays} title="Today">
        <div className="list-stack">
          {dayFlow.map((item) => (
            <RowCard
              key={item.title}
              icon={item.icon}
              title={item.title}
              meta={item.meta}
            />
          ))}
        </div>
      </ScreenSection>

      <ScreenSection icon={Users} title="Circle">
        <div className="avatar-row">
          {socialPulse.map((person) => (
            <AvatarCard
              key={person.name}
              name={person.name}
              caption={person.event}
              value={person.meta}
              tint={person.tint}
            />
          ))}
        </div>
      </ScreenSection>
    </>
  );
}

function TrainScreen() {
  return (
    <>
      <SurfaceCard tone="accent">
        <div className="compact-hero">
          <div>
            <p className="card-kicker">Tonight</p>
            <h2 className="compact-hero__title">Pull / posterior</h2>
          </div>
          <button type="button" className="primary-icon-button" aria-label="Start session">
            <Play size={16} strokeWidth={2.4} />
          </button>
        </div>
      </SurfaceCard>

      <ScreenSection icon={Dumbbell} title="Blocks">
        <div className="list-stack">
          {workoutRows.map((row) => (
            <WorkoutCard key={row.name} {...row} />
          ))}
        </div>
      </ScreenSection>

      <div className="two-column-grid">
        <SurfaceCard>
          <p className="card-kicker">Run</p>
          <div className="mini-feature">
            <Footprints size={18} strokeWidth={2.2} />
            <span>12 min easy</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="add-card">
          <Plus size={18} strokeWidth={2.3} />
          <span>Add block</span>
        </SurfaceCard>
      </div>
    </>
  );
}

function SocialScreen() {
  return (
    <>
      <SurfaceCard tone="accent">
        <div className="compact-hero">
          <div>
            <p className="card-kicker">Friends only</p>
            <h2 className="compact-hero__title">Private circle</h2>
          </div>
          <div className="pill-soft">
            <Users size={14} strokeWidth={2.2} />
            12
          </div>
        </div>
      </SurfaceCard>

      <ScreenSection icon={Activity} title="Feed">
        <div className="list-stack">
          {circleFeed.map((item) => (
            <FeedCard
              key={item.name}
              name={item.name}
              title={item.title}
              value={item.value}
              tint={item.tint}
            />
          ))}
        </div>
      </ScreenSection>

      <SurfaceCard>
        <div className="challenge-card">
          <div className="challenge-card__icon">
            <Trophy size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p className="card-kicker">Challenge</p>
            <h3 className="challenge-card__title">4 sessions this week</h3>
          </div>
          <ChevronRight size={18} strokeWidth={2.2} className="text-white/50" />
        </div>
      </SurfaceCard>
    </>
  );
}

function ProfileScreen(props: { user: AuthUser }) {
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
        {profileStats.map((item) => (
          <SurfaceCard key={item.label}>
            <p className="tile-label">{item.label}</p>
            <p className="tile-value">{item.value}</p>
          </SurfaceCard>
        ))}
      </div>

      <ScreenSection icon={Trophy} title="Records">
        <div className="list-stack">
          <CompactRow label="Back squat" value="92.5 kg" />
          <CompactRow label="5 km" value="24:58" />
          <CompactRow label="Pull-ups" value="14 reps" />
        </div>
      </ScreenSection>

      <ScreenSection icon={Camera} title="Progress">
        <div className="gallery-grid">
          <ProgressFrame label="Week 1" />
          <ProgressFrame label="Week 5" tone="mid" />
          <ProgressFrame label="Week 9" tone="late" />
        </div>
      </ScreenSection>

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

function ActionTile(props: { icon: LucideIcon; label: string }) {
  const Icon = props.icon;

  return (
    <button type="button" className="action-tile">
      <span className="action-tile__icon">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span>{props.label}</span>
    </button>
  );
}

function MetricTile(props: { icon: LucideIcon; label: string; value: string }) {
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
    <button type="button" className="row-card">
      <span className="row-card__icon">
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <span className="row-card__copy">
        <span className="row-card__title">{props.title}</span>
        <span className="row-card__meta">{props.meta}</span>
      </span>
      <ChevronRight size={16} strokeWidth={2.2} className="row-card__chevron" />
    </button>
  );
}

function AvatarCard(props: {
  name: string;
  caption: string;
  value: string;
  tint: "cyan" | "violet" | "pink";
}) {
  return (
    <SurfaceCard className="avatar-card">
      <div className={cn("mini-avatar", `mini-avatar--${props.tint}`)}>{props.name[0]}</div>
      <div className="avatar-card__copy">
        <p>{props.name}</p>
        <span>{props.caption}</span>
      </div>
      <span className="avatar-card__value">{props.value}</span>
    </SurfaceCard>
  );
}

function WorkoutCard(props: {
  icon: LucideIcon;
  name: string;
  meta: string;
  chips: string[];
}) {
  const Icon = props.icon;

  return (
    <button type="button" className="workout-card">
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
      <ChevronRight size={16} strokeWidth={2.2} className="row-card__chevron" />
    </button>
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
