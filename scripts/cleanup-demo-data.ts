/**
 * Removes demo and/or test accounts with all related activity.
 *
 *   npm run cleanup:demo              # demo accounts only
 *   npm run cleanup:demo -- --include-test   # demo + local test artifacts
 *   npm run cleanup:demo -- --include-admin  # also remove legacy demo admin
 *   npm run cleanup:demo -- --dry-run
 *
 * - Writes a JSON backup to backups/ before deleting (gitignored).
 * - Deletes in foreign-key order inside a single transaction.
 * - Never touches Scenario or EducationModule catalog rows.
 * - Only deletes explicitly allow-listed emails/prefixes, so real production
 *   users are never removed by accident.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAILS = ["warga@waspadain.id"];
// admin@waspadain.id is now the real bootstrapped account, so removing it must
// be an explicit, deliberate action.
const LEGACY_ADMIN_EMAILS = ["admin@waspadain.id"];
const TEST_PREFIXES = ["flow-", "phase2-", "throttle-", "test-", "bootstrap-"];

const args = new Set(process.argv.slice(2));
const includeTest = args.has("--include-test");
const includeAdmin = args.has("--include-admin");
const dryRun = args.has("--dry-run");

async function main() {
  const where = includeTest
    ? {
        OR: [
          { email: { in: DEMO_EMAILS } },
          ...(includeAdmin ? [{ email: { in: LEGACY_ADMIN_EMAILS } }] : []),
          ...TEST_PREFIXES.map((prefix) => ({ email: { startsWith: prefix } })),
        ],
      }
    : {
        email: {
          in: includeAdmin
            ? [...DEMO_EMAILS, ...LEGACY_ADMIN_EMAILS]
            : DEMO_EMAILS,
        },
      };

  const targets = await prisma.user.findMany({
    where,
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const catalogBefore = {
    scenarios: await prisma.scenario.count(),
    modules: await prisma.educationModule.count(),
  };

  if (targets.length === 0) {
    console.log("Tidak ada akun demo/test yang perlu dihapus.");
    console.log("Katalog dipertahankan:", catalogBefore);
    return;
  }

  const ids = targets.map((user) => user.id);

  const backup = {
    createdAt: new Date().toISOString(),
    users: await prisma.user.findMany({ where: { id: { in: ids } } }),
    sessions: await prisma.session.findMany({ where: { userId: { in: ids } } }),
    attempts: await prisma.simulationAttempt.findMany({ where: { userId: { in: ids } } }),
    responses: await prisma.simulationResponse.findMany({
      where: { attempt: { userId: { in: ids } } },
    }),
    assessments: await prisma.assessment.findMany({ where: { userId: { in: ids } } }),
    badges: await prisma.userBadge.findMany({ where: { userId: { in: ids } } }),
    moduleProgress: await prisma.moduleProgress.findMany({ where: { userId: { in: ids } } }),
    reflexAttempts: await prisma.reflexAttempt.findMany({ where: { userId: { in: ids } } }),
    xpTransactions: await prisma.xpTransaction.findMany({ where: { userId: { in: ids } } }),
    resetTokens: await prisma.passwordResetToken.findMany({
      where: { userId: { in: ids } },
    }),
  };

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `demo-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log("Backup disimpan:", backupPath);

  console.log(
    "Target:",
    targets.map((user) => `${user.email} (${user.role})`).join(", "),
  );

  if (dryRun) {
    console.log("Dry run: tidak ada data yang dihapus.");
    return;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const attemptIds = backup.attempts.map((attempt) => attempt.id);
    const counts = {
      responses:
        attemptIds.length > 0
          ? (
              await tx.simulationResponse.deleteMany({
                where: { attemptId: { in: attemptIds } },
              })
            ).count
          : 0,
      resetTokens: (
        await tx.passwordResetToken.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      xpTransactions: (
        await tx.xpTransaction.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      reflexAttempts: (
        await tx.reflexAttempt.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      moduleProgress: (
        await tx.moduleProgress.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      badges: (await tx.userBadge.deleteMany({ where: { userId: { in: ids } } })).count,
      assessments: (
        await tx.assessment.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      attempts: (
        await tx.simulationAttempt.deleteMany({ where: { userId: { in: ids } } })
      ).count,
      sessions: (await tx.session.deleteMany({ where: { userId: { in: ids } } })).count,
      users: (await tx.user.deleteMany({ where: { id: { in: ids } } })).count,
    };
    return counts;
  });

  const catalogAfter = {
    scenarios: await prisma.scenario.count(),
    modules: await prisma.educationModule.count(),
  };

  console.log("Dihapus:", deleted);
  console.log("Katalog sebelum:", catalogBefore);
  console.log("Katalog sesudah:", catalogAfter);

  const remaining = await prisma.user.count({ where });
  if (remaining !== 0) {
    throw new Error(`Masih ada ${remaining} akun target setelah cleanup.`);
  }
  if (
    catalogAfter.scenarios !== catalogBefore.scenarios ||
    catalogAfter.modules !== catalogBefore.modules
  ) {
    throw new Error("Jumlah katalog berubah; periksa hasil cleanup.");
  }
  console.log("Cleanup terverifikasi: target habis, katalog utuh.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
