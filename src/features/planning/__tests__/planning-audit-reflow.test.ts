import {
  buildPlannedAuditReflow,
  type PlannedAuditInputWorkout
} from "@/features/planning/planning-audit-reflow"

const workouts: PlannedAuditInputWorkout[] = [
  {
    id: "w-1",
    title: "Back Squat",
    start: "2026-02-17T09:00:00.000Z",
    end: "2026-02-17T10:00:00.000Z"
  },
  {
    id: "w-2",
    title: "Tempo Run",
    start: "2026-02-19T07:00:00.000Z",
    end: "2026-02-19T08:00:00.000Z"
  }
]

describe("planning-audit-reflow", () => {
  it("maps planner workouts into a deterministic weekly and monthly planned audit shape", () => {
    const result = buildPlannedAuditReflow(workouts)

    expect(result.weekly.seriesState).toBe("planned")
    expect(result.weekly.days).toHaveLength(7)
    expect(result.monthly.windows).toHaveLength(1)
    expect(result.monthly.windows[0]?.days).toHaveLength(30)

    const tuesday = result.weekly.days.find((day) => day.dayLabel === "Tue")
    const thursday = result.weekly.days.find((day) => day.dayLabel === "Thu")

    expect(tuesday?.sessions).toEqual([
      {
        id: "w-1",
        label: "Back Squat",
        href: "/sessions/w-1"
      }
    ])
    expect(thursday?.sessions).toEqual([
      {
        id: "w-2",
        label: "Tempo Run",
        href: "/sessions/w-2"
      }
    ])
  })

  it("reflows day-level session mapping when a workout moves", () => {
    const moved = workouts.map((workout) =>
      workout.id === "w-1"
        ? {
            ...workout,
            start: "2026-02-18T09:00:00.000Z",
            end: "2026-02-18T10:00:00.000Z"
          }
        : workout
    )

    const result = buildPlannedAuditReflow(moved)

    const tuesday = result.weekly.days.find((day) => day.dayLabel === "Tue")
    const wednesday = result.weekly.days.find((day) => day.dayLabel === "Wed")

    expect(tuesday?.sessions).toEqual([])
    expect(wednesday?.sessions).toEqual([
      {
        id: "w-1",
        label: "Back Squat",
        href: "/sessions/w-1"
      }
    ])
  })

  it("is deterministic for identical inputs", () => {
    const first = buildPlannedAuditReflow(workouts)
    const second = buildPlannedAuditReflow(workouts)

    expect(second).toEqual(first)
  })
})
