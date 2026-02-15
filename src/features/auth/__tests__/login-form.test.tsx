import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"

import { LoginForm } from "@/features/auth/components/login-form"
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

describe("LoginForm", () => {
  beforeEach(() => {
    replaceMock.mockReset()
  })

  it("redirects non-onboarded users to onboarding after login", async () => {
    const user = userEvent.setup()

    server.use(
      http.post("/api/auth/login", () =>
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
      )
    )

    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "athlete@example.com")
    await user.type(screen.getByLabelText("Password"), "athlete-pass")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/onboarding")
    })
  })

  it("redirects onboarded users to home after login", async () => {
    const user = userEvent.setup()

    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({
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
      )
    )

    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "coach@example.com")
    await user.type(screen.getByLabelText("Password"), "coach-pass")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/")
    })
  })

  it("shows backend auth errors and keeps the user on login", async () => {
    const user = userEvent.setup()

    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json(
          {
            data: null,
            error: {
              code: "invalid_credentials",
              message: "Email or password is invalid.",
              details: {}
            }
          },
          { status: 401 }
        )
      )
    )

    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "athlete@example.com")
    await user.type(screen.getByLabelText("Password"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is invalid."
    )
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
