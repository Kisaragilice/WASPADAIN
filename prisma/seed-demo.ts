/**
 * Development/test demo data only. Never run in production.
 *
 *   SEED_DEMO_DATA=true DEMO_PASSWORD='...' npm run db:seed:demo
 *
 * Catalog content (scenarios + modules) is seeded separately by db:seed:catalog.
 * Admin accounts are provisioned by scripts/bootstrap-admin.ts, not here.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { scoreKab } from "../src/lib/kab";

const prisma = new PrismaClient();

const DEMO_EMAIL = "warga@waspadain.id";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed demo tidak boleh dijalankan di production.");
  }
  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log("Seed demo dilewati (set SEED_DEMO_DATA=true untuk menjalankan).");
    return;
  }

  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 8) {
    throw new Error("DEMO_PASSWORD wajib diisi minimal 8 karakter untuk seed demo.");
  }

  const passwordHash = await hash(demoPassword, 12);
  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Rani Prameswari",
      email: DEMO_EMAIL,
      passwordHash,
      xp: 145,
    },
  });

  const demoAttempts = await prisma.simulationAttempt.count({
    where: { userId: demo.id },
  });

  if (demoAttempts === 0) {
    const etle = await prisma.scenario.findUnique({ where: { slug: "etle-apk" } });
    const sms = await prisma.scenario.findUnique({ where: { slug: "sms-poin-bank" } });
    if (etle && sms) {
      await prisma.simulationAttempt.create({
        data: {
          userId: demo.id,
          scenarioId: etle.id,
          variantIndex: 0,
          status: "COMPLETED",
          outcome: "SAFE",
          score: 100,
          xpEarned: 60,
          redFlagsIdentified: 3,
          redFlagsTotal: 3,
          vulnerableCategories: [],
          startedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
        },
      });
      await prisma.simulationAttempt.create({
        data: {
          userId: demo.id,
          scenarioId: sms.id,
          variantIndex: 1,
          status: "COMPLETED",
          outcome: "VULNERABLE",
          score: 0,
          xpEarned: 15,
          redFlagsIdentified: 0,
          redFlagsTotal: 2,
          vulnerableCategories: ["umpan_hadiah", "data_rahasia"],
          startedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
        },
      });
      await prisma.userBadge.createMany({
        data: [
          { userId: demo.id, badgeKey: "detektif-apk", scenarioId: etle.id },
          { userId: demo.id, badgeKey: "pelapor-cepat", scenarioId: etle.id },
        ],
        skipDuplicates: true,
      });
    }

    const answers = {
      k1: false,
      k2: false,
      k3: true,
      k4: false,
      a1: 2,
      a2: 4,
      a3: 2,
      a4: 5,
      b1: 3,
      b2: 2,
      b3: 4,
      b4: 3,
    };
    const scored = scoreKab(answers);
    await prisma.assessment.create({
      data: {
        userId: demo.id,
        type: "PRE",
        answers,
        knowledge: scored.knowledge,
        attitude: scored.attitude,
        behavior: scored.behavior,
        kabIndex: scored.kabIndex,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      },
    });

    const firstModule = await prisma.educationModule.findUnique({
      where: { slug: "format-berkas" },
    });
    if (firstModule) {
      await prisma.moduleProgress.create({
        data: { userId: demo.id, moduleId: firstModule.id },
      });
    }
  }

  console.log("Seed demo selesai:", { demo: demo.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
