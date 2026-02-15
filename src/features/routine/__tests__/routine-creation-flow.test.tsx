import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RoutineCreationFlow } from "@/features/routine/components/routine-creation-flow"

describe("RoutineCreationFlow", () => {
  it("supports strength and endurance entry paths with visual/DSL synchronization", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    expect(
      screen.getByRole("heading", { name: "Routine Creation Flow" })
    ).toBeVisible()

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "back squat")

    const backSquatOption = await screen.findByRole("option", {
      name: /Back Squat/i
    })
    await user.click(backSquatOption)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    expect((dslEditor as HTMLTextAreaElement).value).toContain('"exerciseIds"')
    expect((dslEditor as HTMLTextAreaElement).value).toContain('"ex-1"')

    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Wednesday Endurance",
            path: "endurance",
            strength: { exerciseIds: ["ex-1"] },
            endurance: {
              intervals: [
                {
                  id: "int-1",
                  label: "Tempo",
                  durationSeconds: 400,
                  targetType: "power",
                  targetValue: 305
                }
              ]
            }
          },
          null,
          2
        )
      }
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Visual" }))

    expect(screen.getByRole("button", { name: "Endurance" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("Tempo")).toBeVisible()
    expect(screen.getByText("400s")).toBeVisible()
    expect(screen.getByText("power: 305")).toBeVisible()
  })

  it("shows actionable inline validation feedback for invalid DSL and preserves last valid state", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "back squat")
    const backSquatOption = await screen.findByRole("option", {
      name: /Back Squat/i
    })
    await user.click(backSquatOption)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    fireEvent.change(dslEditor, {
      target: {
        value: "{ invalid json"
      }
    })

    expect(screen.getByRole("alert")).toHaveTextContent("Fix JSON syntax")

    await user.click(screen.getByRole("button", { name: "Visual" }))

    expect(screen.getByRole("button", { name: "Strength" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    const selectedExercises = screen.getByLabelText(
      "Selected strength exercises"
    )
    expect(within(selectedExercises).getByText("Back Squat")).toBeVisible()
  })

  it("applies valid DSL edits back into visual endurance fields without data loss", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "Endurance" }))

    await user.click(screen.getByRole("button", { name: "Add interval" }))

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Friday Builder",
            path: "endurance",
            strength: { exerciseIds: [] },
            endurance: {
              intervals: [
                {
                  id: "int-1",
                  label: "Warmup",
                  durationSeconds: 600,
                  targetType: "pace",
                  targetValue: 420
                },
                {
                  id: "int-2",
                  label: "Threshold",
                  durationSeconds: 480,
                  targetType: "power",
                  targetValue: 320
                }
              ]
            }
          },
          null,
          2
        )
      }
    })

    await user.click(screen.getByRole("button", { name: "Visual" }))

    expect(screen.getByText("Warmup")).toBeVisible()
    expect(screen.getByText("600s")).toBeVisible()
    expect(screen.getByText("pace: 420")).toBeVisible()
    expect(screen.getByText("Threshold")).toBeVisible()
    expect(screen.getByText("480s")).toBeVisible()
    expect(screen.getByText("power: 320")).toBeVisible()
  })
})
