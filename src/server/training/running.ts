import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/server/db";
import { runningSessions } from "@/server/db/schema";

export type RunningSessionInput = {
  kind: "easy" | "tempo" | "intervals" | "long_run" | "recovery" | "free";
  date: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  notes: string;
};

export type RunningHistoryDetail = {
  id: string;
  date: string;
  dateLabel: string;
  kind: RunningSessionInput["kind"];
  kindLabel: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  averagePaceLabel: string | null;
  notes: string;
};

function createRunningDate(input: string) {
  return new Date(`${input}T12:00:00`);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatRunningKind(kind: RunningSessionInput["kind"]) {
  switch (kind) {
    case "easy":
      return "Rodaje suave";
    case "tempo":
      return "Tempo";
    case "intervals":
      return "Series";
    case "long_run":
      return "Tirada larga";
    case "recovery":
      return "Recuperacion";
    default:
      return "Libre";
  }
}

export function formatRunningPace(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}/km`;
}

function buildDerivedMetrics(input: Pick<RunningSessionInput, "distanceKm" | "durationMinutes">) {
  if (input.distanceKm === null && input.durationMinutes === null) {
    throw new Error("Anade al menos distancia o duracion para guardar la carrera.");
  }

  const durationSeconds =
    input.durationMinutes !== null ? Math.round(input.durationMinutes * 60) : null;

  const averagePaceSeconds =
    durationSeconds !== null && input.distanceKm !== null && input.distanceKm > 0
      ? Math.round(durationSeconds / input.distanceKm)
      : null;

  return {
    durationSeconds,
    averagePaceSeconds,
  };
}

export async function createRunningSession(userId: string, input: RunningSessionInput) {
  const db = getDb();
  const derived = buildDerivedMetrics(input);

  const [session] = await db
    .insert(runningSessions)
    .values({
      userId,
      kind: input.kind,
      date: createRunningDate(input.date),
      distanceKm: input.distanceKm,
      durationSeconds: derived.durationSeconds,
      averagePaceSeconds: derived.averagePaceSeconds,
      notes: input.notes,
    })
    .returning({
      id: runningSessions.id,
    });

  return session;
}

export async function updateRunningSession(
  userId: string,
  sessionId: string,
  input: RunningSessionInput,
) {
  const db = getDb();

  const [session] = await db
    .select({
      id: runningSessions.id,
    })
    .from(runningSessions)
    .where(and(eq(runningSessions.id, sessionId), eq(runningSessions.userId, userId)))
    .limit(1);

  if (!session) {
    throw new Error("No hemos encontrado esa carrera.");
  }

  const derived = buildDerivedMetrics(input);

  await db
    .update(runningSessions)
    .set({
      kind: input.kind,
      date: createRunningDate(input.date),
      distanceKm: input.distanceKm,
      durationSeconds: derived.durationSeconds,
      averagePaceSeconds: derived.averagePaceSeconds,
      notes: input.notes,
    })
    .where(eq(runningSessions.id, session.id));
}

export async function getRunningHistoryDetail(
  userId: string,
  runId: string,
): Promise<RunningHistoryDetail | null> {
  const db = getDb();

  const [session] = await db
    .select({
      id: runningSessions.id,
      date: runningSessions.date,
      kind: runningSessions.kind,
      distanceKm: runningSessions.distanceKm,
      durationSeconds: runningSessions.durationSeconds,
      averagePaceSeconds: runningSessions.averagePaceSeconds,
      notes: runningSessions.notes,
    })
    .from(runningSessions)
    .where(and(eq(runningSessions.id, runId), eq(runningSessions.userId, userId)))
    .orderBy(desc(runningSessions.date))
    .limit(1);

  if (!session) {
    return null;
  }

  const date = session.date;
  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

  return {
    id: session.id,
    date: isoDate,
    dateLabel: formatDateLabel(date),
    kind: session.kind,
    kindLabel: formatRunningKind(session.kind),
    distanceKm: session.distanceKm,
    durationMinutes:
      session.durationSeconds !== null ? Math.round(session.durationSeconds / 60) : null,
    averagePaceLabel: formatRunningPace(session.averagePaceSeconds),
    notes: session.notes,
  };
}
