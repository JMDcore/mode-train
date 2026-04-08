import { eq } from "drizzle-orm";

import { verifyPassword } from "@/server/auth/password";
import { getDb } from "@/server/db";
import { appUsers, profiles } from "@/server/db/schema";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatarPath: string | null;
  initials: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

export function buildInitials(displayName: string) {
  const tokens = displayName
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (tokens.length === 0) {
    return "MT";
  }

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

function mapUserRecord(record: {
  id: string;
  email: string;
  displayName: string;
  avatarPath: string | null;
}): AuthUser {
  return {
    ...record,
    initials: buildInitials(record.displayName),
  };
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const [record] = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      passwordHash: appUsers.passwordHash,
      displayName: profiles.displayName,
      avatarPath: profiles.avatarPath,
    })
    .from(appUsers)
    .innerJoin(profiles, eq(profiles.userId, appUsers.id))
    .where(eq(appUsers.email, normalizedEmail))
    .limit(1);

  return record ?? null;
}

export async function createUser(input: {
  displayName: string;
  email: string;
  passwordHash: string;
}) {
  const db = getDb();

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedDisplayName = normalizeDisplayName(input.displayName);

  const [user] = await db
    .insert(appUsers)
    .values({
      email: normalizedEmail,
      passwordHash: input.passwordHash,
    })
    .returning({
      id: appUsers.id,
      email: appUsers.email,
    });

  const [profile] = await db
    .insert(profiles)
    .values({
      userId: user.id,
      displayName: normalizedDisplayName,
    })
    .returning({
      displayName: profiles.displayName,
      avatarPath: profiles.avatarPath,
    });

  return mapUserRecord({
    id: user.id,
    email: user.email,
    displayName: profile.displayName,
    avatarPath: profile.avatarPath,
  });
}

export async function verifyUserCredentials(input: {
  email: string;
  password: string;
}) {
  const record = await findUserByEmail(input.email);

  if (!record) {
    return null;
  }

  const passwordMatches = await verifyPassword(record.passwordHash, input.password);

  if (!passwordMatches) {
    return null;
  }

  return mapUserRecord({
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    avatarPath: record.avatarPath,
  });
}
