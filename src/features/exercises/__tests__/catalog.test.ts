import { searchExerciseCatalog } from "@/features/exercises/catalog"

describe("searchExerciseCatalog", () => {
  it("matches query against canonical name and aliases", () => {
    expect(
      searchExerciseCatalog({ query: "split", equipment: [], muscles: [] })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonicalName: "Bulgarian Split Squat" })
      ])
    )

    expect(
      searchExerciseCatalog({ query: "RFESS", equipment: [], muscles: [] })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ canonicalName: "Bulgarian Split Squat" })
      ])
    )
  })

  it("filters by equipment and muscle intersection", () => {
    const items = searchExerciseCatalog({
      query: "",
      equipment: ["dumbbell"],
      muscles: ["quadriceps"]
    })

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "ex-2",
      canonicalName: "Bulgarian Split Squat"
    })
  })

  it("returns deterministic order by canonical name", () => {
    const names = searchExerciseCatalog({
      query: "",
      equipment: [],
      muscles: []
    }).map((exercise) => exercise.canonicalName)

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })
})
