import type { Exercise } from "@/features/exercises/types"

export const EXERCISE_CATALOG: Exercise[] = [
  {
    id: "ex-1",
    canonicalName: "Back Squat",
    aliases: ["BB Back Squat"],
    equipment: ["barbell", "rack"],
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["adductors", "core"]
  },
  {
    id: "ex-2",
    canonicalName: "Bulgarian Split Squat",
    aliases: ["RFESS"],
    equipment: ["dumbbell", "bench"],
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["adductors"]
  },
  {
    id: "ex-3",
    canonicalName: "Seated Cable Row",
    aliases: ["Cable Row"],
    equipment: ["cable"],
    primaryMuscles: ["lats", "rhomboids"],
    secondaryMuscles: ["biceps"]
  }
]

export type ExerciseSearchFilters = {
  query: string
  equipment: string[]
  muscles: string[]
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function searchExerciseCatalog(
  filters: ExerciseSearchFilters
): Exercise[] {
  const query = normalize(filters.query)
  const equipment = filters.equipment.map(normalize).filter(Boolean)
  const muscles = filters.muscles.map(normalize).filter(Boolean)

  return EXERCISE_CATALOG.filter((exercise) => {
    const nameMatch =
      query.length === 0 ||
      normalize(exercise.canonicalName).includes(query) ||
      exercise.aliases.some((alias) => normalize(alias).includes(query))

    const equipmentMatch =
      equipment.length === 0 ||
      equipment.every((filterValue) =>
        exercise.equipment.map(normalize).includes(filterValue)
      )

    const musclePool = [
      ...exercise.primaryMuscles,
      ...exercise.secondaryMuscles
    ].map(normalize)
    const muscleMatch =
      muscles.length === 0 ||
      muscles.every((filterValue) => musclePool.includes(filterValue))

    return nameMatch && equipmentMatch && muscleMatch
  }).sort((a, b) => a.canonicalName.localeCompare(b.canonicalName))
}
