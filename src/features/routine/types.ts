export type RoutinePath = "strength" | "endurance"
export type RoutineMode = "visual" | "dsl"
export type EnduranceTargetType = "power" | "pace" | "hr"

export type EnduranceInterval = {
  id: string
  label: string
  durationSeconds: number
  targetType: EnduranceTargetType
  targetValue: number
}

export type RoutineDraft = {
  name: string
  path: RoutinePath
  strength: {
    exerciseIds: string[]
  }
  endurance: {
    intervals: EnduranceInterval[]
  }
}
