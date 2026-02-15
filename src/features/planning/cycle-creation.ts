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
  code: "event_proximity" | "microcycle_overload"
  severity: "low" | "medium"
  message: string
  alternatives: string[]
}

const EVENT_PROXIMITY_DAYS = 7

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

export function buildCycleWarnings(draft: CycleDraft): CycleWarning[] {
  const warnings: CycleWarning[] = []
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
