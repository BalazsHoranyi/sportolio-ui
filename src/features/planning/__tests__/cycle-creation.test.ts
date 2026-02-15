import {
  buildCycleWarnings,
  buildInitialCycleDraft,
  setMicrocycleCount,
  validateGoalStep,
  validateMesocycleStep
} from "@/features/planning/cycle-creation"

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
