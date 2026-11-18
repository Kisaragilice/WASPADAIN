import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getAuthSecret } from "@/lib/env";

export { getAuthSecret };

export function hashOpaqueToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(token).digest("hex");
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

/** Constant-time comparison for tokens supplied by clients. */
export function safeTokenEquals(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
