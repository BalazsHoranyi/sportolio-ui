import { useEffect, useMemo, useState } from "react"

import type { Exercise } from "@/features/exercises/types"
import {
  searchExercises,
  type SearchExercisesParams
} from "@/features/exercises/api/search-exercises"

type UseExerciseSearchState = {
  items: Exercise[]
  isLoading: boolean
  errorMessage: string | null
}

const initialState: UseExerciseSearchState = {
  items: [],
  isLoading: true,
  errorMessage: null
}

export function useExerciseSearch(
  params: SearchExercisesParams
): UseExerciseSearchState {
  const [state, setState] = useState<UseExerciseSearchState>(initialState)

  const stableParams = useMemo(
    () => ({
      query: params.query,
      equipment: [...params.equipment].sort(),
      muscles: [...params.muscles].sort()
    }),
    [params.query, params.equipment, params.muscles]
  )

  useEffect(() => {
    let isStale = false

    setState((current) => ({ ...current, isLoading: true, errorMessage: null }))

    searchExercises(stableParams)
      .then((response) => {
        if (isStale) {
          return
        }
        setState({
          items: response.items,
          isLoading: false,
          errorMessage: null
        })
      })
      .catch((error: unknown) => {
        if (isStale) {
          return
        }
        setState({
          items: [],
          isLoading: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown search error"
        })
      })

    return () => {
      isStale = true
    }
  }, [stableParams])

  return state
}
