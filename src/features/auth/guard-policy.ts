import type { AuthenticatedActor } from "@/features/auth/types"

type GuardInput = {
  pathname: string
  actor: AuthenticatedActor | null
}

function isLoginPath(pathname: string): boolean {
  return pathname === "/login"
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding"
}

function isCoachPath(pathname: string): boolean {
  return pathname === "/coach" || pathname.startsWith("/coach/")
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/today" ||
    pathname.startsWith("/today/") ||
    pathname === "/routine" ||
    pathname.startsWith("/routine/") ||
    pathname.startsWith("/dashboard/") ||
    isCoachPath(pathname)
  )
}

export function evaluateAuthGuard({
  pathname,
  actor
}: GuardInput): string | null {
  if (isLoginPath(pathname)) {
    if (!actor) {
      return null
    }
    return actor.onboarding_completed ? "/" : "/onboarding"
  }

  if (isOnboardingPath(pathname)) {
    if (!actor) {
      return "/login"
    }
    return actor.onboarding_completed ? "/" : null
  }

  if (!isProtectedPath(pathname)) {
    return null
  }

  if (!actor) {
    return "/login"
  }

  if (!actor.onboarding_completed) {
    return "/onboarding"
  }

  if (isCoachPath(pathname) && actor.role !== "coach") {
    return "/"
  }

  return null
}
