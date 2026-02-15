import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react"
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

  it("supports drag edits for endurance duration and target with deterministic precision", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "Endurance" }))

    const durationHandle = screen.getByRole("button", {
      name: "Resize duration for Steady State"
    })
    await act(async () => {
      fireEvent.mouseDown(durationHandle, { clientX: 100, clientY: 120 })
    })
    await act(async () => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 145, clientY: 120 })
      )
    })
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    await waitFor(() => {
      expect(screen.getByText("345s")).toBeVisible()
    })

    const targetHandle = screen.getByRole("button", {
      name: "Adjust target for Steady State"
    })
    await act(async () => {
      fireEvent.mouseDown(targetHandle, { clientX: 100, clientY: 120 })
    })
    await act(async () => {
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 100, clientY: 145 })
      )
    })
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mouseup"))
    })

    await waitFor(() => {
      expect(screen.getByText("power: 225")).toBeVisible()
    })
  })

  it("supports nested blocks and reusable block insertion in endurance timeline preview", async () => {
    const user = userEvent.setup()
    const { container } = render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "Endurance" }))

    await user.click(screen.getByRole("button", { name: "Add block" }))
    expect(screen.getByText("Block 1")).toBeVisible()

    await user.click(
      screen.getByRole("button", { name: "Save Block 1 as reusable block" })
    )

    await user.click(screen.getByRole("button", { name: "Insert Block 1" }))

    const preview = container.querySelector("pre")
    expect(preview).not.toBeNull()

    const serialized = preview?.textContent ?? ""
    const payload = JSON.parse(serialized)
    expect(
      payload.endurance.timeline.filter(
        (entry: { kind: string }) => entry.kind === "block"
      )
    ).toHaveLength(2)
    expect(payload.endurance.reusableBlocks).toHaveLength(1)
  })

  it("supports undo/redo history for visual edits", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "back squat")
    await user.click(
      await screen.findByRole("option", {
        name: /Back Squat/i
      })
    )

    expect(
      screen.getByLabelText("Selected strength exercises")
    ).toHaveTextContent("Back Squat")

    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(
      screen.getByLabelText("Selected strength exercises")
    ).not.toHaveTextContent("Back Squat")

    await user.click(screen.getByRole("button", { name: "Redo" }))
    expect(
      screen.getByLabelText("Selected strength exercises")
    ).toHaveTextContent("Back Squat")
  })

  it("supports undo/redo history for valid DSL edits", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Tempo Builder",
            path: "endurance",
            strength: { exerciseIds: [] },
            endurance: {
              timeline: [
                {
                  kind: "interval",
                  id: "int-1",
                  label: "Tempo",
                  durationSeconds: 420,
                  targetType: "power",
                  targetValue: 305
                }
              ],
              reusableBlocks: []
            }
          },
          null,
          2
        )
      }
    })

    await user.click(screen.getByRole("button", { name: "Visual" }))
    expect(screen.getByText("Tempo")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Undo" }))
    expect(screen.queryByText("Tempo")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Redo" }))
    expect(screen.getByText("Tempo")).toBeVisible()
  })

  it("preserves last valid state when a partially invalid DSL payload is entered", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Valid Builder",
            path: "endurance",
            strength: { exerciseIds: [] },
            endurance: {
              timeline: [
                {
                  kind: "interval",
                  id: "int-1",
                  label: "Steady",
                  durationSeconds: 360,
                  targetType: "pace",
                  targetValue: 410
                }
              ],
              reusableBlocks: []
            }
          },
          null,
          2
        )
      }
    })

    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Valid Builder",
            path: "endurance",
            strength: { exerciseIds: [] },
            endurance: {
              timeline: [
                {
                  kind: "interval",
                  id: "int-1",
                  label: "",
                  durationSeconds: 360,
                  targetType: "pace",
                  targetValue: 410
                }
              ],
              reusableBlocks: []
            }
          },
          null,
          2
        )
      }
    })

    expect(screen.getByRole("alert")).toHaveTextContent(
      "non-empty string value"
    )

    await user.click(screen.getByRole("button", { name: "Visual" }))

    expect(screen.getByText("Steady")).toBeVisible()
    expect(screen.getByLabelText("Routine name")).toHaveValue("Valid Builder")
  })
})
