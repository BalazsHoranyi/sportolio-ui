import type { ExerciseSearchResponse } from "@/features/exercises/types"

export type SearchExercisesParams = {
  query: string
  equipment: string[]
  muscles: string[]
}

function sortAndJoin(values: string[]): string {
  return [...values].sort().join(",")
}

export async function searchExercises(
  params: SearchExercisesParams
): Promise<ExerciseSearchResponse> {
  const searchParams = new URLSearchParams()

  if (params.query.trim().length > 0) {
    searchParams.set("query", params.query.trim())
  }
  if (params.equipment.length > 0) {
    searchParams.set("equipment", sortAndJoin(params.equipment))
  }
  if (params.muscles.length > 0) {
    searchParams.set("muscles", sortAndJoin(params.muscles))
  }

  const requestUrl =
    searchParams.toString().length > 0
      ? `/api/exercises/search?${searchParams.toString()}`
      : "/api/exercises/search"

  const response = await fetch(requestUrl)

  if (!response.ok) {
    throw new Error("Failed to search exercises")
  }

  return (await response.json()) as ExerciseSearchResponse
}
