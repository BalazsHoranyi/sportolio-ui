import { http, HttpResponse } from "msw"

import { searchExerciseCatalog } from "@/features/exercises/catalog"
import type { ExerciseSearchResponse } from "@/features/exercises/types"

function splitCsv(value: string | null): string[] {
  if (!value) {
    return []
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export const handlers = [
  http.get("/api/exercises/search", ({ request }) => {
    const { searchParams } = new URL(request.url)

    const items = searchExerciseCatalog({
      query: searchParams.get("query") ?? "",
      equipment: splitCsv(searchParams.get("equipment")),
      muscles: splitCsv(searchParams.get("muscles"))
    })

    return HttpResponse.json<ExerciseSearchResponse>({ items })
  })
]
