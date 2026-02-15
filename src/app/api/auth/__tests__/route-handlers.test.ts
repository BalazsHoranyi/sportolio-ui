import {
  handleLoginRequest,
  handleLogoutRequest,
  handleOnboardingRequest,
  handleSessionRequest
} from "@/features/auth/server/auth-route-handlers"

describe("auth api route handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.SPORTOLO_API_BASE_URL = "http://127.0.0.1:8000/v1"
  })

  it("proxies login and sets a secure session cookie", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            session_token: "session-token-1",
            expires_at: "2026-02-15T20:00:00+00:00",
            actor: {
              user_id: "athlete-1",
              email: "athlete@example.com",
              role: "athlete",
              onboarding_completed: false,
              display_name: null
            }
          },
          error: null
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    )

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "athlete@example.com",
        password: "athlete-pass"
      })
    })

    const response = await handleLoginRequest(request)
    const body = (await response.json()) as {
      data: { actor: { email: string } }
      error: null
    }

    expect(body.data.actor.email).toBe("athlete@example.com")
    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("sportolo_session=")
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/auth/login",
      expect.objectContaining({
        method: "POST"
      })
    )
  })

  it("requires a session cookie for session lookup", async () => {
    const response = await handleSessionRequest(
      new Request("http://localhost/api/auth/session")
    )
    const body = (await response.json()) as {
      data: null
      error: { code: string }
    }

    expect(response.status).toBe(401)
    expect(body.error.code).toBe("auth_required")
  })

  it("requires a session cookie for onboarding and forwards bearer token when present", async () => {
    const unauthorized = await handleOnboardingRequest(
      new Request("http://localhost/api/auth/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          display_name: "Athlete One",
          role: "athlete",
          context: { primary_modality: "cycling", experience_level: "novice" }
        })
      })
    )
    expect(unauthorized.status).toBe(401)

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            actor: {
              user_id: "athlete-1",
              email: "athlete@example.com",
              role: "athlete",
              onboarding_completed: true,
              display_name: "Athlete One"
            }
          },
          error: null
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    )

    const authorized = await handleOnboardingRequest(
      new Request("http://localhost/api/auth/onboarding", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "sportolo_session=session-token-1"
        },
        body: JSON.stringify({
          display_name: "Athlete One",
          role: "athlete",
          context: { primary_modality: "cycling", experience_level: "novice" }
        })
      })
    )

    expect(authorized.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/v1/auth/onboarding",
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer session-token-1"
        })
      })
    )
  })

  it("clears session cookie on logout", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { revoked: true }, error: null }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    )

    const response = await handleLogoutRequest(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: "sportolo_session=session-token-1"
        }
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain("sportolo_session=")
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })
})
