import { mapMuscleContributionsToBodyData } from "@/features/muscle-map/map-muscle-usage"

describe("mapMuscleContributionsToBodyData", () => {
  it("maps known muscle tags to highlighter slugs with deterministic intensity", () => {
    const result = mapMuscleContributionsToBodyData([
      { muscle: "quadriceps", score: 2 },
      { muscle: "glutes", score: 1 },
      { muscle: "erector_spinae", score: 0.5 },
      { muscle: "anterior_deltoids", score: 1 },
      { muscle: "unknown_tag", score: 10 }
    ])

    expect(result).toEqual([
      { slug: "quadriceps", intensity: 5 },
      { slug: "deltoids", intensity: 3 },
      { slug: "gluteal", intensity: 3 },
      { slug: "lower-back", intensity: 2 }
    ])
  })

  it("aggregates multiple source muscles that map to the same body part", () => {
    const result = mapMuscleContributionsToBodyData([
      { muscle: "lats", score: 1.2 },
      { muscle: "rhomboids", score: 0.8 },
      { muscle: "mid_traps", score: 0.5 }
    ])

    expect(result).toEqual([
      { slug: "upper-back", intensity: 5 },
      { slug: "trapezius", intensity: 2 }
    ])
  })

  it("returns empty highlights when no mapped muscles are present", () => {
    const result = mapMuscleContributionsToBodyData([
      { muscle: "unknown_1", score: 1 },
      { muscle: "unknown_2", score: 2 }
    ])

    expect(result).toEqual([])
  })
})
