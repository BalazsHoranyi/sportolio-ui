export type Exercise = {
  id: string
  canonicalName: string
  aliases: string[]
  equipment: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
}

export type ExerciseSearchResponse = {
  items: Exercise[]
}
