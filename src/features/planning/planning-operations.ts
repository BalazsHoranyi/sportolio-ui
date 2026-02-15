export type PlanningWorkout = {
  id: string
  title: string
  start: string
  end: string
}

export type PlanningBoundary = {
  start: string
  end: string
}

export type PlanningChangeReason = "added" | "moved" | "removed"
export type PlanningChangeSource = "controls" | "calendar"

export type PlanningChange = {
  reason: PlanningChangeReason
  workoutId: string
  source: PlanningChangeSource
  boundary: PlanningBoundary | null
}

export type PlanningOperationResult = {
  workouts: PlanningWorkout[]
  change: PlanningChange
}

function toTimestamp(isoDate: string): number {
  return new Date(isoDate).getTime()
}

function sortWorkouts(workouts: PlanningWorkout[]): PlanningWorkout[] {
  return [...workouts].sort((left, right) => {
    const delta = toTimestamp(left.start) - toTimestamp(right.start)
    if (delta !== 0) {
      return delta
    }
    return left.id.localeCompare(right.id)
  })
}

export function buildPlanningBoundary(
  workouts: PlanningWorkout[]
): PlanningBoundary | null {
  if (workouts.length === 0) {
    return null
  }

  const sorted = sortWorkouts(workouts)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  return {
    start: first.start,
    end: last.end
  }
}

export function addWorkout(
  workouts: PlanningWorkout[],
  workout: PlanningWorkout,
  source: PlanningChangeSource = "controls"
): PlanningOperationResult {
  const nextWorkouts = sortWorkouts([...workouts, workout])

  return {
    workouts: nextWorkouts,
    change: {
      reason: "added",
      workoutId: workout.id,
      source,
      boundary: buildPlanningBoundary(nextWorkouts)
    }
  }
}

export function moveWorkout(
  workouts: PlanningWorkout[],
  workoutId: string,
  timing: { start: string; end: string },
  source: PlanningChangeSource
): PlanningOperationResult {
  const workoutExists = workouts.some((workout) => workout.id === workoutId)
  if (!workoutExists) {
    throw new Error(`Cannot move missing workout id \`${workoutId}\`.`)
  }

  const nextWorkouts = sortWorkouts(
    workouts.map((workout) =>
      workout.id === workoutId
        ? { ...workout, start: timing.start, end: timing.end }
        : workout
    )
  )

  return {
    workouts: nextWorkouts,
    change: {
      reason: "moved",
      workoutId,
      source,
      boundary: buildPlanningBoundary(nextWorkouts)
    }
  }
}

export function removeWorkout(
  workouts: PlanningWorkout[],
  workoutId: string,
  source: PlanningChangeSource = "controls"
): PlanningOperationResult {
  const workoutExists = workouts.some((workout) => workout.id === workoutId)
  if (!workoutExists) {
    throw new Error(`Cannot remove missing workout id \`${workoutId}\`.`)
  }

  const nextWorkouts = sortWorkouts(
    workouts.filter((workout) => workout.id !== workoutId)
  )

  return {
    workouts: nextWorkouts,
    change: {
      reason: "removed",
      workoutId,
      source,
      boundary: buildPlanningBoundary(nextWorkouts)
    }
  }
}
