export type MuscleContribution = {
  muscle: string
  score: number
}

export type ExerciseMuscleUsagePayload = {
  exercise_id: string
  exercise_name: string
  contributions: MuscleContribution[]
}

export type RoutineMuscleUsagePayload = {
  routine_id: string
  totals: MuscleContribution[]
  exercises: ExerciseMuscleUsagePayload[]
}

export type MicrocycleMuscleUsagePayload = {
  microcycle_id: string
  totals: MuscleContribution[]
  routines: RoutineMuscleUsagePayload[]
}
