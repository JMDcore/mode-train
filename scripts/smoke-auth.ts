import { eq } from "drizzle-orm";

import { hashPassword } from "../src/server/auth/password";
import { createUser, verifyUserCredentials } from "../src/server/auth/user";
import { getDb } from "../src/server/db";
import { getDbPool } from "../src/server/db/client";
import { appUsers } from "../src/server/db/schema";

async function main() {
  const db = getDb();
  const stamp = Date.now();
  const email = `smoke+${stamp}@mode-train.local`;
  const password = `ModeTrain!${stamp}`;

  const passwordHash = await hashPassword(password);
  const createdUser = await createUser({
    displayName: "Smoke Test",
    email,
    passwordHash,
  });

  const validUser = await verifyUserCredentials({
    email,
    password,
  });

  const invalidUser = await verifyUserCredentials({
    email,
    password: "wrong-password",
  });

  await db.delete(appUsers).where(eq(appUsers.id, createdUser.id));

  if (!validUser || invalidUser) {
    throw new Error("La verificacion de credenciales no ha respondido como se esperaba.");
  }

  await getDbPool().end();

  console.log("Smoke auth ok:", {
    email,
    userId: createdUser.id,
  });
}

main().catch((error) => {
  console.error(error);
  void getDbPool().end().catch(() => undefined);
  process.exit(1);
});
