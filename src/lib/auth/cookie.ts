/**
 * `__Host-` cookies are only valid over HTTPS with Path=/ and no Domain.
 * Development keeps the plain name so http://localhost still works.
 */
export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-waspadain_session"
    : "waspadain_session";
}

export const SESSION_COOKIE_BASE = "waspadain_session";

/**
 * Marks a session whose owner must replace an initial password before using
 * the rest of the app (bootstrapped administrators).
 */
export function passwordChangeCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-waspadain_pwd_change"
    : "waspadain_pwd_change";
}
