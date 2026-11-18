import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sessionCookieName, passwordChangeCookieName } from "@/lib/auth/cookie";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth/token";

const SESSION_DAYS = 7;

const COOKIE_NAME = sessionCookieName();

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "xp" | "mustChangePassword" | "createdAt"
>;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    priority: "high" as const,
  };
}

export async function createUserSession(userId: string) {
  const token = createOpaqueToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // Opportunistic cleanup keeps expired rows from accumulating without a
  // separate scheduler. It also prunes old rate-limit windows.
  const now = new Date();
  await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
  ]);

  await prisma.session.create({
    data: {
      tokenHash: hashOpaqueToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    ...cookieOptions(),
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashOpaqueToken(token) },
    });
  }
  cookieStore.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
  cookieStore.set(passwordChangeCookieName(), "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}

export async function setPasswordChangePending() {
  const cookieStore = await cookies();
  cookieStore.set(passwordChangeCookieName(), "1", {
    ...cookieOptions(),
    maxAge: 60 * 60,
  });
}

export async function clearPasswordChangePending() {
  const cookieStore = await cookies();
  cookieStore.set(passwordChangeCookieName(), "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}

/** Revokes every session, including the current one. */
export async function revokeAllSessions(userId: string) {
  return prisma.session.deleteMany({ where: { userId } });
}

/** Revokes all sessions except the token in the current request. */
export async function revokeOtherSessions(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return revokeAllSessions(userId);
  return prisma.session.deleteMany({
    where: { userId, tokenHash: { not: hashOpaqueToken(token) } },
  });
}

export const getCurrentUser = cache(async (): Promise<SafeUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          xp: true,
          mustChangePassword: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session
      .deleteMany({ where: { id: session.id } })
      .catch(() => null);
    return null;
  }

  return session.user;
});

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  return user;
}

export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/simulasi");
  return user;
}

export async function requireApiUser() {
  return getCurrentUser();
}

export function isAdminRole(role: Role) {
  return role === "ADMIN";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
