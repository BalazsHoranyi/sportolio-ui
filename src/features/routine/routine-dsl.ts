import type {
  EnduranceInterval,
  EnduranceTargetType,
  RoutineDraft
} from "@/features/routine/types"

const ENDURANCE_TARGET_TYPES = new Set<EnduranceTargetType>([
  "power",
  "pace",
  "hr"
])

export function buildInitialRoutineDraft(): RoutineDraft {
  return {
    name: "New Routine",
    path: "strength",
    strength: {
      exerciseIds: []
    },
    endurance: {
      intervals: [
        {
          id: "int-1",
          label: "Steady State",
          durationSeconds: 300,
          targetType: "power",
          targetValue: 250
        }
      ]
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

function parseIntervals(value: unknown): EnduranceInterval[] {
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

    const targetType = readString(
      interval.targetType,
      `endurance.intervals[${index}].targetType`
    ) as EnduranceTargetType

    if (!ENDURANCE_TARGET_TYPES.has(targetType)) {
      throw new Error(
        `Use targetType power, pace, or hr at endurance.intervals[${index}].targetType.`
      )
    }

    return {
      id: readString(interval.id, `endurance.intervals[${index}].id`),
      label: readString(interval.label, `endurance.intervals[${index}].label`),
      durationSeconds: readPositiveNumber(
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
      throw new Error("Set `endurance` to an object with `intervals` array.")
    }

    return {
      ok: true,
      draft: {
        name: readString(raw.name, "name"),
        path,
        strength: {
          exerciseIds: normalizedExerciseIds
        },
        endurance: {
          intervals: parseIntervals(endurance.intervals)
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
