export type RoutinePath = "strength" | "endurance"
export type RoutineMode = "visual" | "dsl"
export type EnduranceTargetType = "power" | "pace" | "hr" | "cadence"
export type StrengthProgressionStrategy =
  | "none"
  | "linear"
  | "double-progression"
  | "wave"
  | "custom"

export type StrengthProgressionRule = {
  strategy: StrengthProgressionStrategy
  value: string
}

export type StrengthSetDraft = {
  id: string
  reps: number
  load: string
  restSeconds: number
  timerSeconds: number | null
  progression: StrengthProgressionRule
  condition: string
}

export type StrengthExerciseEntryDraft = {
  id: string
  exerciseId: string
  condition: string
  sets: StrengthSetDraft[]
}

export type StrengthBlockDraft = {
  id: string
  name: string
  repeatCount: number
  condition: string
  exercises: StrengthExerciseEntryDraft[]
}

export type StrengthVariableDraft = {
  id: string
  name: string
  defaultValue: string
}

export type EnduranceIntervalNode = {
  kind: "interval"
  id: string
  label: string
  durationSeconds: number
  targetType: EnduranceTargetType
  targetValue: number
}

export type EnduranceBlockNode = {
  kind: "block"
  id: string
  label: string
  repeats: number
  children: EnduranceTimelineNode[]
}

export type EnduranceTimelineNode = EnduranceIntervalNode | EnduranceBlockNode

export type EnduranceReusableBlock = {
  id: string
  name: string
  block: EnduranceBlockNode
}

export type RoutineDraft = {
  name: string
  path: RoutinePath
  strength: {
    exerciseIds: string[]
    variables: StrengthVariableDraft[]
    blocks: StrengthBlockDraft[]
  }
  endurance: {
    timeline: EnduranceTimelineNode[]
    reusableBlocks: EnduranceReusableBlock[]
  }
}
