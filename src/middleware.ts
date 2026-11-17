import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/simulasi",
  "/modul",
  "/radar",
  "/profil",
  "/kab",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const hasSession = request.cookies.has("waspadain_session");
    if (!hasSession) {
      const url = new URL("/masuk", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/simulasi/:path*",
    "/modul/:path*",
    "/radar/:path*",
    "/profil/:path*",
    "/kab/:path*",
    "/admin/:path*",
  ],
};
