import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "rejected",
  "blocked",
]);

export const activityVisibilityEnum = pgEnum("activity_visibility", [
  "private",
  "friends",
]);

export const runningKindEnum = pgEnum("running_kind", [
  "easy",
  "tempo",
  "intervals",
  "long_run",
  "recovery",
  "free",
]);

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("app_users_email_key").on(table.email)],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  bio: text("bio").default("").notNull(),
  avatarPath: text("avatar_path"),
  goal: varchar("goal", { length: 120 }).default("").notNull(),
  experienceLevel: varchar("experience_level", { length: 48 }).default("").notNull(),
  heightCm: integer("height_cm"),
  weightKg: real("weight_kg"),
  preferredWeeklySessions: integer("preferred_weekly_sessions"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_sessions_token_key").on(table.sessionTokenHash)],
);

export const exerciseCategories = pgTable("exercise_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  isSystem: boolean("is_system").default(true).notNull(),
  ownerUserId: uuid("owner_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => exerciseCategories.id, {
    onDelete: "set null",
  }),
  ownerUserId: uuid("owner_user_id").references(() => appUsers.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description").default("").notNull(),
  primaryMuscleGroup: varchar("primary_muscle_group", { length: 80 }).default("").notNull(),
  equipment: varchar("equipment", { length: 80 }).default("").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  isSystem: boolean("is_system").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const routineTemplates = pgTable("routine_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  notes: text("notes").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const routineTemplateItems = pgTable("routine_template_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  routineTemplateId: uuid("routine_template_id")
    .notNull()
    .references(() => routineTemplates.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }),
  sortOrder: integer("sort_order").notNull(),
  targetSets: integer("target_sets").default(3).notNull(),
  targetRepsMin: integer("target_reps_min").default(6).notNull(),
  targetRepsMax: integer("target_reps_max").default(10).notNull(),
  targetRir: integer("target_rir"),
  restSeconds: integer("rest_seconds"),
  notes: text("notes").default("").notNull(),
});

export const weeklyPlanEntries = pgTable("weekly_plan_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  weekdayKey: varchar("weekday_key", { length: 16 }).notNull(),
  routineTemplateId: uuid("routine_template_id").references(() => routineTemplates.id, {
    onDelete: "set null",
  }),
  runningTargetKm: real("running_target_km"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  routineTemplateId: uuid("routine_template_id").references(() => routineTemplates.id, {
    onDelete: "set null",
  }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  notes: text("notes").default("").notNull(),
  visibility: activityVisibilityEnum("visibility").default("friends").notNull(),
});

export const workoutSets = pgTable("workout_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutSessionId: uuid("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg"),
  reps: integer("reps"),
  rir: integer("rir"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const runningSessions = pgTable("running_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  kind: runningKindEnum("kind").default("free").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  distanceKm: real("distance_km").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  averagePaceSeconds: integer("average_pace_seconds"),
  notes: text("notes").default("").notNull(),
  visibility: activityVisibilityEnum("visibility").default("friends").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const progressPhotos = pgTable("progress_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
  note: text("note").default("").notNull(),
  takenAt: timestamp("taken_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterUserId: uuid("requester_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  addresseeUserId: uuid("addressee_user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  status: friendshipStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => appUsers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 120 }).notNull(),
  body: text("body").default("").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
