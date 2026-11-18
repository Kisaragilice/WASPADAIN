import { NextResponse, type NextRequest } from "next/server";
import {
  sessionCookieName,
  passwordChangeCookieName,
} from "@/lib/auth/cookie";
import { isMutationMethod, isTrustedMutationRequest } from "@/lib/security";

const PROTECTED_PREFIXES = [
  "/simulasi",
  "/modul",
  "/radar",
  "/profil",
  "/kab",
  "/admin",
  "/ubah-sandi",
];

const PASSWORD_CHANGE_PATHS = new Set(["/ubah-sandi"]);
const PASSWORD_CHANGE_API = ["/api/account", "/api/auth/logout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && isMutationMethod(request.method)) {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json(
        { error: "Permintaan ditolak: origin tidak tepercaya." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const hasSession = request.cookies.has(sessionCookieName());
    if (!hasSession) {
      const url = new URL("/masuk", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // A bootstrapped admin must replace the initial password before using the
  // rest of the app. The flag lives in a cookie so the edge middleware can
  // enforce it without touching the database.
  const mustChangePassword = request.cookies.has(passwordChangeCookieName());
  if (mustChangePassword) {
    const apiAllowed = PASSWORD_CHANGE_API.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (pathname.startsWith("/api/") && !apiAllowed) {
      return NextResponse.json(
        { error: "Ganti kata sandi awal terlebih dahulu." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (isProtected && !PASSWORD_CHANGE_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/ubah-sandi", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
