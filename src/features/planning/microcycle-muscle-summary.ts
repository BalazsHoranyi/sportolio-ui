import { EXERCISE_CATALOG } from "@/features/exercises/catalog"
import type { Exercise } from "@/features/exercises/types"
import { aggregateMuscleContributions } from "@/features/muscle-map/map-muscle-usage"
import {
  buildMicrocycleMuscleUsagePayload,
  buildRoutineMuscleUsagePayload
} from "@/features/muscle-map/payload-preview"
import type { MuscleContribution } from "@/features/muscle-map/types"
import type {
  CycleDraft,
  CycleMicrocycleDraft
} from "@/features/planning/cycle-creation"
import type { PlanningWorkout } from "@/features/planning/planning-operations"

const MICRO_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const HIGH_OVERLAP_THRESHOLD = 0.55

export type MicrocycleWorkoutDrilldown = {
  workoutId: string
  title: string
  start: string
  end: string
  exerciseNames: string[]
}

export type MicrocycleMuscleSummary = {
  microcycleId: string
  label: string
  totals: MuscleContribution[]
  workouts: MicrocycleWorkoutDrilldown[]
  hasHighOverlap: boolean
  highOverlapBodyPart: string | null
}

type MicrocycleBucket = {
  draft: CycleMicrocycleDraft
  workouts: MicrocycleWorkoutDrilldown[]
  routineSummaries: ReturnType<typeof buildRoutineMuscleUsagePayload>[]
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function resolveExercisesForWorkoutTitle(title: string): Exercise[] {
  const normalizedTitle = normalize(title)
  if (!normalizedTitle) {
    return []
  }

  return EXERCISE_CATALOG.filter((exercise) => {
    const nameMatch = normalize(exercise.canonicalName)
    if (normalizedTitle.includes(nameMatch)) {
      return true
    }

    return exercise.aliases.some((alias) =>
      normalizedTitle.includes(normalize(alias))
    )
  }).sort((left, right) =>
    left.canonicalName.localeCompare(right.canonicalName)
  )
}

function resolveMicrocycleIndex(
  workout: PlanningWorkout,
  macroStartDate: string,
  microcycleCount: number
): number | null {
  if (!isValidDate(workout.start)) {
    return null
  }

  const msDelta =
    new Date(workout.start).getTime() - new Date(macroStartDate).getTime()
  if (msDelta < 0) {
    return null
  }

  const dayDelta = Math.floor(msDelta / DAY_MS)
  const microcycleIndex = Math.floor(dayDelta / MICRO_DAYS)

  if (microcycleIndex < 0 || microcycleIndex >= microcycleCount) {
    return null
  }

  return microcycleIndex
}

function orderDrilldownWorkouts(
  workouts: MicrocycleWorkoutDrilldown[]
): MicrocycleWorkoutDrilldown[] {
  return [...workouts].sort((left, right) => {
    const delta =
      new Date(left.start).getTime() - new Date(right.start).getTime()
    if (delta !== 0) {
      return delta
    }
    return left.workoutId.localeCompare(right.workoutId)
  })
}

export function buildMicrocycleMuscleSummaries(
  draft: CycleDraft,
  workouts: PlanningWorkout[]
): MicrocycleMuscleSummary[] {
  const activeMicrocycles = draft.microcycles.slice(0, draft.microcycleCount)
  const buckets: MicrocycleBucket[] = activeMicrocycles.map((microcycle) => ({
    draft: microcycle,
    workouts: [],
    routineSummaries: []
  }))

  if (!isValidDate(draft.macroStartDate)) {
    return buckets.map((bucket) => ({
      microcycleId: bucket.draft.id,
      label: bucket.draft.label,
      totals: [],
      workouts: [],
      hasHighOverlap: false,
      highOverlapBodyPart: null
    }))
  }

  for (const workout of workouts) {
    const microcycleIndex = resolveMicrocycleIndex(
      workout,
      draft.macroStartDate,
      activeMicrocycles.length
    )
    if (microcycleIndex === null) {
      continue
    }

    const matchedExercises = resolveExercisesForWorkoutTitle(workout.title)
    const routineSummary = buildRoutineMuscleUsagePayload(
      workout.id,
      matchedExercises
    )

    const bucket = buckets[microcycleIndex]
    bucket.routineSummaries.push(routineSummary)
    bucket.workouts.push({
      workoutId: workout.id,
      title: workout.title,
      start: workout.start,
      end: workout.end,
      exerciseNames: matchedExercises.map((exercise) => exercise.canonicalName)
    })
  }

  return buckets.map((bucket) => {
    const microcycleSummary = buildMicrocycleMuscleUsagePayload(
      bucket.draft.id,
      bucket.routineSummaries
    )

    const bodyPartTotals = aggregateMuscleContributions(
      microcycleSummary.totals
    )
    const totalScore = bodyPartTotals.reduce((sum, item) => sum + item.score, 0)
    const dominant = bodyPartTotals[0]
    const dominantRatio =
      totalScore > 0 && dominant ? dominant.score / totalScore : 0

    return {
      microcycleId: bucket.draft.id,
      label: bucket.draft.label,
      totals: microcycleSummary.totals,
      workouts: orderDrilldownWorkouts(bucket.workouts),
      hasHighOverlap: dominantRatio >= HIGH_OVERLAP_THRESHOLD,
      highOverlapBodyPart:
        dominantRatio >= HIGH_OVERLAP_THRESHOLD ? dominant.slug : null
    }
  })
}
