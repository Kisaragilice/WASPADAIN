/**
 * Deletes EVERY user account, including administrators, while keeping the
 * scenario/module catalog intact. Use this for a clean hand-over or before
 * creating fresh admin credentials.
 *
 *   npm run accounts:reset -- --yes
 *   npm run accounts:reset -- --yes --dry-run
 *
 * A JSON backup is written to backups/ before anything is deleted. The catalog
 * (Scenario, EducationModule) and its configuration are never touched.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const confirmed = args.has("--yes") || args.has("-y");
const dryRun = args.has("--dry-run");

async function main() {
  if (!confirmed && !dryRun) {
    throw new Error(
      "Perintah ini menghapus SEMUA akun (termasuk admin). Tambahkan --yes untuk melanjutkan, atau --dry-run untuk pratinjau.",
    );
  }

  const catalogBefore = {
    scenarios: await prisma.scenario.count(),
    modules: await prisma.educationModule.count(),
  };
  const userCount = await prisma.user.count();

  console.log("Katalog (dipertahankan):", catalogBefore);
  console.log("Akun yang akan dihapus:", userCount);

  if (userCount === 0) {
    console.log("Tidak ada akun untuk dihapus.");
    return;
  }

  if (dryRun) {
    console.log("Dry run: tidak ada data yang dihapus.");
    return;
  }

  const backup = {
    createdAt: new Date().toISOString(),
    reason: "reset-all-accounts",
    users: await prisma.user.findMany(),
    sessions: await prisma.session.findMany(),
    attempts: await prisma.simulationAttempt.findMany(),
    responses: await prisma.simulationResponse.findMany(),
    assessments: await prisma.assessment.findMany(),
    badges: await prisma.userBadge.findMany(),
    moduleProgress: await prisma.moduleProgress.findMany(),
    reflexAttempts: await prisma.reflexAttempt.findMany(),
    xpTransactions: await prisma.xpTransaction.findMany(),
    resetTokens: await prisma.passwordResetToken.findMany(),
    rateLimits: await prisma.rateLimit.findMany(),
  };

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(
    backupDir,
    `accounts-reset-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log("Backup disimpan:", backupPath);

  const deleted = await prisma.$transaction(async (tx) => {
    // Rate limits are not owned by a user, so clear them explicitly.
    const rateLimits = (await tx.rateLimit.deleteMany()).count;
    // Every account-owned table cascades from User.
    const users = (await tx.user.deleteMany()).count;
    return { users, rateLimits };
  });

  const remaining = await prisma.user.count();
  const catalogAfter = {
    scenarios: await prisma.scenario.count(),
    modules: await prisma.educationModule.count(),
  };

  console.log("Dihapus:", deleted);
  console.log("Katalog sesudah:", catalogAfter);

  if (remaining !== 0) {
    throw new Error(`Masih ada ${remaining} akun setelah reset; periksa database.`);
  }
  if (
    catalogAfter.scenarios !== catalogBefore.scenarios ||
    catalogAfter.modules !== catalogBefore.modules
  ) {
    throw new Error("Jumlah katalog berubah; periksa hasil reset.");
  }

  console.log("Reset akun selesai: semua akun terhapus, katalog utuh.");
  console.log(
    "Buat admin baru dengan: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create",
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
