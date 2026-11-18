/**
 * Ephemeral test fixtures for local verification scripts.
 *
 * These are NOT demo accounts: they are created on demand for tests and can be
 * removed with `npm run cleanup:demo -- --include-test`. Refuses to run against
 * a production database unless ALLOW_TEST_FIXTURES=1 is set explicitly.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

export const TEST_USER = {
  email: "test-warga@waspadain.test",
  password: process.env.TEST_USER_PASSWORD ?? "RahasiaUji#2026",
  name: "Penguji Warga",
};

export const TEST_ADMIN = {
  email: "test-admin@waspadain.test",
  password: process.env.TEST_ADMIN_PASSWORD ?? "RahasiaAdmin#2026",
  name: "Penguji Admin",
};

function assertNotProduction() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_FIXTURES !== "1") {
    throw new Error(
      "Fixture test menolak berjalan di production. Set ALLOW_TEST_FIXTURES=1 bila memang database uji.",
    );
  }
}

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: "USER" | "ADMIN";
}) {
  assertNotProduction();
  const passwordHash = await hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      role: input.role,
      mustChangePassword: false,
    },
    create: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      mustChangePassword: false,
    },
    select: { id: true, email: true, role: true },
  });
}

export async function ensureTestUser() {
  await upsertUser({ ...TEST_USER, role: "USER" });
  return { email: TEST_USER.email, password: TEST_USER.password };
}

export async function ensureTestAdmin() {
  await upsertUser({ ...TEST_ADMIN, role: "ADMIN" });
  return { email: TEST_ADMIN.email, password: TEST_ADMIN.password };
}

export async function disconnectFixtures() {
  await prisma.$disconnect();
}
