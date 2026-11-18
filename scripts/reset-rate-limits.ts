import { prisma } from "../src/lib/db";

/**
 * Browser suites log in several times from one IP/email while running back to
 * back. Clear login buckets first so the suite is repeatable; individual
 * limiter tests in verify-phase2.ts still exercise real throttling.
 */
export async function resetAuthRateLimits() {
  try {
    await prisma.rateLimit.deleteMany({
      where: { key: { startsWith: "login:" } },
    });
  } catch (error) {
    console.warn("Tidak dapat membersihkan rate limit login:", error);
  }
}
