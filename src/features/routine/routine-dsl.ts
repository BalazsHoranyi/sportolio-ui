import type {
  EnduranceIntervalNode,
  EnduranceReusableBlock,
  EnduranceTargetType,
  EnduranceTimelineNode,
  RoutineDraft,
  StrengthBlockDraft,
  StrengthExerciseEntryDraft,
  StrengthProgressionRule,
  StrengthProgressionStrategy,
  StrengthSetDraft,
  StrengthVariableDraft
} from "@/features/routine/types"

const ENDURANCE_TARGET_TYPES = new Set<EnduranceTargetType>([
  "power",
  "pace",
  "hr",
  "cadence"
])

const STRENGTH_PROGRESSION_STRATEGIES = new Set<StrengthProgressionStrategy>([
  "none",
  "linear",
  "double-progression",
  "wave",
  "custom"
])

function buildDefaultStrengthSet(setId: string): StrengthSetDraft {
  return {
    id: setId,
    reps: 5,
    load: "100kg",
    restSeconds: 120,
    timerSeconds: null,
    progression: {
      strategy: "none",
      value: ""
    },
    condition: ""
  }
}

function buildDefaultStrengthExercise(
  exerciseId: string,
  index: number
): StrengthExerciseEntryDraft {
  return {
    id: `entry-${index + 1}`,
    exerciseId,
    condition: "",
    sets: [buildDefaultStrengthSet(`set-${index + 1}-1`)]
  }
}

function buildDefaultStrengthBlocks(
  exerciseIds: string[]
): StrengthBlockDraft[] {
  return [
    {
      id: "block-1",
      name: "Primary block",
      repeatCount: 1,
      condition: "",
      exercises: exerciseIds.map((exerciseId, index) =>
        buildDefaultStrengthExercise(exerciseId, index)
      )
    }
  ]
}

export function buildInitialRoutineDraft(): RoutineDraft {
  return {
    name: "New Routine",
    path: "strength",
    strength: {
      exerciseIds: [],
      variables: [],
      blocks: buildDefaultStrengthBlocks([])
    },
    endurance: {
      timeline: [
        {
          kind: "interval",
          id: "int-1",
          label: "Steady State",
          durationSeconds: 300,
          targetType: "power",
          targetValue: 250
        }
      ],
      reusableBlocks: []
    }
  }
}

export function serializeRoutineDraft(draft: RoutineDraft): string {
  return JSON.stringify(draft, null, 2)
}

export type ParseRoutineDslResult =
  | { ok: true; draft: RoutineDraft }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`Set \`${fieldName}\` to a string value.`)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`Set \`${fieldName}\` to a non-empty string value.`)
  }

  return trimmed
}

function readOptionalString(value: unknown, fieldName: string): string {
  if (typeof value === "undefined" || value === null) {
    return ""
  }
  if (typeof value !== "string") {
    throw new Error(`Set \`${fieldName}\` to a string value.`)
  }
  return value.trim()
}

function readPositiveNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Set \`${fieldName}\` to a number value.`)
  }

  if (value <= 0) {
    throw new Error(`Set \`${fieldName}\` to a value greater than zero.`)
  }

  return value
}

function readPositiveInteger(value: unknown, fieldName: string): number {
  const parsed = readPositiveNumber(value, fieldName)
  if (!Number.isInteger(parsed)) {
    throw new Error(`Set \`${fieldName}\` to a whole number.`)
  }

  return parsed
}

function readNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Set \`${fieldName}\` to a number value.`)
  }

  if (!Number.isInteger(value)) {
    throw new Error(`Set \`${fieldName}\` to a whole number.`)
  }

  if (value < 0) {
    throw new Error(`Set \`${fieldName}\` to zero or greater.`)
  }

  return value
}

function readTargetType(
  value: unknown,
  fieldName: string
): EnduranceTargetType {
  const targetType = readString(value, fieldName) as EnduranceTargetType
  if (!ENDURANCE_TARGET_TYPES.has(targetType)) {
    throw new Error(
      `Use targetType power, pace, hr, or cadence at ${fieldName}.`
    )
  }

  return targetType
}

function parseStrengthProgression(
  value: unknown,
  fieldName: string
): StrengthProgressionRule {
  if (typeof value === "undefined") {
    return {
      strategy: "none",
      value: ""
    }
  }

  if (!isRecord(value)) {
    throw new Error(
      `Set \`${fieldName}\` to an object with strategy and value fields.`
    )
  }

  const strategy = readString(
    value.strategy,
    `${fieldName}.strategy`
  ) as StrengthProgressionStrategy

  if (!STRENGTH_PROGRESSION_STRATEGIES.has(strategy)) {
    throw new Error(
      `Use progression strategy none, linear, double-progression, wave, or custom at ${fieldName}.strategy.`
    )
  }

  return {
    strategy,
    value: readOptionalString(value.value, `${fieldName}.value`)
  }
}

function parseStrengthSet(value: unknown, fieldName: string): StrengthSetDraft {
  if (!isRecord(value)) {
    throw new Error(
      `Set ${fieldName} to an object with id/reps/load/rest/timer/progression fields.`
    )
  }

  const timerValue =
    typeof value.timerSeconds === "undefined" || value.timerSeconds === null
      ? null
      : readNonNegativeInteger(value.timerSeconds, `${fieldName}.timerSeconds`)

  return {
    id: readString(value.id, `${fieldName}.id`),
    reps: readPositiveInteger(value.reps, `${fieldName}.reps`),
    load: readString(value.load, `${fieldName}.load`),
    restSeconds: readNonNegativeInteger(
      value.restSeconds,
      `${fieldName}.restSeconds`
    ),
    timerSeconds: timerValue,
    progression: parseStrengthProgression(
      value.progression,
      `${fieldName}.progression`
    ),
    condition: readOptionalString(value.condition, `${fieldName}.condition`)
  }
}

function parseStrengthExerciseEntry(
  value: unknown,
  fieldName: string
): StrengthExerciseEntryDraft {
  if (!isRecord(value)) {
    throw new Error(
      `Set ${fieldName} to an object with id/exerciseId/condition/sets fields.`
    )
  }

  if (!Array.isArray(value.sets) || value.sets.length === 0) {
    throw new Error(`Add at least one set at ${fieldName}.sets.`)
  }

  return {
    id: readString(value.id, `${fieldName}.id`),
    exerciseId: readString(value.exerciseId, `${fieldName}.exerciseId`),
    condition: readOptionalString(value.condition, `${fieldName}.condition`),
    sets: value.sets.map((set, index) =>
      parseStrengthSet(set, `${fieldName}.sets[${index}]`)
    )
  }
}

function parseStrengthVariables(value: unknown): StrengthVariableDraft[] {
  if (typeof value === "undefined") {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error("Set `strength.variables` to an array.")
  }

  return value.map((variable, index) => {
    if (!isRecord(variable)) {
      throw new Error(
        `Set strength.variables[${index}] to an object with id/name/defaultValue.`
      )
    }

    return {
      id: readString(variable.id, `strength.variables[${index}].id`),
      name: readString(variable.name, `strength.variables[${index}].name`),
      defaultValue: readString(
        variable.defaultValue,
        `strength.variables[${index}].defaultValue`
      )
    }
  })
}

function parseStrengthBlocks(
  value: unknown,
  fallbackExerciseIds: string[]
): StrengthBlockDraft[] {
  if (typeof value === "undefined") {
    return buildDefaultStrengthBlocks(fallbackExerciseIds)
  }

  if (!Array.isArray(value)) {
    throw new Error("Set `strength.blocks` to an array.")
  }

  if (value.length === 0) {
    return buildDefaultStrengthBlocks(fallbackExerciseIds)
  }

  return value.map((block, index) => {
    if (!isRecord(block)) {
      throw new Error(
        `Set strength.blocks[${index}] to an object with id/name/repeatCount/condition/exercises fields.`
      )
    }

    if (!Array.isArray(block.exercises)) {
      throw new Error(`Set strength.blocks[${index}].exercises to an array.`)
    }

    return {
      id: readString(block.id, `strength.blocks[${index}].id`),
      name: readString(block.name, `strength.blocks[${index}].name`),
      repeatCount: readPositiveInteger(
        block.repeatCount,
        `strength.blocks[${index}].repeatCount`
      ),
      condition: readOptionalString(
        block.condition,
        `strength.blocks[${index}].condition`
      ),
      exercises: block.exercises.map((entry, exerciseIndex) =>
        parseStrengthExerciseEntry(
          entry,
          `strength.blocks[${index}].exercises[${exerciseIndex}]`
        )
      )
    }
  })
}

function parseIntervalNode(
  value: unknown,
  fieldName: string
): EnduranceIntervalNode {
  if (!isRecord(value)) {
    throw new Error(
      `Set ${fieldName} to an object with kind/id/label/duration/target fields.`
    )
  }

  const kind = readString(value.kind, `${fieldName}.kind`)
  if (kind !== "interval") {
    throw new Error(`Set ${fieldName}.kind to \`interval\`.`)
  }

  return {
    kind: "interval",
    id: readString(value.id, `${fieldName}.id`),
    label: readString(value.label, `${fieldName}.label`),
    durationSeconds: readPositiveInteger(
      value.durationSeconds,
      `${fieldName}.durationSeconds`
    ),
    targetType: readTargetType(value.targetType, `${fieldName}.targetType`),
    targetValue: readPositiveNumber(
      value.targetValue,
      `${fieldName}.targetValue`
    )
  }
}

function parseTimelineNode(
  value: unknown,
  fieldName: string
): EnduranceTimelineNode {
  if (!isRecord(value)) {
    throw new Error(`Set ${fieldName} to an interval or block object.`)
  }

  const kind = readString(value.kind, `${fieldName}.kind`)
  if (kind === "interval") {
    return parseIntervalNode(value, fieldName)
  }

  if (kind === "block") {
    if (!Array.isArray(value.children) || value.children.length === 0) {
      throw new Error(`Add at least one child node at ${fieldName}.children.`)
    }

    return {
      kind: "block",
      id: readString(value.id, `${fieldName}.id`),
      label: readString(value.label, `${fieldName}.label`),
      repeats: readPositiveInteger(value.repeats, `${fieldName}.repeats`),
      children: value.children.map((child, index) =>
        parseTimelineNode(child, `${fieldName}.children[${index}]`)
      )
    }
  }

  throw new Error(`Set ${fieldName}.kind to either \`interval\` or \`block\`.`)
}

function parseTimeline(value: unknown): EnduranceTimelineNode[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "Set `endurance.timeline` to an array of interval/block timeline nodes."
    )
  }

  if (value.length === 0) {
    throw new Error("Add at least one endurance interval.")
  }

  return value.map((entry, index) =>
    parseTimelineNode(entry, `endurance.timeline[${index}]`)
  )
}

function parseLegacyIntervals(value: unknown): EnduranceTimelineNode[] {
  if (!Array.isArray(value)) {
    throw new Error("Set `endurance.intervals` to an array of intervals.")
  }

  if (value.length === 0) {
    throw new Error("Add at least one endurance interval.")
  }

  return value.map((interval, index) => {
    if (!isRecord(interval)) {
      throw new Error(
        `Set interval ${index + 1} to an object with id/label/duration/target fields.`
      )
    }

    const targetType = readTargetType(
      interval.targetType,
      `endurance.intervals[${index}].targetType`
    )

    return {
      kind: "interval",
      id: readString(interval.id, `endurance.intervals[${index}].id`),
      label: readString(interval.label, `endurance.intervals[${index}].label`),
      durationSeconds: readPositiveInteger(
        interval.durationSeconds,
        `endurance.intervals[${index}].durationSeconds`
      ),
      targetType,
      targetValue: readPositiveNumber(
        interval.targetValue,
        `endurance.intervals[${index}].targetValue`
      )
    }
  })
}

function parseReusableBlocks(value: unknown): EnduranceReusableBlock[] {
  if (typeof value === "undefined") {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error("Set `endurance.reusableBlocks` to an array.")
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(
        `Set endurance.reusableBlocks[${index}] to an object with id/name/block fields.`
      )
    }

    const block = parseTimelineNode(
      entry.block,
      `endurance.reusableBlocks[${index}].block`
    )

    if (block.kind !== "block") {
      throw new Error(
        `Set endurance.reusableBlocks[${index}].block.kind to \`block\`.`
      )
    }

    return {
      id: readString(entry.id, `endurance.reusableBlocks[${index}].id`),
      name: readString(entry.name, `endurance.reusableBlocks[${index}].name`),
      block
    }
  })
}

export function parseRoutineDsl(source: string): ParseRoutineDslResult {
  let raw: unknown

  try {
    raw = JSON.parse(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON"
    return {
      ok: false,
      error: `Fix JSON syntax before switching modes. ${message}`
    }
  }

  if (!isRecord(raw)) {
    return {
      ok: false,
      error:
        "Provide a JSON object containing name, path, strength, and endurance."
    }
  }

  try {
    const path = readString(raw.path, "path")
    if (path !== "strength" && path !== "endurance") {
      throw new Error("Set `path` to either `strength` or `endurance`.")
    }

    const strength = raw.strength
    if (!isRecord(strength)) {
      throw new Error("Set `strength` to an object with `exerciseIds` array.")
    }

    const exerciseIds = strength.exerciseIds
    if (!Array.isArray(exerciseIds)) {
      throw new Error("Set `strength.exerciseIds` to an array of exercise ids.")
    }

    const normalizedExerciseIds = [...new Set(exerciseIds)].map(
      (value, index) => readString(value, `strength.exerciseIds[${index}]`)
    )

    const parsedBlocks = parseStrengthBlocks(
      strength.blocks,
      normalizedExerciseIds
    )
    const exerciseIdsFromBlocks = parsedBlocks.flatMap((block) =>
      block.exercises.map((entry) => entry.exerciseId)
    )
    const mergedExerciseIds = [
      ...new Set([...normalizedExerciseIds, ...exerciseIdsFromBlocks])
    ]

    const endurance = raw.endurance
    if (!isRecord(endurance)) {
      throw new Error(
        "Set `endurance` to an object with `timeline` or `intervals`."
      )
    }

    const timeline =
      typeof endurance.timeline !== "undefined"
        ? parseTimeline(endurance.timeline)
        : parseLegacyIntervals(endurance.intervals)

    return {
      ok: true,
      draft: {
        name: readString(raw.name, "name"),
        path,
        strength: {
          exerciseIds: mergedExerciseIds,
          variables: parseStrengthVariables(strength.variables),
          blocks: parsedBlocks
        },
        endurance: {
          timeline,
          reusableBlocks: parseReusableBlocks(endurance.reusableBlocks)
        }
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid routine DSL"
    return {
      ok: false,
      error: message
    }
  }
}
