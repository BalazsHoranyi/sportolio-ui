import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"

import { OnboardingForm } from "@/features/auth/components/onboarding-form"
import { server } from "@/test/msw/server"

const { replaceMock, routerMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  routerMock: {
    replace: vi.fn()
  }
}))

routerMock.replace = replaceMock

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock
}))

describe("OnboardingForm", () => {
  beforeEach(() => {
    replaceMock.mockReset()
  })

  it("renders athlete onboarding fields and submits athlete context", async () => {
    const user = userEvent.setup()
    let submittedBody: Record<string, unknown> | null = null

    server.use(
      http.get("/api/auth/session", () =>
        HttpResponse.json({
          data: {
            actor: {
              user_id: "athlete-1",
              email: "athlete@example.com",
              role: "athlete",
              onboarding_completed: false,
              display_name: null
            }
          },
          error: null
        })
      ),
      http.post("/api/auth/onboarding", async ({ request }) => {
        submittedBody = (await request.json()) as Record<string, unknown>

        return HttpResponse.json({
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
        })
      })
    )

    render(<OnboardingForm />)

    await screen.findByRole("heading", { name: "Complete onboarding" })
    await user.type(screen.getByLabelText("Display name"), "Athlete One")
    await user.type(screen.getByLabelText("Primary modality"), "cycling")
    await user.type(screen.getByLabelText("Experience level"), "intermediate")
    await user.click(
      screen.getByRole("button", { name: "Complete onboarding" })
    )

    await waitFor(() => {
      expect(submittedBody).toEqual({
        display_name: "Athlete One",
        role: "athlete",
        context: {
          primary_modality: "cycling",
          experience_level: "intermediate"
        }
      })
    })
    expect(replaceMock).toHaveBeenCalledWith("/")
  })

  it("renders coach onboarding fields and submits coach context", async () => {
    const user = userEvent.setup()
    let submittedBody: Record<string, unknown> | null = null

    server.use(
      http.get("/api/auth/session", () =>
        HttpResponse.json({
          data: {
            actor: {
              user_id: "coach-1",
              email: "coach@example.com",
              role: "coach",
              onboarding_completed: false,
              display_name: null
            }
          },
          error: null
        })
      ),
      http.post("/api/auth/onboarding", async ({ request }) => {
        submittedBody = (await request.json()) as Record<string, unknown>

        return HttpResponse.json({
          data: {
            actor: {
              user_id: "coach-1",
              email: "coach@example.com",
              role: "coach",
              onboarding_completed: true,
              display_name: "Coach One"
            }
          },
          error: null
        })
      })
    )

    render(<OnboardingForm />)

    await screen.findByRole("heading", { name: "Complete onboarding" })
    await user.type(screen.getByLabelText("Display name"), "Coach One")
    await user.type(screen.getByLabelText("Coaching focus"), "hybrid strength")
    await user.type(screen.getByLabelText("Athlete capacity"), "25")
    await user.click(
      screen.getByRole("button", { name: "Complete onboarding" })
    )

    await waitFor(() => {
      expect(submittedBody).toEqual({
        display_name: "Coach One",
        role: "coach",
        context: {
          coaching_focus: "hybrid strength",
          athlete_capacity: 25
        }
      })
    })
    expect(replaceMock).toHaveBeenCalledWith("/")
  })

  it("redirects to login when no active session exists", async () => {
    server.use(
      http.get("/api/auth/session", () =>
        HttpResponse.json(
          {
            data: null,
            error: {
              code: "auth_required",
              message: "Authentication is required.",
              details: {}
            }
          },
          { status: 401 }
        )
      )
    )

    render(<OnboardingForm />)

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login")
    })
  })
})
