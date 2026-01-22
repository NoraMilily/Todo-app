import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
});

const publicPages = ["/auth/login", "/auth/register"];

function stripLocale(pathname: string) {
  return pathname.replace(new RegExp(`^/(${locales.join("|")})(?=/|$)`), "") || "/";
}

function getLocaleFromPath(pathname: string): AppLocale {
  const segment = pathname.split("/")[1] as AppLocale | undefined;
  return segment && locales.includes(segment) ? segment : defaultLocale;
}

export default auth((req) => {
  const intlResponse = intlMiddleware(req as unknown as NextRequest);

  // If next-intl needs to redirect (e.g. "/" -> "/en"), do it before auth checks.
  if (intlResponse.headers.get("location")) return intlResponse;

  const pathnameWithoutLocale = stripLocale(req.nextUrl.pathname);
  const isPublic = publicPages.includes(pathnameWithoutLocale);
  if (isPublic) return intlResponse;

  // Protect everything else.
  if (!req.auth) {
    const locale = getLocaleFromPath(req.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
  }

  return intlResponse;
});

export const config = {
  matcher: [
    // Match all routes except API routes, Next.js internals, and static files.
    "/((?!api|_next|.*\\..*).*)",
  ],
};
