import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PlanningCalendar } from "@/features/planning/components/planning-calendar"
import type { PlanningWorkout } from "@/features/planning/planning-operations"

let latestCalendarProps: Record<string, unknown> = {}

vi.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    latestCalendarProps = props

    return (
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
  }
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

const initialWorkouts: PlanningWorkout[] = [
  {
    id: "w-1",
    title: "Back Squat",
    start: "2026-02-17T09:00:00.000Z",
    end: "2026-02-17T10:00:00.000Z"
  }
]

describe("PlanningCalendar", () => {
  it("integrates FullCalendar with week/month view controls", async () => {
    const user = userEvent.setup()

    render(<PlanningCalendar initialWorkouts={initialWorkouts} />)

    expect(screen.getByTestId("fullcalendar-mock")).toBeVisible()
    expect(latestCalendarProps.initialView).toBe("timeGridWeek")

    await user.click(screen.getByRole("button", { name: "Month view" }))

    expect(latestCalendarProps.initialView).toBe("dayGridMonth")
  })

  it("supports add, move, and remove workout operations with recompute emissions", async () => {
    const user = userEvent.setup()
    const onPlanningChange = vi.fn()

    render(
      <PlanningCalendar
        initialWorkouts={initialWorkouts}
        onPlanningChange={onPlanningChange}
      />
    )

    await user.type(screen.getByLabelText("Workout title"), "Recovery Ride")
    fireEvent.change(screen.getByLabelText("Workout start"), {
      target: { value: "2026-02-18T06:30" }
    })
    fireEvent.change(screen.getByLabelText("Workout end"), {
      target: { value: "2026-02-18T07:15" }
    })

    await user.click(screen.getByRole("button", { name: "Add workout" }))
    expect(screen.getByText("Recovery Ride")).toBeVisible()

    await user.click(
      screen.getByRole("button", { name: "Move Back Squat +1 day" })
    )

    await user.click(
      screen.getByRole("button", { name: "Remove Recovery Ride" })
    )

    expect(onPlanningChange.mock.calls.map((entry) => entry[0].reason)).toEqual(
      ["added", "moved", "removed"]
    )
  })

  it("handles FullCalendar drag move callbacks and emits calendar-sourced recompute payload", async () => {
    const user = userEvent.setup()
    const onPlanningChange = vi.fn()

    render(
      <PlanningCalendar
        initialWorkouts={initialWorkouts}
        onPlanningChange={onPlanningChange}
      />
    )

    await user.click(screen.getByRole("button", { name: "Simulate drag move" }))

    expect(onPlanningChange).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "moved",
        workoutId: "w-1",
        source: "calendar"
      })
    )
  })

  it("supports keyboard-accessible move controls", async () => {
    const user = userEvent.setup()
    const onPlanningChange = vi.fn()

    render(
      <PlanningCalendar
        initialWorkouts={initialWorkouts}
        onPlanningChange={onPlanningChange}
      />
    )

    const moveButton = screen.getByRole("button", {
      name: "Move Back Squat +1 day"
    })
    moveButton.focus()
    await user.keyboard("{Enter}")

    expect(onPlanningChange).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "moved",
        source: "controls"
      })
    )
  })
})
