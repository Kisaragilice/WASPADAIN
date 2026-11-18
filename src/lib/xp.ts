import type { Prisma, XpSource } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface XpGrant {
  amount: number;
  source: XpSource;
  referenceId: string;
}

export interface XpGrantResult {
  granted: boolean;
  amount: number;
}

/**
 * Grants XP exactly once for a (user, source, reference) tuple.
 *
 * The ledger row is written before the user balance is incremented inside the
 * same transaction. Concurrent requests race on the unique constraint; the
 * loser receives P2002 and grants 0 without double-crediting the account.
 */
export async function grantXp(
  tx: Prisma.TransactionClient,
  userId: string,
  grant: XpGrant,
): Promise<XpGrantResult> {
  if (grant.amount <= 0) return { granted: false, amount: 0 };

  // `skipDuplicates` compiles to ON CONFLICT DO NOTHING. Unlike catching a
  // P2002 error, it does not abort the surrounding PostgreSQL transaction, so
  // callers can safely continue writing after a duplicate claim.
  const claim = await tx.xpTransaction.createMany({
    data: [
      {
        userId,
        amount: grant.amount,
        source: grant.source,
        referenceId: grant.referenceId,
      },
    ],
    skipDuplicates: true,
  });

  if (claim.count === 0) return { granted: false, amount: 0 };

  await tx.user.update({
    where: { id: userId },
    data: { xp: { increment: grant.amount } },
  });

  return { granted: true, amount: grant.amount };
}

/** Removes rate-limit rows that can no longer affect any window. */
export async function cleanupExpiredSessionsAndLimits() {
  const now = new Date();
  await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
