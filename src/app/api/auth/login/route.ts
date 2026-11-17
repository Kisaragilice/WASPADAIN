import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseBody, apiError } from "@/lib/api";
import { loginSchema } from "@/lib/validators";
import { createUserSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const parsed = await parseBody(request, loginSchema);
  if ("response" in parsed) return parsed.response;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return apiError("Email atau kata sandi salah.", 401);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return apiError("Email atau kata sandi salah.", 401);
  }

  await createUserSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    redirectTo: user.role === "ADMIN" ? "/admin" : "/simulasi",
  });
}
