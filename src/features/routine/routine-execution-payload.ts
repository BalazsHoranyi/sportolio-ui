import { EXERCISE_CATALOG } from "@/features/exercises/catalog"
import type {
  RoutineDraft,
  RoutineTemplateSource
} from "@/features/routine/types"

const EXECUTION_PAYLOAD_SCHEMA_VERSION = "1.0"

type ExecutionTemplateSourcePayload = {
  template_id: string
  template_name: string
  context: RoutineTemplateSource["context"]
  owner_role: RoutineTemplateSource["ownerRole"]
  owner_id: string
  instantiated_at: string
}

export type TrackingStrengthSetPayload = {
  sequence: number
  block_id: string
  block_name: string
  block_repeat_index: number
  block_condition: string | null
  exercise_id: string
  exercise_name: string
  exercise_condition: string | null
  set_id: string
  reps: number
  load: string
  rest_seconds: number
  timer_seconds: number | null
  progression: string | null
  condition: string | null
}

export type TrackingEnduranceIntervalPayload = {
  sequence: number
  interval_id: string
  label: string
  duration_seconds: number
  target_type: "power" | "pace" | "hr" | "cadence"
  target_value: number
  block_path: string[]
}

export type RoutineExecutionPayload = {
  schema_version: "1.0"
  routine_name: string
  path: RoutineDraft["path"]
  template_source?: ExecutionTemplateSourcePayload
  strength_sets: TrackingStrengthSetPayload[]
  endurance_intervals: TrackingEnduranceIntervalPayload[]
}

function toOptionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatProgression(strategy: string, value: string): string | null {
  if (strategy === "none") {
    return null
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return strategy
  }

  return `${strategy}(${trimmed})`
}

function toTemplateSourcePayload(
  templateSource: RoutineTemplateSource | undefined
): ExecutionTemplateSourcePayload | undefined {
  if (!templateSource) {
    return undefined
  }

  return {
    template_id: templateSource.templateId,
    template_name: templateSource.templateName,
    context: templateSource.context,
    owner_role: templateSource.ownerRole,
    owner_id: templateSource.ownerId,
    instantiated_at: templateSource.instantiatedAt
  }
}

function buildExerciseNameLookup(): Map<string, string> {
  return new Map(
    EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise.canonicalName])
  )
}

function buildStrengthSetPayloads(
  draft: RoutineDraft
): TrackingStrengthSetPayload[] {
  const exerciseNames = buildExerciseNameLookup()
  const payloads: Omit<TrackingStrengthSetPayload, "sequence">[] = []

  for (const block of draft.strength.blocks) {
    for (
      let repeatIndex = 1;
      repeatIndex <= block.repeatCount;
      repeatIndex += 1
    ) {
      for (const exercise of block.exercises) {
        const exerciseName =
          exerciseNames.get(exercise.exerciseId) ?? exercise.exerciseId

        for (const set of exercise.sets) {
          payloads.push({
            block_id: block.id,
            block_name: block.name,
            block_repeat_index: repeatIndex,
            block_condition: toOptionalText(block.condition),
            exercise_id: exercise.exerciseId,
            exercise_name: exerciseName,
            exercise_condition: toOptionalText(exercise.condition),
            set_id: set.id,
            reps: set.reps,
            load: set.load,
            rest_seconds: set.restSeconds,
            timer_seconds: set.timerSeconds,
            progression: formatProgression(
              set.progression.strategy,
              set.progression.value
            ),
            condition: toOptionalText(set.condition)
          })
        }
      }
    }
  }

  return payloads.map((payload, index) => ({
    sequence: index + 1,
    ...payload
  }))
}

type FlattenedInterval = Omit<TrackingEnduranceIntervalPayload, "sequence">

function flattenTimelineIntervals(
  nodes: RoutineDraft["endurance"]["timeline"],
  blockPath: string[] = []
): FlattenedInterval[] {
  const flattened: FlattenedInterval[] = []

  for (const node of nodes) {
    if (node.kind === "interval") {
      flattened.push({
        interval_id: node.id,
        label: node.label,
        duration_seconds: node.durationSeconds,
        target_type: node.targetType,
        target_value: node.targetValue,
        block_path: [...blockPath]
      })
      continue
    }

    for (let repeatIndex = 1; repeatIndex <= node.repeats; repeatIndex += 1) {
      flattened.push(
        ...flattenTimelineIntervals(node.children, [
          ...blockPath,
          `${node.id}#${repeatIndex}`
        ])
      )
    }
  }

  return flattened
}

function buildEnduranceIntervalPayloads(
  draft: RoutineDraft
): TrackingEnduranceIntervalPayload[] {
  return flattenTimelineIntervals(draft.endurance.timeline).map(
    (interval, index) => ({
      sequence: index + 1,
      ...interval
    })
  )
}

export function buildRoutineExecutionPayload(
  draft: RoutineDraft
): RoutineExecutionPayload {
  return {
    schema_version: EXECUTION_PAYLOAD_SCHEMA_VERSION,
    routine_name: draft.name,
    path: draft.path,
    template_source: toTemplateSourcePayload(draft.templateSource),
    strength_sets: buildStrengthSetPayloads(draft),
    endurance_intervals: buildEnduranceIntervalPayloads(draft)
  }
}
