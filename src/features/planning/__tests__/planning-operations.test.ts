import {
  addWorkout,
  buildPlanningBoundary,
  moveWorkout,
  removeWorkout,
  type PlanningWorkout
} from "@/features/planning/planning-operations"

const seedWorkouts: PlanningWorkout[] = [
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

describe("planning-operations", () => {
  it("adds a workout with deterministic chronological ordering and change payload", () => {
    const result = addWorkout(seedWorkouts, {
      id: "w-3",
      title: "Recovery Ride",
      start: "2026-02-18T06:30:00.000Z",
      end: "2026-02-18T07:15:00.000Z"
    })

    expect(result.workouts.map((workout) => workout.id)).toEqual([
      "w-1",
      "w-3",
      "w-2"
    ])
    expect(result.change).toMatchObject({
      reason: "added",
      workoutId: "w-3",
      source: "controls"
    })
    expect(result.change.boundary).toEqual({
      start: "2026-02-17T09:00:00.000Z",
      end: "2026-02-19T08:00:00.000Z"
    })
  })

  it("moves an existing workout and returns stable ordering", () => {
    const result = moveWorkout(
      seedWorkouts,
      "w-1",
      {
        start: "2026-02-20T09:00:00.000Z",
        end: "2026-02-20T10:00:00.000Z"
      },
      "calendar"
    )

    expect(result.workouts.map((workout) => workout.id)).toEqual(["w-2", "w-1"])
    expect(result.change).toMatchObject({
      reason: "moved",
      workoutId: "w-1",
      source: "calendar"
    })
    expect(result.change.boundary).toEqual({
      start: "2026-02-19T07:00:00.000Z",
      end: "2026-02-20T10:00:00.000Z"
    })
  })

  it("removes an existing workout and emits boundary for remaining set", () => {
    const result = removeWorkout(seedWorkouts, "w-2")

    expect(result.workouts).toEqual([seedWorkouts[0]])
    expect(result.change).toMatchObject({
      reason: "removed",
      workoutId: "w-2",
      source: "controls",
      boundary: {
        start: "2026-02-17T09:00:00.000Z",
        end: "2026-02-17T10:00:00.000Z"
      }
    })
  })

  it("returns null boundary for empty workout sets", () => {
    expect(buildPlanningBoundary([])).toBeNull()
  })

  it("throws actionable errors for unknown workout ids", () => {
    expect(() =>
      moveWorkout(
        seedWorkouts,
        "missing",
        {
          start: "2026-02-20T09:00:00.000Z",
          end: "2026-02-20T10:00:00.000Z"
        },
        "calendar"
      )
    ).toThrow("Cannot move missing workout id `missing`.")

    expect(() => removeWorkout(seedWorkouts, "missing")).toThrow(
      "Cannot remove missing workout id `missing`."
    )
  })
})
