import type { Exercise } from "@/features/exercises/types"
import type {
  ExerciseMuscleUsagePayload,
  MicrocycleMuscleUsagePayload,
  MuscleContribution,
  RoutineMuscleUsagePayload
} from "@/features/muscle-map/types"

const DEFAULT_PRIMARY_WEIGHT = 1
const DEFAULT_SECONDARY_WEIGHT = 0.5

function orderContributions(
  scores: Record<string, number>
): MuscleContribution[] {
  return Object.entries(scores)
    .map(([muscle, score]) => ({
      muscle,
      score: Math.round(score * 1_000_000) / 1_000_000
    }))
    .sort((left, right) => {
      if (right.score === left.score) {
        return left.muscle.localeCompare(right.muscle)
      }
      return right.score - left.score
    })
}

function mergeContributions(
  target: Record<string, number>,
  contributions: MuscleContribution[]
): void {
  for (const contribution of contributions) {
    target[contribution.muscle] =
      (target[contribution.muscle] ?? 0) + contribution.score
  }
}

function buildExerciseContributionPayload(
  exercise: Exercise,
  primaryWeight = DEFAULT_PRIMARY_WEIGHT,
  secondaryWeight = DEFAULT_SECONDARY_WEIGHT
): ExerciseMuscleUsagePayload {
  const roleWeights: Record<string, number> = {}

  for (const muscle of exercise.primaryMuscles) {
    roleWeights[muscle] = Math.max(roleWeights[muscle] ?? 0, primaryWeight)
  }

  for (const muscle of exercise.secondaryMuscles) {
    roleWeights[muscle] = Math.max(roleWeights[muscle] ?? 0, secondaryWeight)
  }

  return {
    exercise_id: exercise.id,
    exercise_name: exercise.canonicalName,
    contributions: orderContributions(roleWeights)
  }
}

export function buildRoutineMuscleUsagePayload(
  routineId: string,
  exercises: Exercise[]
): RoutineMuscleUsagePayload {
  const exercisePayloads = exercises.map((exercise) =>
    buildExerciseContributionPayload(exercise)
  )

  const totalScores: Record<string, number> = {}
  for (const exercisePayload of exercisePayloads) {
    mergeContributions(totalScores, exercisePayload.contributions)
  }

  return {
    routine_id: routineId,
    totals: orderContributions(totalScores),
    exercises: exercisePayloads
  }
}

export function buildMicrocycleMuscleUsagePayload(
  microcycleId: string,
  routines: RoutineMuscleUsagePayload[]
): MicrocycleMuscleUsagePayload {
  const totalScores: Record<string, number> = {}

  for (const routine of routines) {
    mergeContributions(totalScores, routine.totals)
  }

  return {
    microcycle_id: microcycleId,
    totals: orderContributions(totalScores),
    routines
  }
}
