import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Atomic fixed-window limiter backed by PostgreSQL. The upsert increments in
 * one statement, so parallel requests cannot all pass the limit check.
 */
export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const resetAt = new Date(Date.now() + windowMs);

  try {
    const rows = await prisma.$queryRaw<
      { count: number; resetAt: Date }[]
    >`
      INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${resetAt}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."resetAt" <= NOW() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= NOW() THEN ${resetAt}
          ELSE "RateLimit"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `;

    const row = rows[0];
    if (!row) return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    const remaining = Math.max(0, limit - row.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000),
    );
    return {
      allowed: row.count <= limit,
      remaining,
      retryAfterSeconds: row.count <= limit ? 0 : retryAfterSeconds,
    };
  } catch (error) {
    // Availability beats a hard outage if the limiter store is temporarily
    // unavailable; authentication itself still fails closed.
    console.error("rate-limit unavailable", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && first.length <= 64) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length <= 64) return realIp;
  return "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function enforceRateLimit(
  request: Request,
  options: Omit<RateLimitOptions, "key"> & { key: string },
) {
  const result = await checkRateLimit(options);
  if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds);
  return null;
}
