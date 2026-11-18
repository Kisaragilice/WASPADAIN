-- Phase 2: data-integrity hardening, XP ledger, password reset, rate limits.
--
-- The cleanup statements run before the new unique indexes are created so the
-- migration also applies to databases that already contain duplicates created
-- by the previous race-prone code paths.

-- Keep the earliest response per (attemptId, sceneId).
DELETE FROM "SimulationResponse"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "attemptId", "sceneId"
        ORDER BY "createdAt" ASC, "id" ASC
      ) AS row_number
    FROM "SimulationResponse"
  ) ranked
  WHERE ranked.row_number > 1
);

-- Keep only the newest IN_PROGRESS attempt per (userId, scenarioId); older
-- orphaned attempts are marked ABANDONED instead of being deleted so their
-- history is preserved.
UPDATE "SimulationAttempt"
SET "status" = 'ABANDONED', "updatedAt" = NOW()
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "userId", "scenarioId"
        ORDER BY "startedAt" DESC, "id" DESC
      ) AS row_number
    FROM "SimulationAttempt"
    WHERE "status" = 'IN_PROGRESS'
  ) ranked
  WHERE ranked.row_number > 1
);

-- CreateEnum
CREATE TYPE "XpSource" AS ENUM ('SIMULATION', 'REFLEX', 'MODULE', 'ASSESSMENT');

-- AlterTable
ALTER TABLE "SimulationAttempt" ADD COLUMN     "bongkarCompletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SimulationResponse" ADD COLUMN     "radarCategories" JSONB;

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "XpSource" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "XpTransaction_userId_createdAt_idx" ON "XpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "XpTransaction_userId_source_referenceId_key" ON "XpTransaction"("userId", "source", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE INDEX "SimulationAttempt_userId_bongkarCompletedAt_idx" ON "SimulationAttempt"("userId", "bongkarCompletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationResponse_attemptId_sceneId_key" ON "SimulationResponse"("attemptId", "sceneId");

-- A user may have at most one active attempt per scenario. This is the
-- database-level guarantee behind startAttempt's advisory lock.
CREATE UNIQUE INDEX "SimulationAttempt_active_per_scenario_key"
  ON "SimulationAttempt"("userId", "scenarioId")
  WHERE "status" = 'IN_PROGRESS';

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
