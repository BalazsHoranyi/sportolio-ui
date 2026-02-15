import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PlanningSurface } from "@/features/planning/components/planning-surface"

vi.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="fullcalendar-mock">
      <button
        type="button"
        onClick={() => {
          const eventDrop = props.eventDrop as
            | ((payload: Record<string, unknown>) => void)
            | undefined

          eventDrop?.({
            event: {
              id: "w-1",
              start: new Date("2026-02-20T09:00:00.000Z"),
              end: new Date("2026-02-20T10:00:00.000Z")
            }
          })
        }}
      >
        Simulate drag move
      </button>
    </div>
  )
}))

vi.mock("@fullcalendar/daygrid", () => ({
  __esModule: true,
  default: {}
}))

vi.mock("@fullcalendar/timegrid", () => ({
  __esModule: true,
  default: {}
}))

vi.mock("@fullcalendar/interaction", () => ({
  __esModule: true,
  default: {}
}))

describe("PlanningSurface audit reflow", () => {
  it("reflows weekly audit session links immediately after calendar drag move", async () => {
    const user = userEvent.setup()

    render(<PlanningSurface />)

    const dayDetails = screen.getByLabelText("Weekly audit day details")

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Tue day marker" }))
    expect(
      within(dayDetails).getByRole("link", { name: "Back Squat" })
    ).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Simulate drag move" }))

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Tue day marker" }))
    expect(
      within(dayDetails).queryByRole("link", { name: "Back Squat" })
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Fri day marker" }))
    expect(
      within(dayDetails).getByRole("link", { name: "Back Squat" })
    ).toBeVisible()
  })
})
