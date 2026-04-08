import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import { appUsers, profiles, routineTemplates, weeklyPlanEntries } from "../src/server/db/schema";
import { getUserProfile } from "../src/server/profile";
import { createStarterWeek } from "../src/server/training/starter-plan";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const email = `starter+${stamp}@mode-train.local`;
  const passwordHash = await hashPassword(`ModeTrain!${stamp}`);

  const createdUser = await createUser({
    displayName: "Starter Smoke",
    email,
    passwordHash,
  });

  try {
    await db
      .update(profiles)
      .set({
        goal: "Hybrid fitness",
        experienceLevel: "Intermediate",
        preferredWeeklySessions: 4,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, createdUser.id));

    const profile = await getUserProfile(createdUser.id);

    if (!profile) {
      throw new Error("No se ha podido cargar el perfil de prueba.");
    }

    await createStarterWeek({
      userId: createdUser.id,
      profile,
    });

    const routines = await db
      .select({ id: routineTemplates.id })
      .from(routineTemplates)
      .where(eq(routineTemplates.ownerUserId, createdUser.id));

    const planEntries = await db
      .select({ id: weeklyPlanEntries.id })
      .from(weeklyPlanEntries)
      .where(eq(weeklyPlanEntries.userId, createdUser.id));

    let duplicateBlocked = false;

    try {
      await createStarterWeek({
        userId: createdUser.id,
        profile,
      });
    } catch {
      duplicateBlocked = true;
    }

    if (routines.length < 3 || planEntries.length < 4 || !duplicateBlocked) {
      throw new Error("El starter week no ha generado la estructura esperada.");
    }

    console.log("Smoke starter week ok:", {
      email,
      routines: routines.length,
      planEntries: planEntries.length,
    });
  } finally {
    await db.delete(appUsers).where(eq(appUsers.id, createdUser.id));
    await getDbPool().end();
  }
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
