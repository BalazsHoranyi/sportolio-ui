import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { StrengthRoutineBuilder } from "@/features/routine/components/strength-routine-builder"

vi.mock("react-muscle-highlighter", () => ({
  __esModule: true,
  default: ({ side }: { side: "front" | "back" }) => (
    <div data-testid={`muscle-body-${side}`} />
  )
}))

describe("StrengthRoutineBuilder muscle maps", () => {
  it("renders exercise, routine, and microcycle muscle maps that update as composition changes", async () => {
    const user = userEvent.setup()

    render(<StrengthRoutineBuilder />)

    const routineMap = screen.getByLabelText("Routine Muscle Map contributions")
    expect(within(routineMap).queryAllByRole("listitem")).toHaveLength(0)

    const searchInput = screen.getByLabelText("Search exercises")

    await user.clear(searchInput)
    await user.type(searchInput, "back squat")
    const backSquatOption = await screen.findByRole("option", {
      name: /Back Squat/i
    })
    await user.click(backSquatOption)

    await user.clear(searchInput)
    await user.type(searchInput, "seated cable row")
    const rowOption = await screen.findByRole("option", {
      name: /Seated Cable Row/i
    })
    await user.click(rowOption)

    expect(
      await screen.findByRole("heading", { name: "Exercise Muscle Maps" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Routine Muscle Map" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Microcycle Muscle Map" })
    ).toBeVisible()

    const updatedRoutineMap = screen.getByLabelText(
      "Routine Muscle Map contributions"
    )
    expect(updatedRoutineMap).toHaveTextContent("upper-back")

    await user.click(
      screen.getByRole("button", { name: "Remove Seated Cable Row" })
    )

    expect(
      screen.getByLabelText("Routine Muscle Map contributions")
    ).not.toHaveTextContent("upper-back")
  })
})
