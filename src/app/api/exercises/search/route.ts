import { NextResponse } from "next/server"

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const items = searchExerciseCatalog({
    query: searchParams.get("query") ?? "",
    equipment: splitCsv(searchParams.get("equipment")),
    muscles: splitCsv(searchParams.get("muscles"))
  })

  return NextResponse.json<ExerciseSearchResponse>({ items })
}
