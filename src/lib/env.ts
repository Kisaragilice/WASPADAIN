const KNOWN_PUBLIC_SECRETS = new Set([
  "ganti-dengan-secret-acak-minimal-32-karakter-aman",
  "dev-secret-waspadain-ganti-di-produksi-minimal-32-karakter",
]);

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Returns the application secret used to HMAC opaque tokens.
 * Production refuses short or publicly known fallback values so a
 * copy-pasted compose file can never boot with a predictable secret.
 */
export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET wajib diisi.");
  }
  if (secret.length < 16) {
    throw new Error("AUTH_SECRET minimal 16 karakter.");
  }
  if (isProduction() && (secret.length < 32 || KNOWN_PUBLIC_SECRETS.has(secret))) {
    throw new Error(
      "AUTH_SECRET produksi wajib berupa nilai acak minimal 32 karakter dan tidak boleh memakai nilai contoh.",
    );
  }
  return secret;
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates configuration that must never fall back to an insecure default.
 * Called from instrumentation on server start, and lazily by token helpers.
 */
export function assertProductionEnv() {
  // Always validates AUTH_SECRET; production adds length/entropy checks.
  getAuthSecret();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL wajib diisi.");
  }

  if (!isProduction()) return;

  if (!process.env.APP_URL || !validHttpUrl(process.env.APP_URL)) {
    throw new Error("APP_URL produksi wajib diisi dengan URL http(s) yang valid.");
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  // Email is optional. A sender without an API key simply means email is
  // disabled: the app keeps running and never claims a message was sent.
  if (resendKey && !resendFrom) {
    throw new Error(
      "RESEND_FROM_EMAIL wajib diisi bila RESEND_API_KEY diaktifkan.",
    );
  }
  if (resendFrom && !resendFrom.includes("@")) {
    throw new Error("RESEND_FROM_EMAIL harus berupa alamat email pengirim.");
  }
}

export function getAppUrl(fallbackOrigin?: string) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Validation below produces the actionable error.
    }
  }
  if (isProduction()) {
    throw new Error("APP_URL produksi wajib diisi dengan URL http(s) yang valid.");
  }
  return fallbackOrigin ?? "http://localhost:3000";
}
