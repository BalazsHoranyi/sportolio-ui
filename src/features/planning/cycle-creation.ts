import type { PlanningWorkout } from "@/features/planning/planning-operations"

export type GoalModality = "strength" | "endurance" | "cycling" | "triathlon"
export type MesocycleStrategy = "block" | "dup" | "linear"
export type MicrocycleFocus = GoalModality

export type CycleGoalDraft = {
  id: string
  title: string
  modality: GoalModality
  priority: number
  eventDate: string
}

export type CycleMicrocycleDraft = {
  id: string
  label: string
  focus: MicrocycleFocus
  keySessions: number
}

export type CycleMesocycleDraft = {
  strategy: MesocycleStrategy
  blockSize: number
  rotationOffset: number
  focusShare: number
  startShare: number
  endShare: number
}

export type CycleDraft = {
  macroStartDate: string
  goals: CycleGoalDraft[]
  activeGoalId: string | null
  mesocycle: CycleMesocycleDraft
  microcycleCount: number
  microcycles: CycleMicrocycleDraft[]
  proceedAnyway: boolean
}

export type CycleWarning = {
  code: "axis_overlap" | "event_proximity" | "microcycle_overload"
  severity: "low" | "medium" | "high"
  message: string
  alternatives: string[]
}

const EVENT_PROXIMITY_DAYS = 7
const HOUR_MS = 60 * 60 * 1000

const DEFAULT_MESOCYCLE: CycleMesocycleDraft = {
  strategy: "block",
  blockSize: 2,
  rotationOffset: 0,
  focusShare: 0.7,
  startShare: 0.45,
  endShare: 0.75
}

const DEFAULT_FOCUS_ORDER: MicrocycleFocus[] = [
  "strength",
  "endurance",
  "cycling",
  "triathlon"
]

function buildDefaultMicrocycle(index: number): CycleMicrocycleDraft {
  const focus = DEFAULT_FOCUS_ORDER[(index - 1) % DEFAULT_FOCUS_ORDER.length]
  return {
    id: `mc-${String(index).padStart(2, "0")}`,
    label: `Microcycle ${index}`,
    focus,
    keySessions: 2
  }
}

function isIsoDate(value: string): boolean {
  if (!value) {
    return false
  }

  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

export function buildInitialCycleDraft(): CycleDraft {
  return {
    macroStartDate: "",
    goals: [],
    activeGoalId: null,
    mesocycle: { ...DEFAULT_MESOCYCLE },
    microcycleCount: 4,
    microcycles: [1, 2, 3, 4].map((index) => buildDefaultMicrocycle(index)),
    proceedAnyway: false
  }
}

export function setMicrocycleCount(
  draft: CycleDraft,
  nextCount: number
): CycleDraft {
  const count = Math.max(1, Math.floor(nextCount))
  const existing = draft.microcycles.slice(0, count)
  const missingCount = Math.max(0, count - existing.length)
  const generated = Array.from({ length: missingCount }, (_, index) =>
    buildDefaultMicrocycle(existing.length + index + 1)
  )

  return {
    ...draft,
    microcycleCount: count,
    microcycles: [...existing, ...generated]
  }
}

export function moveMicrocycle(
  draft: CycleDraft,
  microcycleId: string,
  direction: "up" | "down"
): CycleDraft {
  const currentIndex = draft.microcycles.findIndex(
    (microcycle) => microcycle.id === microcycleId
  )
  if (currentIndex === -1) {
    return draft
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= draft.microcycles.length) {
    return draft
  }

  const reordered = [...draft.microcycles]
  const currentEntry = reordered[currentIndex]
  reordered[currentIndex] = reordered[targetIndex]
  reordered[targetIndex] = currentEntry

  return {
    ...draft,
    microcycles: reordered
  }
}

export function validateGoalStep(draft: CycleDraft): string[] {
  const errors: string[] = []
  if (!isIsoDate(draft.macroStartDate)) {
    errors.push("Macro cycle start date is required.")
  }

  if (draft.goals.length === 0) {
    errors.push("At least one goal is required.")
    return errors
  }

  const priorities = new Set<number>()
  for (const goal of draft.goals) {
    if (!goal.title.trim()) {
      errors.push(`Goal ${goal.id} requires a title.`)
    }
    if (goal.priority <= 0) {
      errors.push(`Goal ${goal.id} priority must be > 0.`)
    }
    if (priorities.has(goal.priority)) {
      errors.push("Goal priorities must be unique.")
    }
    priorities.add(goal.priority)

    if (!isIsoDate(goal.eventDate)) {
      errors.push(`Goal ${goal.id} requires an event date.`)
    }
  }

  if (draft.goals.length > 1 && !draft.activeGoalId) {
    errors.push("Select the active priority goal.")
  }
  if (
    draft.activeGoalId &&
    !draft.goals.some((goal) => goal.id === draft.activeGoalId)
  ) {
    errors.push("Selected active goal no longer exists.")
  }

  return errors
}

export function validateMesocycleStep(draft: CycleDraft): string[] {
  const errors: string[] = []
  const { mesocycle } = draft
  if (mesocycle.focusShare <= 0 || mesocycle.focusShare >= 1) {
    errors.push("Focus share must be between 0 and 1.")
  }

  if (mesocycle.strategy === "block" && mesocycle.blockSize < 1) {
    errors.push("Block strategy requires block size >= 1.")
  }

  if (mesocycle.strategy === "dup" && mesocycle.rotationOffset < 0) {
    errors.push("DUP strategy requires rotation offset >= 0.")
  }

  if (mesocycle.strategy === "linear") {
    if (mesocycle.startShare <= 0 || mesocycle.startShare >= 1) {
      errors.push("Linear strategy start share must be between 0 and 1.")
    }
    if (mesocycle.endShare <= 0 || mesocycle.endShare >= 1) {
      errors.push("Linear strategy end share must be between 0 and 1.")
    }
    if (mesocycle.endShare < mesocycle.startShare) {
      errors.push("Linear strategy end share must be >= start share.")
    }
  }

  return errors
}

export function validateMicrocycleStep(draft: CycleDraft): string[] {
  const errors: string[] = []
  if (draft.microcycleCount < 1) {
    errors.push("Microcycle count must be >= 1.")
  }
  if (draft.microcycles.length !== draft.microcycleCount) {
    errors.push("Microcycle details are out of sync with selected count.")
  }

  for (const microcycle of draft.microcycles) {
    if (!microcycle.label.trim()) {
      errors.push(`${microcycle.id} requires a label.`)
    }
    if (microcycle.keySessions < 0) {
      errors.push(`${microcycle.id} key sessions must be >= 0.`)
    }
  }

  return errors
}

function dayDifference(leftDate: string, rightDate: string): number {
  const left = new Date(leftDate)
  const right = new Date(rightDate)
  const ms = Math.abs(left.getTime() - right.getTime())
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

type AxisKey = "neural" | "metabolic" | "mechanical"

type InterferenceProfile = {
  modality: GoalModality | null
  axes: AxisKey[]
  recoveryHours: number
}

const PROFILE_BY_MODALITY: Record<GoalModality, InterferenceProfile> = {
  strength: {
    modality: "strength",
    axes: ["neural", "mechanical"],
    recoveryHours: 36
  },
  endurance: {
    modality: "endurance",
    axes: ["metabolic"],
    recoveryHours: 24
  },
  cycling: {
    modality: "cycling",
    axes: ["metabolic", "mechanical"],
    recoveryHours: 30
  },
  triathlon: {
    modality: "triathlon",
    axes: ["neural", "metabolic", "mechanical"],
    recoveryHours: 48
  }
}

function buildGoalPriorityMap(draft: CycleDraft): Map<GoalModality, number> {
  const priorityByModality = new Map<GoalModality, number>()

  for (const goal of draft.goals) {
    const existing = priorityByModality.get(goal.modality)
    if (existing === undefined || goal.priority < existing) {
      priorityByModality.set(goal.modality, goal.priority)
    }
  }

  return priorityByModality
}

function inferWorkoutProfile(workoutTitle: string): InterferenceProfile {
  const normalizedTitle = workoutTitle.trim().toLowerCase()
  if (!normalizedTitle) {
    return {
      modality: null,
      axes: [],
      recoveryHours: 0
    }
  }

  const strengthKeywords = [
    "squat",
    "deadlift",
    "bench",
    "press",
    "pull-up",
    "row",
    "olympic"
  ]
  if (strengthKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
    return PROFILE_BY_MODALITY.strength
  }

  const mixedKeywords = ["triathlon", "metcon", "crossfit", "hyrox", "brick"]
  if (mixedKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
    return PROFILE_BY_MODALITY.triathlon
  }

  const cyclingKeywords = ["bike", "ride", "cycle", "trainer", "zwift"]
  if (cyclingKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
    return PROFILE_BY_MODALITY.cycling
  }

  const enduranceKeywords = ["run", "tempo", "interval", "swim", "rower"]
  if (enduranceKeywords.some((keyword) => normalizedTitle.includes(keyword))) {
    return PROFILE_BY_MODALITY.endurance
  }

  return {
    modality: null,
    axes: [],
    recoveryHours: 0
  }
}

function resolveHoursApart(
  left: PlanningWorkout,
  right: PlanningWorkout
): number {
  const leftEnd = new Date(left.end).getTime()
  const rightStart = new Date(right.start).getTime()
  if (Number.isNaN(leftEnd) || Number.isNaN(rightStart)) {
    return Number.POSITIVE_INFINITY
  }

  const delta = rightStart - leftEnd
  return Math.max(0, Math.floor(delta / HOUR_MS))
}

function sharedAxes(
  leftProfile: InterferenceProfile,
  rightProfile: InterferenceProfile
): AxisKey[] {
  return leftProfile.axes.filter((axis) => rightProfile.axes.includes(axis))
}

function resolveMoveTargetTitle(
  draft: CycleDraft,
  leftWorkout: PlanningWorkout,
  leftProfile: InterferenceProfile,
  rightWorkout: PlanningWorkout,
  rightProfile: InterferenceProfile
): string {
  const priorityByModality = buildGoalPriorityMap(draft)
  const leftPriority =
    leftProfile.modality !== null
      ? (priorityByModality.get(leftProfile.modality) ??
        Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER
  const rightPriority =
    rightProfile.modality !== null
      ? (priorityByModality.get(rightProfile.modality) ??
        Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER

  if (leftPriority === rightPriority) {
    return rightWorkout.title
  }

  return leftPriority < rightPriority ? rightWorkout.title : leftWorkout.title
}

function buildAxisOverlapWarnings(
  draft: CycleDraft,
  plannedWorkouts: PlanningWorkout[]
): CycleWarning[] {
  if (plannedWorkouts.length < 2) {
    return []
  }

  const sortedWorkouts = [...plannedWorkouts].sort((left, right) =>
    left.start.localeCompare(right.start)
  )
  const warnings: CycleWarning[] = []

  for (let leftIndex = 0; leftIndex < sortedWorkouts.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < sortedWorkouts.length;
      rightIndex += 1
    ) {
      const leftWorkout = sortedWorkouts[leftIndex]
      const rightWorkout = sortedWorkouts[rightIndex]
      const leftProfile = inferWorkoutProfile(leftWorkout.title)
      const rightProfile = inferWorkoutProfile(rightWorkout.title)
      const overlap = sharedAxes(leftProfile, rightProfile)

      if (overlap.length === 0) {
        continue
      }

      const recoveryWindowHours = Math.max(
        leftProfile.recoveryHours,
        rightProfile.recoveryHours
      )
      const hoursApart = resolveHoursApart(leftWorkout, rightWorkout)
      if (hoursApart >= recoveryWindowHours) {
        continue
      }

      const moveTargetTitle = resolveMoveTargetTitle(
        draft,
        leftWorkout,
        leftProfile,
        rightWorkout,
        rightProfile
      )
      const minimumShiftHours = recoveryWindowHours - hoursApart
      const overlapLabel = overlap.join("/")

      warnings.push({
        code: "axis_overlap",
        severity: "high",
        message: `High-risk axis overlap between ${leftWorkout.title} and ${rightWorkout.title}: shared ${overlapLabel} load is inside the ${recoveryWindowHours}h recovery window.`,
        alternatives: [
          `Move ${moveTargetTitle} by at least ${minimumShiftHours}h to clear the recovery window.`,
          `Swap one session for lower ${overlapLabel} demand while keeping the schedule.`
        ]
      })
    }
  }

  return warnings
}

export function buildCycleWarnings(
  draft: CycleDraft,
  plannedWorkouts: PlanningWorkout[] = []
): CycleWarning[] {
  const warnings: CycleWarning[] = []
  warnings.push(...buildAxisOverlapWarnings(draft, plannedWorkouts))
  const datedGoals = draft.goals.filter((goal) => isIsoDate(goal.eventDate))

  for (let leftIndex = 0; leftIndex < datedGoals.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < datedGoals.length;
      rightIndex += 1
    ) {
      const left = datedGoals[leftIndex]
      const right = datedGoals[rightIndex]
      const daysApart = dayDifference(left.eventDate, right.eventDate)

      if (daysApart <= EVENT_PROXIMITY_DAYS) {
        warnings.push({
          code: "event_proximity",
          severity: "medium",
          message: "Event dates are close",
          alternatives: [
            "Shift the lower-priority event by 7+ days.",
            "Reduce intensity in the week before the secondary event."
          ]
        })
      }
    }
  }

  if (draft.microcycles.some((microcycle) => microcycle.keySessions >= 5)) {
    warnings.push({
      code: "microcycle_overload",
      severity: "low",
      message: "One or more microcycles may be overloaded",
      alternatives: [
        "Move one key session into the adjacent microcycle.",
        "Swap one key session for a lower-intensity session."
      ]
    })
  }

  return warnings.sort((left, right) =>
    `${left.code}:${left.message}`.localeCompare(
      `${right.code}:${right.message}`
    )
  )
}

export function serializeCycleDraft(draft: CycleDraft): string {
  return JSON.stringify(draft)
}

export function parseCycleDraft(value: string): CycleDraft | null {
  try {
    const parsed = JSON.parse(value) as Partial<CycleDraft>
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.macroStartDate !== "string" ||
      !Array.isArray(parsed.goals) ||
      typeof parsed.microcycleCount !== "number" ||
      !Array.isArray(parsed.microcycles) ||
      typeof parsed.proceedAnyway !== "boolean" ||
      typeof parsed.mesocycle !== "object" ||
      parsed.mesocycle === null
    ) {
      return null
    }

    const draft: CycleDraft = {
      macroStartDate: parsed.macroStartDate,
      goals: parsed.goals as CycleGoalDraft[],
      activeGoalId:
        typeof parsed.activeGoalId === "string" ? parsed.activeGoalId : null,
      mesocycle: parsed.mesocycle as CycleMesocycleDraft,
      microcycleCount: parsed.microcycleCount,
      microcycles: parsed.microcycles as CycleMicrocycleDraft[],
      proceedAnyway: parsed.proceedAnyway
    }
    return setMicrocycleCount(draft, draft.microcycleCount)
  } catch {
    return null
  }
}
