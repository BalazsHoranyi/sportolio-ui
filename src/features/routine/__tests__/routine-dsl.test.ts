import {
  buildInitialRoutineDraft,
  parseRoutineDsl,
  serializeRoutineDraft
} from "@/features/routine/routine-dsl"
import type { RoutineDraft } from "@/features/routine/types"

const ROUND_TRIP_FIXTURES: ReadonlyArray<{
  name: string
  draft: RoutineDraft
}> = [
  {
    name: "strength-path-with-multiple-exercises",
    draft: {
      name: "Strength Builder",
      path: "strength",
      strength: { exerciseIds: ["ex-3", "ex-2", "ex-1"] },
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
    }
  },
  {
    name: "endurance-path-with-nested-blocks-and-templates",
    draft: {
      name: "Endurance Builder",
      path: "endurance",
      strength: { exerciseIds: ["ex-1"] },
      endurance: {
        timeline: [
          {
            kind: "block",
            id: "blk-1",
            label: "Main Set",
            repeats: 2,
            children: [
              {
                kind: "interval",
                id: "int-1",
                label: "Threshold",
                durationSeconds: 420,
                targetType: "hr",
                targetValue: 168
              }
            ]
          }
        ],
        reusableBlocks: [
          {
            id: "tpl-1",
            name: "Main Set Template",
            block: {
              kind: "block",
              id: "blk-template-1",
              label: "Template Block",
              repeats: 2,
              children: [
                {
                  kind: "interval",
                  id: "int-template-1",
                  label: "Tempo",
                  durationSeconds: 360,
                  targetType: "pace",
                  targetValue: 405
                }
              ]
            }
          }
        ]
      }
    }
  }
]

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

  it("parses nested endurance timeline blocks and reusable templates", () => {
    const result = parseRoutineDsl(
      JSON.stringify(
        {
          name: "Nested Builder",
          path: "endurance",
          strength: { exerciseIds: [] },
          endurance: {
            timeline: [
              {
                kind: "interval",
                id: "int-1",
                label: "Warmup",
                durationSeconds: 600,
                targetType: "pace",
                targetValue: 420
              },
              {
                kind: "block",
                id: "blk-1",
                label: "Threshold Set",
                repeats: 2,
                children: [
                  {
                    kind: "interval",
                    id: "int-2",
                    label: "Threshold",
                    durationSeconds: 300,
                    targetType: "power",
                    targetValue: 320
                  }
                ]
              }
            ],
            reusableBlocks: [
              {
                id: "tpl-1",
                name: "Reusable Threshold Set",
                block: {
                  kind: "block",
                  id: "blk-template",
                  label: "Template",
                  repeats: 2,
                  children: [
                    {
                      kind: "interval",
                      id: "int-template",
                      label: "Template Interval",
                      durationSeconds: 240,
                      targetType: "cadence",
                      targetValue: 90
                    }
                  ]
                }
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

    expect(result.draft.endurance.timeline).toHaveLength(2)
    expect(result.draft.endurance.timeline[1]).toMatchObject({
      kind: "block",
      label: "Threshold Set",
      repeats: 2
    })
    expect(result.draft.endurance.reusableBlocks).toHaveLength(1)
    expect(result.draft.endurance.reusableBlocks[0].block.kind).toBe("block")
  })

  it("normalizes legacy endurance intervals payloads into timeline intervals", () => {
    const result = parseRoutineDsl(
      JSON.stringify(
        {
          name: "Legacy Endurance Day",
          path: "endurance",
          strength: { exerciseIds: [] },
          endurance: {
            intervals: [
              {
                id: "int-legacy-1",
                label: "Tempo",
                durationSeconds: 450,
                targetType: "hr",
                targetValue: 165
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

    expect(result.draft.endurance.timeline).toEqual([
      {
        kind: "interval",
        id: "int-legacy-1",
        label: "Tempo",
        durationSeconds: 450,
        targetType: "hr",
        targetValue: 165
      }
    ])
    expect(result.draft.endurance.reusableBlocks).toEqual([])
  })

  it.each(ROUND_TRIP_FIXTURES)(
    "preserves no-loss round-trip invariants for fixture: $name",
    ({ draft }) => {
      const firstPass = parseRoutineDsl(serializeRoutineDraft(draft))

      expect(firstPass.ok).toBe(true)
      if (!firstPass.ok) {
        throw new Error("Expected initial parse success")
      }

      const serialized = serializeRoutineDraft(firstPass.draft)
      const secondPass = parseRoutineDsl(serialized)

      expect(secondPass).toEqual({
        ok: true,
        draft: firstPass.draft
      })

      if (!secondPass.ok) {
        throw new Error("Expected second parse success")
      }

      expect(serializeRoutineDraft(secondPass.draft)).toBe(serialized)
    }
  )
})
