/**
 * Bootstraps the first administrator. Safe to re-run; never overwrites an
 * existing password.
 *
 * Usage (password never stored in code or logs):
 *   ADMIN_EMAIL=admin@waspadain.id ADMIN_PASSWORD='...' npm run admin:create
 *   npm run admin:create            # prompts for the password interactively
 *   ADMIN_EMAIL=admin@waspadain.id ADMIN_PASSWORD='...' npm run admin:reset
 *
 * `admin:reset` (or --reset) rotates the password of an existing admin and
 * revokes every active session. Without the flag an existing password is
 * never overwritten.
 *
 * The account is created with mustChangePassword=true so the initial password
 * must be replaced on first login.
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const args = new Set(process.argv.slice(2));
const resetPassword =
  args.has("--reset") || process.env.ADMIN_RESET_PASSWORD === "true";

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const stdout = process.stdout;
    stdout.write(prompt);
    let value = "";
    const input = process.stdin;
    const onData = (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\n" || char === "\r") {
          input.removeListener("data", onData);
          stdout.write("\n");
          rl.close();
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          process.exit(1);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    };
    input.on("data", onData);
  });
}

async function resolvePassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (!process.stdin.isTTY) {
    throw new Error(
      "ADMIN_PASSWORD wajib diisi (atau jalankan di terminal interaktif).",
    );
  }
  const first = await readHidden("Kata sandi admin awal: ");
  const second = await readHidden("Ulangi kata sandi admin awal: ");
  if (first !== second) throw new Error("Kata sandi tidak cocok.");
  return first;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL?.trim() || "admin@waspadain.id").toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  if (!email.includes("@")) {
    throw new Error("ADMIN_EMAIL wajib berupa alamat email valid.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role !== "ADMIN") {
      throw new Error(
        `Akun ${email} sudah ada dengan peran ${existing.role}. Bootstrap tidak menaikkan peran secara diam-diam.`,
      );
    }
    if (!resetPassword) {
      console.log("Admin sudah ada; kata sandi tidak diubah.", {
        email,
        role: existing.role,
      });
      console.log(
        "Untuk merotasi kata sandi admin: ADMIN_PASSWORD='...' npm run admin:reset",
      );
      return;
    }

    const password = await resolvePassword();
    if (!password || password.length < 8) {
      throw new Error("Kata sandi admin minimal 8 karakter.");
    }
    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, mustChangePassword: true },
      }),
      // Revoke every session so a stolen cookie cannot survive the rotation.
      prisma.session.deleteMany({ where: { userId: existing.id } }),
    ]);

    console.log("Kata sandi admin diperbarui dan semua sesi dicabut:", {
      email,
      role: existing.role,
      mustChangePassword: true,
    });
    console.log("Ganti kata sandi awal saat login berikutnya. Hapus ADMIN_PASSWORD dari environment.");
    return;
  }

  const password = await resolvePassword();
  if (!password || password.length < 8) {
    throw new Error("Kata sandi admin awal minimal 8 karakter.");
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      mustChangePassword: true,
    },
    select: { id: true, email: true, role: true, mustChangePassword: true },
  });

  console.log("Admin dibuat:", {
    id: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  console.log("Ganti kata sandi awal saat login pertama. Hapus ADMIN_PASSWORD dari environment.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
