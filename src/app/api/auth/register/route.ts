import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseBody, apiError } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { createUserSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const parsed = await parseBody(request, registerSchema);
  if ("response" in parsed) return parsed.response;
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("Email sudah terdaftar. Silakan masuk.", 409);
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true },
  });

  await createUserSession(user.id);

  return NextResponse.json(
    {
      user,
      redirectTo: "/kab/pre-test",
    },
    { status: 201 },
  );
}
