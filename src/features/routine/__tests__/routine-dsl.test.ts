import {
  buildInitialRoutineDraft,
  parseRoutineDsl,
  serializeRoutineDraft
} from "@/features/routine/routine-dsl"

describe("routine-dsl", () => {
  it("serializes and parses a valid routine draft", () => {
    const initial = buildInitialRoutineDraft()

    const parsed = parseRoutineDsl(serializeRoutineDraft(initial))

    expect(parsed).toEqual({ ok: true, draft: initial })
  })

  it("returns actionable JSON syntax feedback", () => {
    const result = parseRoutineDsl("{ invalid")

    expect(result.ok).toBe(false)
    if (result.ok) {
      throw new Error("Expected parse failure")
    }

    expect(result.error).toContain("Fix JSON syntax")
  })

  it("requires a valid path value", () => {
    const result = parseRoutineDsl(
      JSON.stringify(
        {
          name: "Bad",
          path: "mixed",
          strength: { exerciseIds: [] },
          endurance: {
            intervals: [
              {
                id: "int-1",
                label: "steady",
                durationSeconds: 300,
                targetType: "power",
                targetValue: 250
              }
            ]
          }
        },
        null,
        2
      )
    )

    expect(result).toEqual({
      ok: false,
      error: "Set `path` to either `strength` or `endurance`."
    })
  })

  it("deduplicates strength exercise ids while preserving order", () => {
    const result = parseRoutineDsl(
      JSON.stringify(
        {
          name: "Strength Day",
          path: "strength",
          strength: {
            exerciseIds: ["ex-1", "ex-2", "ex-1", "ex-3"]
          },
          endurance: {
            intervals: [
              {
                id: "int-1",
                label: "steady",
                durationSeconds: 300,
                targetType: "power",
                targetValue: 250
              }
            ]
          }
        },
        null,
        2
      )
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error("Expected parse success")
    }

    expect(result.draft.strength.exerciseIds).toEqual(["ex-1", "ex-2", "ex-3"])
  })

  it("rejects empty endurance intervals", () => {
    const result = parseRoutineDsl(
      JSON.stringify(
        {
          name: "Endurance Day",
          path: "endurance",
          strength: { exerciseIds: [] },
          endurance: { intervals: [] }
        },
        null,
        2
      )
    )

    expect(result).toEqual({
      ok: false,
      error: "Add at least one endurance interval."
    })
  })
})
