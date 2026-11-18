import "server-only";

import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/token";

export const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * Creates a single-use reset token. Only the HMAC of the token is stored, so a
 * database leak cannot be replayed against the reset endpoint.
 */
export async function issuePasswordResetToken(userId: string) {
  const token = createOpaqueToken(32);
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  await prisma.$transaction(async (tx) => {
    // Any older unused link becomes invalid when a new one is requested.
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(token),
        expiresAt,
      },
    });
  });

  return { token, expiresAt };
}

/**
 * Atomically claims a token, changes the password, and revokes every session.
 * Returns null when the token is unknown, expired, or already used.
 */
export async function consumePasswordResetToken(input: {
  token: string;
  passwordHash: string;
}) {
  const tokenHash = hashOpaqueToken(input.token);

  return prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });
    const now = new Date();
    if (!row || row.usedAt || row.expiresAt <= now) return null;

    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return null;

    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash: input.passwordHash },
    });

    // A password reset is a strong signal that the account was compromised, so
    // all existing sessions are revoked.
    await tx.session.deleteMany({ where: { userId: row.userId } });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: now },
    });

    return row.userId;
  });
}

/** Stable, non-reversible key so rate-limit rows never store raw emails. */
export function emailRateLimitKey(email: string) {
  return createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 40);
}
