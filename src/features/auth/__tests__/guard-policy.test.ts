import type { AuthenticatedActor } from "@/features/auth/types"
import { evaluateAuthGuard } from "@/features/auth/guard-policy"

function buildActor(
  overrides: Partial<AuthenticatedActor> = {}
): AuthenticatedActor {
  return {
    user_id: "athlete-1",
    email: "athlete@example.com",
    role: "athlete",
    onboarding_completed: true,
    display_name: "Athlete One",
    ...overrides
  }
}

describe("evaluateAuthGuard", () => {
  it("redirects unauthenticated users away from protected pages", () => {
    expect(evaluateAuthGuard({ pathname: "/", actor: null })).toBe("/login")
    expect(evaluateAuthGuard({ pathname: "/today", actor: null })).toBe(
      "/login"
    )
    expect(
      evaluateAuthGuard({ pathname: "/dashboard/axis-fatigue", actor: null })
    ).toBe("/login")
  })

  it("allows unauthenticated access to login and redirects authenticated users from login", () => {
    expect(evaluateAuthGuard({ pathname: "/login", actor: null })).toBeNull()
    expect(evaluateAuthGuard({ pathname: "/login", actor: buildActor() })).toBe(
      "/"
    )
  })

  it("redirects authenticated but non-onboarded users to onboarding", () => {
    const actor = buildActor({ onboarding_completed: false })

    expect(evaluateAuthGuard({ pathname: "/", actor })).toBe("/onboarding")
    expect(evaluateAuthGuard({ pathname: "/today", actor })).toBe("/onboarding")
    expect(evaluateAuthGuard({ pathname: "/onboarding", actor })).toBeNull()
  })

  it("enforces coach-only route access", () => {
    expect(evaluateAuthGuard({ pathname: "/coach", actor: buildActor() })).toBe(
      "/"
    )

    expect(
      evaluateAuthGuard({
        pathname: "/coach",
        actor: buildActor({
          user_id: "coach-1",
          email: "coach@example.com",
          role: "coach"
        })
      })
    ).toBeNull()
  })
})
