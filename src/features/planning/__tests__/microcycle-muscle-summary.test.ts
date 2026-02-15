import { buildInitialCycleDraft } from "@/features/planning/cycle-creation"
import { buildMicrocycleMuscleSummaries } from "@/features/planning/microcycle-muscle-summary"
import type { PlanningWorkout } from "@/features/planning/planning-operations"

describe("buildMicrocycleMuscleSummaries", () => {
  it("groups workouts by microcycle and returns drill-down data with muscle totals", () => {
    const draft = buildInitialCycleDraft()
    draft.macroStartDate = "2026-02-17"
    draft.microcycleCount = 2
    draft.microcycles = draft.microcycles.slice(0, 2)

    const workouts: PlanningWorkout[] = [
      {
        id: "w-1",
        title: "Back Squat",
        start: "2026-02-18T09:00:00.000Z",
        end: "2026-02-18T10:00:00.000Z"
      },
      {
        id: "w-2",
        title: "Seated Cable Row",
        start: "2026-02-26T09:00:00.000Z",
        end: "2026-02-26T10:00:00.000Z"
      }
    ]

    const summaries = buildMicrocycleMuscleSummaries(draft, workouts)

    expect(summaries).toHaveLength(2)
    expect(summaries[0].microcycleId).toBe("mc-01")
    expect(summaries[0].workouts).toEqual([
      expect.objectContaining({
        workoutId: "w-1",
        title: "Back Squat",
        exerciseNames: ["Back Squat"]
      })
    ])
    expect(summaries[0].totals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ muscle: "quadriceps" })
      ])
    )

    expect(summaries[1].microcycleId).toBe("mc-02")
    expect(summaries[1].workouts).toEqual([
      expect.objectContaining({
        workoutId: "w-2",
        title: "Seated Cable Row",
        exerciseNames: ["Seated Cable Row"]
      })
    ])
    expect(summaries[1].totals).toEqual(
      expect.arrayContaining([expect.objectContaining({ muscle: "lats" })])
    )
  })

  it("keeps unmatched workouts in drill-down and excludes workouts outside the cycle window", () => {
    const draft = buildInitialCycleDraft()
    draft.macroStartDate = "2026-02-18"
    draft.microcycleCount = 1
    draft.microcycles = draft.microcycles.slice(0, 1)

    const workouts: PlanningWorkout[] = [
      {
        id: "w-before",
        title: "Back Squat",
        start: "2026-02-17T09:00:00.000Z",
        end: "2026-02-17T10:00:00.000Z"
      },
      {
        id: "w-unknown",
        title: "Tempo Run",
        start: "2026-02-19T07:00:00.000Z",
        end: "2026-02-19T08:00:00.000Z"
      }
    ]

    const [summary] = buildMicrocycleMuscleSummaries(draft, workouts)

    expect(summary.workouts).toEqual([
      expect.objectContaining({
        workoutId: "w-unknown",
        title: "Tempo Run",
        exerciseNames: []
      })
    ])
    expect(summary.totals).toEqual([])
  })

  it("flags high-overlap microcycles visually when one mapped body area dominates", () => {
    const draft = buildInitialCycleDraft()
    draft.macroStartDate = "2026-02-17"
    draft.microcycleCount = 1
    draft.microcycles = draft.microcycles.slice(0, 1)

    const workouts: PlanningWorkout[] = [
      {
        id: "w-1",
        title: "Seated Cable Row",
        start: "2026-02-18T09:00:00.000Z",
        end: "2026-02-18T10:00:00.000Z"
      }
    ]

    const [summary] = buildMicrocycleMuscleSummaries(draft, workouts)

    expect(summary.hasHighOverlap).toBe(true)
    expect(summary.highOverlapBodyPart).toBe("upper-back")
  })
})
