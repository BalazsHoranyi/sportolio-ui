import {
  buildCycleWarnings,
  buildInitialCycleDraft,
  setMicrocycleCount,
  validateGoalStep,
  validateMesocycleStep
} from "@/features/planning/cycle-creation"
import type { PlanningWorkout } from "@/features/planning/planning-operations"

describe("cycle-creation domain", () => {
  it("validates required fields in the goals step", () => {
    const draft = buildInitialCycleDraft()

    expect(validateGoalStep(draft)).toEqual(
      expect.arrayContaining([
        "Macro cycle start date is required.",
        "At least one goal is required."
      ])
    )
  })

  it("requires explicit active-goal selection for multi-goal planning", () => {
    const draft = buildInitialCycleDraft()
    draft.macroStartDate = "2026-03-02"
    draft.goals = [
      {
        id: "goal-1",
        title: "Deadlift 600",
        modality: "strength",
        priority: 1,
        eventDate: "2026-06-14"
      },
      {
        id: "goal-2",
        title: "5k PR",
        modality: "endurance",
        priority: 2,
        eventDate: "2026-06-20"
      }
    ]
    draft.activeGoalId = null

    expect(validateGoalStep(draft)).toContain(
      "Select the active priority goal."
    )
  })

  it("validates mesocycle strategy parameters", () => {
    const draft = buildInitialCycleDraft()
    draft.mesocycle.strategy = "block"
    draft.mesocycle.blockSize = 0

    expect(validateMesocycleStep(draft)).toContain(
      "Block strategy requires block size >= 1."
    )
  })

  it("returns deterministic warnings and alternatives for close events", () => {
    const draft = buildInitialCycleDraft()
    draft.macroStartDate = "2026-03-02"
    draft.goals = [
      {
        id: "goal-1",
        title: "Deadlift 600",
        modality: "strength",
        priority: 1,
        eventDate: "2026-06-14"
      },
      {
        id: "goal-2",
        title: "10k PR",
        modality: "endurance",
        priority: 2,
        eventDate: "2026-06-18"
      }
    ]
    draft.activeGoalId = "goal-1"

    expect(buildCycleWarnings(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "event_proximity",
          severity: "medium"
        })
      ])
    )
    expect(buildCycleWarnings(draft)[0].alternatives.length).toBeGreaterThan(0)
  })

  it("flags high-risk axis overlap conflicts inside recovery windows", () => {
    const draft = buildInitialCycleDraft()
    const workouts: PlanningWorkout[] = [
      {
        id: "w-1",
        title: "Back Squat",
        start: "2026-03-10T08:00:00.000Z",
        end: "2026-03-10T09:00:00.000Z"
      },
      {
        id: "w-2",
        title: "Front Squat",
        start: "2026-03-10T19:00:00.000Z",
        end: "2026-03-10T20:00:00.000Z"
      }
    ]

    const warnings = buildCycleWarnings(draft, workouts)
    const axisWarning = warnings.find(
      (warning) => warning.code === "axis_overlap"
    )

    expect(axisWarning).toBeDefined()
    expect(axisWarning?.severity).toBe("high")
    expect(axisWarning?.message).toContain("axis overlap")
    expect(axisWarning?.message).toContain("recovery window")
    expect(axisWarning?.alternatives.length).toBeGreaterThan(0)
  })

  it("returns deterministic axis-interference warnings for the same planner input", () => {
    const draft = buildInitialCycleDraft()
    const workouts: PlanningWorkout[] = [
      {
        id: "w-1",
        title: "Tempo Run",
        start: "2026-03-10T06:00:00.000Z",
        end: "2026-03-10T07:00:00.000Z"
      },
      {
        id: "w-2",
        title: "Interval Run",
        start: "2026-03-10T18:00:00.000Z",
        end: "2026-03-10T19:00:00.000Z"
      },
      {
        id: "w-3",
        title: "Recovery Ride",
        start: "2026-03-11T05:00:00.000Z",
        end: "2026-03-11T06:00:00.000Z"
      }
    ]

    expect(buildCycleWarnings(draft, workouts)).toEqual(
      buildCycleWarnings(draft, workouts)
    )
  })

  it("resizes microcycles deterministically while preserving existing edits", () => {
    const draft = buildInitialCycleDraft()
    draft.microcycleCount = 2
    draft.microcycles = [
      {
        id: "mc-01",
        label: "Microcycle 1",
        focus: "strength",
        keySessions: 3
      },
      {
        id: "mc-02",
        label: "Microcycle 2",
        focus: "endurance",
        keySessions: 2
      }
    ]

    const expanded = setMicrocycleCount(draft, 4)
    expect(expanded.microcycles).toHaveLength(4)
    expect(expanded.microcycles[0]).toMatchObject({
      id: "mc-01",
      keySessions: 3
    })
    expect(expanded.microcycles[2].id).toBe("mc-03")

    const reduced = setMicrocycleCount(expanded, 1)
    expect(reduced.microcycles).toEqual([
      expect.objectContaining({
        id: "mc-01",
        keySessions: 3
      })
    ])
  })
})
