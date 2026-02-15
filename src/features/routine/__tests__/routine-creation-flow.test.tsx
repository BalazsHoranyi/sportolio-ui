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
  it("uses the shared app-shell layout contract", () => {
    render(<RoutineCreationFlow />)

    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("data-layout", "app-shell")
    expect(main).toHaveClass("app-shell")
  })

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

  it("surfaces lint warnings for risky DSL constructs without blocking valid apply", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    fireEvent.change(dslEditor, {
      target: {
        value: JSON.stringify(
          {
            name: "Warning Builder",
            path: "strength",
            strength: {
              exerciseIds: ["ex-1"],
              variables: [],
              blocks: [
                {
                  id: "block-1",
                  name: "Primary block",
                  repeatCount: 1,
                  condition: "",
                  exercises: [
                    {
                      id: "entry-1",
                      exerciseId: "ex-1",
                      condition: "",
                      sets: [
                        {
                          id: "set-1",
                          reps: 5,
                          load: "100kg",
                          restSeconds: 120,
                          timerSeconds: null,
                          progression: {
                            strategy: "linear",
                            value: ""
                          },
                          condition: ""
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            endurance: {
              timeline: [
                {
                  kind: "interval",
                  id: "int-1",
                  label: "Steady",
                  durationSeconds: 300,
                  targetType: "power",
                  targetValue: 250
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

    expect(
      screen.getByText(/requires a non-empty progression value/i)
    ).toBeVisible()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Visual" }))
    expect(screen.getByLabelText("Routine name")).toHaveValue("Warning Builder")
  })

  it("shows inline DSL primitive docs for advanced editing guidance", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    expect(
      screen.getByRole("heading", {
        name: "DSL primitive reference"
      })
    ).toBeVisible()
    expect(screen.getByText("strength.variables")).toBeVisible()
    expect(screen.getByText("endurance.timeline")).toBeVisible()
  })

  it("indicates syntax highlighting and autocomplete support in DSL mode", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "DSL" }))

    expect(
      screen.getByText(/Syntax highlighting and autocomplete enabled/i)
    ).toBeVisible()
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
    render(<RoutineCreationFlow />)

    await user.click(screen.getByRole("button", { name: "Endurance" }))

    await user.click(screen.getByRole("button", { name: "Add block" }))
    expect(screen.getByText("Block 1")).toBeVisible()

    await user.click(
      screen.getByRole("button", { name: "Save Block 1 as reusable block" })
    )

    await user.click(screen.getByRole("button", { name: "Insert Block 1" }))

    const preview = screen.getByLabelText("Routine payload preview")
    const serialized = preview.textContent ?? ""
    const payload = JSON.parse(serialized)
    expect(
      payload.endurance.timeline.filter(
        (entry: { kind: string }) => entry.kind === "block"
      )
    ).toHaveLength(2)
    expect(payload.endurance.reusableBlocks).toHaveLength(1)
  })

  it("renders an executable tracking payload preview that updates with routine edits", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "back squat")
    await user.click(
      await screen.findByRole("option", {
        name: /Back Squat/i
      })
    )

    await user.click(screen.getByRole("button", { name: "Endurance" }))
    await user.click(screen.getByRole("button", { name: "Add block" }))

    const executionPreview = screen.getByLabelText(
      "Tracking execution payload preview"
    )
    const payload = JSON.parse(executionPreview.textContent ?? "")

    expect(payload.schema_version).toBe("1.0")
    expect(payload.routine_name).toBe("New Routine")
    expect(payload.strength_sets.length).toBeGreaterThan(0)
    expect(payload.strength_sets[0]).toMatchObject({
      exercise_id: "ex-1",
      exercise_name: "Back Squat"
    })
    expect(payload.endurance_intervals.length).toBeGreaterThan(1)
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

  it("supports advanced strength controls and retains them in DSL mode", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    const searchInput = screen.getByLabelText("Search exercises")
    await user.type(searchInput, "back squat")
    await user.click(
      await screen.findByRole("option", {
        name: /Back Squat/i
      })
    )

    await user.click(screen.getByRole("button", { name: "Add variable" }))
    await user.type(screen.getByLabelText("Variable name 1"), "topSetLoad")
    await user.type(screen.getByLabelText("Variable default value 1"), "100kg")

    fireEvent.change(screen.getByLabelText("Loop count for Primary block"), {
      target: { value: "3" }
    })
    await user.type(
      screen.getByLabelText("Condition for Primary block"),
      "week<=4"
    )
    await user.type(
      screen.getByLabelText("Condition for Back Squat"),
      "readiness>=7"
    )
    await user.selectOptions(
      screen.getByLabelText("Progression for Back Squat set 1"),
      "linear"
    )
    await user.type(
      screen.getByLabelText("Progression value for Back Squat set 1"),
      "+2.5kg/week"
    )

    await user.click(screen.getByRole("button", { name: "DSL" }))

    const dslEditor = screen.getByLabelText("Routine DSL editor")
    expect((dslEditor as HTMLTextAreaElement).value).toContain('"variables"')
    expect((dslEditor as HTMLTextAreaElement).value).toContain(
      '"repeatCount": 3'
    )
    expect((dslEditor as HTMLTextAreaElement).value).toContain('"condition"')
    expect((dslEditor as HTMLTextAreaElement).value).toContain('"progression"')
  })

  it("supports drag/drop and keyboard reorder for strength exercises", async () => {
    const user = userEvent.setup()

    render(<RoutineCreationFlow />)

    const searchInput = screen.getByLabelText("Search exercises")

    await user.type(searchInput, "back squat")
    await user.click(
      await screen.findByRole("option", {
        name: /Back Squat/i
      })
    )

    await user.clear(searchInput)
    await user.type(searchInput, "seated cable row")
    await user.click(
      await screen.findByRole("option", {
        name: /Seated Cable Row/i
      })
    )

    const list = screen.getByLabelText("Exercises in Primary block")
    const beforeDrag = within(list).getAllByRole("listitem")
    expect(beforeDrag[0]).toHaveTextContent("Back Squat")
    expect(beforeDrag[1]).toHaveTextContent("Seated Cable Row")

    fireEvent.dragStart(screen.getByLabelText("Drag Seated Cable Row"))
    fireEvent.dragOver(screen.getByLabelText("Drop before Back Squat"))
    fireEvent.drop(screen.getByLabelText("Drop before Back Squat"))

    const afterDrag = within(list).getAllByRole("listitem")
    expect(afterDrag[0]).toHaveTextContent("Seated Cable Row")
    expect(afterDrag[1]).toHaveTextContent("Back Squat")

    await user.click(
      screen.getByRole("button", { name: "Move Seated Cable Row down" })
    )

    const afterKeyboard = within(list).getAllByRole("listitem")
    expect(afterKeyboard[0]).toHaveTextContent("Back Squat")
    expect(afterKeyboard[1]).toHaveTextContent("Seated Cable Row")
  })
})

it("saves templates and instantiates them with source attribution", async () => {
  const user = userEvent.setup()

  render(<RoutineCreationFlow />)

  const routineName = screen.getByLabelText("Routine name")
  await user.clear(routineName)
  await user.type(routineName, "Coach Shared Builder")

  await user.selectOptions(
    screen.getByLabelText("Template owner role"),
    "coach"
  )
  await user.selectOptions(
    screen.getByLabelText("Template visibility"),
    "shared"
  )
  await user.type(screen.getByLabelText("Template tags"), "strength, power")

  await user.click(screen.getByRole("button", { name: "Save as template" }))
  expect(screen.getByText("Coach Shared Builder")).toBeVisible()

  await user.selectOptions(screen.getByLabelText("Active user role"), "athlete")
  await user.selectOptions(
    screen.getByLabelText("Instantiation context"),
    "micro"
  )

  await user.click(
    screen.getByRole("button", { name: "Instantiate Coach Shared Builder" })
  )

  const routinePreview = screen.getByLabelText("Routine payload preview")
  expect(routinePreview).toHaveTextContent('"templateSource"')
  expect(routinePreview).toHaveTextContent('"context": "micro"')
})
