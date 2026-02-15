import { NextRequest, NextResponse } from "next/server"

import { AUTH_SESSION_COOKIE } from "@/features/auth/constants"
import { evaluateAuthGuard } from "@/features/auth/guard-policy"
import { resolveActorFromSessionToken } from "@/features/auth/server/session-resolver"

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(AUTH_SESSION_COOKIE)?.value ?? null
  const actor = sessionToken
    ? await resolveActorFromSessionToken(sessionToken)
    : null

  const redirectPath = evaluateAuthGuard({
    pathname: request.nextUrl.pathname,
    actor
  })

  if (!redirectPath) {
    return NextResponse.next()
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url))
  if (redirectPath === "/login" && sessionToken && !actor) {
    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: "",
      path: "/",
      maxAge: 0
    })
  }
  return response
}

export const config = {
  matcher: [
    "/",
    "/today",
    "/routine",
    "/dashboard/:path*",
    "/coach",
    "/coach/:path*",
    "/login",
    "/onboarding"
  ]
}
