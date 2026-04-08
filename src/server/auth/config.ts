export const SESSION_COOKIE_NAME = "mode_train_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export function getAuthSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET no configurado.");
  }

  return secret;
}
