import { hash, verify } from "@node-rs/argon2";

import { getAuthSecret } from "@/server/auth/config";

const encoder = new TextEncoder();

function getPasswordOptions() {
  return {
    memoryCost: 19_456,
    timeCost: 3,
    parallelism: 1,
    secret: encoder.encode(getAuthSecret()),
  };
}

export async function hashPassword(password: string) {
  return hash(password, getPasswordOptions());
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password, getPasswordOptions());
}
