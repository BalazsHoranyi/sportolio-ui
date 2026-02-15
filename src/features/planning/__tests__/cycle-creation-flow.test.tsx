import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { CycleCreationFlow } from "@/features/planning/components/cycle-creation-flow"

describe("CycleCreationFlow", () => {
  afterEach(() => {
    localStorage.clear()
    cleanup()
  })

  it("supports the full macro/meso/micro wizard path with explicit priority and non-blocking warnings", async () => {
    const user = userEvent.setup()
    render(<CycleCreationFlow />)

    expect(
      screen.getByRole("heading", { name: "Cycle Creation Flow" })
    ).toBeVisible()

    await user.type(
      screen.getByLabelText("Macro cycle start date"),
      "2026-03-02"
    )

    await user.type(
      screen.getByLabelText("Goal title goal-1"),
      "Deadlift 600 lb"
    )
    await user.selectOptions(
      screen.getByLabelText("Goal modality goal-1"),
      "strength"
    )
    await user.type(
      screen.getByLabelText("Goal event date goal-1"),
      "2026-06-14"
    )

    await user.click(screen.getByRole("button", { name: "Add goal" }))
    await user.type(screen.getByLabelText("Goal title goal-2"), "5k race PR")
    await user.selectOptions(
      screen.getByLabelText("Goal modality goal-2"),
      "endurance"
    )
    await user.clear(screen.getByLabelText("Goal priority goal-2"))
    await user.type(screen.getByLabelText("Goal priority goal-2"), "2")
    await user.type(
      screen.getByLabelText("Goal event date goal-2"),
      "2026-06-17"
    )
    await user.click(screen.getByLabelText("Active goal goal-1"))

    await user.click(screen.getByRole("button", { name: "Next: Mesocycle" }))

    expect(
      screen.getByRole("heading", { name: "Mesocycle Strategy" })
    ).toBeVisible()
    await user.click(screen.getByLabelText("Strategy block"))
    await user.clear(screen.getByLabelText("Block size"))
    await user.type(screen.getByLabelText("Block size"), "2")

    await user.click(screen.getByRole("button", { name: "Next: Microcycles" }))

    expect(
      screen.getByRole("heading", { name: "Microcycle Details" })
    ).toBeVisible()
    await user.clear(screen.getByLabelText("Microcycle count"))
    await user.type(screen.getByLabelText("Microcycle count"), "3")
    await user.clear(screen.getByLabelText("Key sessions mc-01"))
    await user.type(screen.getByLabelText("Key sessions mc-01"), "3")

    await user.click(screen.getByRole("button", { name: "Next: Review" }))

    expect(screen.getByRole("heading", { name: "Review" })).toBeVisible()
    expect(screen.getByText("Event dates are close")).toBeVisible()
    expect(
      screen.getByText(
        "Alternative: Shift the lower-priority event by 7+ days."
      )
    ).toBeVisible()
    expect(screen.getByLabelText("Proceed anyway")).toBeVisible()
  })

  it("supports draft-save and continue-editing after remount", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<CycleCreationFlow />)

    await user.type(
      screen.getByLabelText("Macro cycle start date"),
      "2026-03-02"
    )
    await user.type(
      screen.getByLabelText("Goal title goal-1"),
      "Deadlift 600 lb"
    )
    await user.click(screen.getByRole("button", { name: "Save draft" }))
    expect(screen.getByText("Draft saved")).toBeVisible()

    unmount()

    render(<CycleCreationFlow />)
    expect(screen.getByText("Loaded saved draft")).toBeVisible()
    expect(screen.getByDisplayValue("Deadlift 600 lb")).toBeVisible()
    expect(screen.getByDisplayValue("2026-03-02")).toBeVisible()
  })
})
