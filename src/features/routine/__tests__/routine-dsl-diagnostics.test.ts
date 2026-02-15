import { analyzeRoutineDsl } from "@/features/routine/routine-dsl-diagnostics"

describe("routine-dsl-diagnostics", () => {
  it("marks JSON and structure parse failures as blocking", () => {
    const result = analyzeRoutineDsl("{ invalid")

    expect(result.canApply).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.code).toBe("dsl-structure-invalid")
    expect(result.warnings).toHaveLength(0)
  })

  it("reports invalid progression values as warnings without blocking", () => {
    const result = analyzeRoutineDsl(
      JSON.stringify(
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
    )

    expect(result.canApply).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "progression-missing-value"
    )
  })

  it("flags unsafe repetition and interval duration ranges as warnings", () => {
    const result = analyzeRoutineDsl(
      JSON.stringify(
        {
          name: "Unsafe Builder",
          path: "endurance",
          strength: {
            exerciseIds: ["ex-1"],
            variables: [],
            blocks: [
              {
                id: "block-1",
                name: "Primary block",
                repeatCount: 14,
                condition: "",
                exercises: [
                  {
                    id: "entry-1",
                    exerciseId: "ex-1",
                    condition: "",
                    sets: [
                      {
                        id: "set-1",
                        reps: 35,
                        load: "100kg",
                        restSeconds: 950,
                        timerSeconds: null,
                        progression: {
                          strategy: "none",
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
                label: "Ultra Set",
                durationSeconds: 7500,
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
    )

    expect(result.canApply).toBe(true)
    expect(result.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "strength-block-high-repeat-count",
        "set-high-rep-range",
        "set-long-rest-window",
        "interval-long-duration"
      ])
    )
  })
})
