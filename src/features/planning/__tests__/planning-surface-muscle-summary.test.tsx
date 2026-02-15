import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PlanningSurface } from "@/features/planning/components/planning-surface"

vi.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: () => <div data-testid="fullcalendar-mock" />
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

async function goToReviewStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Macro cycle start date"), "2026-02-18")
  await user.type(screen.getByLabelText("Goal title goal-1"), "Strength block")
  await user.type(screen.getByLabelText("Goal event date goal-1"), "2026-06-14")

  await user.click(screen.getByRole("button", { name: "Next: Mesocycle" }))
  await user.click(screen.getByRole("button", { name: "Next: Microcycles" }))
  await user.click(screen.getByRole("button", { name: "Next: Review" }))
}

describe("PlanningSurface microcycle muscle summary", () => {
  it("uses the shared app-shell layout contract", () => {
    render(<PlanningSurface />)

    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("data-layout", "app-shell")
    expect(main).toHaveClass("app-shell")
  })

  it("refreshes review-step summaries after planner add/move/remove operations", async () => {
    const user = userEvent.setup()
    render(<PlanningSurface />)

    await goToReviewStep(user)

    const summarySection = screen.getByLabelText("Microcycle muscle summaries")
    const microcycleOneSummary = within(summarySection).getByLabelText(
      "mc-01 muscle summary"
    )

    expect(
      within(microcycleOneSummary).queryByRole("link", { name: "Back Squat" })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Move Back Squat +1 day" })
    )
    expect(
      await within(microcycleOneSummary).findByRole("link", {
        name: "Back Squat"
      })
    ).toBeVisible()

    await user.type(screen.getByLabelText("Workout title"), "Seated Cable Row")
    fireEvent.change(screen.getByLabelText("Workout start"), {
      target: { value: "2026-02-20T06:30" }
    })
    fireEvent.change(screen.getByLabelText("Workout end"), {
      target: { value: "2026-02-20T07:15" }
    })
    await user.click(screen.getByRole("button", { name: "Add workout" }))
    expect(
      await within(microcycleOneSummary).findByRole("link", {
        name: "Seated Cable Row"
      })
    ).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Remove Back Squat" }))
    expect(
      within(microcycleOneSummary).queryByRole("link", { name: "Back Squat" })
    ).not.toBeInTheDocument()
  })
})
