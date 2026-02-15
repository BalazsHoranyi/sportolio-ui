import type {
  EnduranceIntervalNode,
  EnduranceReusableBlock,
  EnduranceTargetType,
  EnduranceTimelineNode,
  RoutineDraft
} from "@/features/routine/types"

const ENDURANCE_TARGET_TYPES = new Set<EnduranceTargetType>([
  "power",
  "pace",
  "hr",
  "cadence"
])

export function buildInitialRoutineDraft(): RoutineDraft {
  return {
    name: "New Routine",
    path: "strength",
    strength: {
      exerciseIds: []
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
          exerciseIds: normalizedExerciseIds
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
