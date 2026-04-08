import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthSecret, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "@/server/auth/config";
import { buildInitials, type AuthUser } from "@/server/auth/user";
import { getDb } from "@/server/db";
import { appUsers, profiles, userSessions } from "@/server/db/schema";

function hashSessionToken(token: string) {
  return createHash("sha256")
    .update(`${token}:${getAuthSecret()}`)
    .digest("hex");
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string) {
  const db = getDb();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await db.insert(userSessions).values({
    userId,
    sessionTokenHash: hashSessionToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  if (!token) {
    return;
  }

  const db = getDb();

  await db
    .delete(userSessions)
    .where(eq(userSessions.sessionTokenHash, hashSessionToken(token)));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const db = getDb();

  const [record] = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      displayName: profiles.displayName,
      avatarPath: profiles.avatarPath,
    })
    .from(userSessions)
    .innerJoin(appUsers, eq(appUsers.id, userSessions.userId))
    .innerJoin(profiles, eq(profiles.userId, appUsers.id))
    .where(
      and(
        eq(userSessions.sessionTokenHash, hashSessionToken(token)),
        gt(userSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) {
    return null;
  }

  return {
    ...record,
    initials: buildInitials(record.displayName),
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
