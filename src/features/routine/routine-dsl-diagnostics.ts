import type { Completion } from "@codemirror/autocomplete"

import {
  parseRoutineDsl,
  type ParseRoutineDslResult
} from "@/features/routine/routine-dsl"
import type {
  EnduranceTimelineNode,
  RoutineDraft,
  StrengthSetDraft
} from "@/features/routine/types"

type DiagnosticSeverity = "error" | "warning"

export type RoutineDslDiagnostic = {
  code: string
  message: string
  path: string
  severity: DiagnosticSeverity
}

export type RoutineDslPrimitiveReference = {
  primitive: string
  description: string
  example: string
  completionLabel: string
  completionApply: string
}

export type RoutineDslAnalysis = {
  canApply: boolean
  errors: RoutineDslDiagnostic[]
  warnings: RoutineDslDiagnostic[]
  parseResult: ParseRoutineDslResult
  primitives: readonly RoutineDslPrimitiveReference[]
}

export const ROUTINE_DSL_PRIMITIVES: readonly RoutineDslPrimitiveReference[] = [
  {
    primitive: "path",
    description: "Select routine entry path (`strength` or `endurance`).",
    example: '"path": "strength"',
    completionLabel: '"path"',
    completionApply: '"path": "strength"'
  },
  {
    primitive: "strength.variables",
    description:
      "Reusable variables for load/progression expressions across sets.",
    example:
      '"variables": [{ "id": "var-1", "name": "topSetLoad", "defaultValue": "100kg" }]',
    completionLabel: '"variables"',
    completionApply:
      '"variables": [{ "id": "var-1", "name": "topSetLoad", "defaultValue": "100kg" }]'
  },
  {
    primitive: "strength.blocks[].repeatCount",
    description: "Loop count for a block in strength flow.",
    example: '"repeatCount": 2',
    completionLabel: '"repeatCount"',
    completionApply: '"repeatCount": 1'
  },
  {
    primitive: "strength.blocks[].exercises[].sets[].progression",
    description:
      "Set progression strategy and value (linear, wave, custom, etc.).",
    example: '"progression": { "strategy": "linear", "value": "+2.5kg/week" }',
    completionLabel: '"progression"',
    completionApply: '"progression": { "strategy": "none", "value": "" }'
  },
  {
    primitive: "endurance.timeline",
    description:
      "Timeline nodes support `interval` and nested `block` structures.",
    example:
      '"timeline": [{ "kind": "interval", "id": "int-1", "label": "Tempo", "durationSeconds": 420, "targetType": "power", "targetValue": 305 }]',
    completionLabel: '"timeline"',
    completionApply:
      '"timeline": [{ "kind": "interval", "id": "int-1", "label": "Steady", "durationSeconds": 300, "targetType": "power", "targetValue": 250 }]'
  },
  {
    primitive: "templateSource",
    description: "Source attribution metadata for instantiated templates.",
    example:
      '"templateSource": { "templateId": "tpl-1", "templateName": "Coach Builder", "context": "micro", "ownerRole": "coach", "ownerId": "coach-1", "instantiatedAt": "2026-02-15T07:31:00.000Z" }',
    completionLabel: '"templateSource"',
    completionApply:
      '"templateSource": { "templateId": "tpl-1", "templateName": "Coach Builder", "context": "micro", "ownerRole": "coach", "ownerId": "coach-1", "instantiatedAt": "2026-02-15T07:31:00.000Z" }'
  }
]

export const ROUTINE_DSL_COMPLETIONS: readonly Completion[] =
  ROUTINE_DSL_PRIMITIVES.map((primitive) => ({
    label: primitive.completionLabel,
    type: "property",
    apply: primitive.completionApply
  }))

function pushWarning(
  warnings: RoutineDslDiagnostic[],
  code: string,
  message: string,
  path: string
) {
  warnings.push({
    code,
    message,
    path,
    severity: "warning"
  })
}

function lintStrengthSet(
  warnings: RoutineDslDiagnostic[],
  set: StrengthSetDraft,
  path: string
) {
  const progressionValue = set.progression.value.trim()

  if (set.progression.strategy !== "none" && progressionValue.length === 0) {
    pushWarning(
      warnings,
      "progression-missing-value",
      `${path}.progression.strategy \`${set.progression.strategy}\` requires a non-empty progression value.`,
      `${path}.progression.value`
    )
  }

  if (set.progression.strategy === "none" && progressionValue.length > 0) {
    pushWarning(
      warnings,
      "progression-unused-value",
      `${path}.progression.value is ignored when strategy is \`none\`.`,
      `${path}.progression.value`
    )
  }

  if (set.reps > 30) {
    pushWarning(
      warnings,
      "set-high-rep-range",
      `${path}.reps is unusually high (${set.reps}). Confirm this is intentional.`,
      `${path}.reps`
    )
  }

  if (set.restSeconds > 900) {
    pushWarning(
      warnings,
      "set-long-rest-window",
      `${path}.restSeconds is unusually long (${set.restSeconds}s).`,
      `${path}.restSeconds`
    )
  }

  if (set.timerSeconds !== null && set.timerSeconds > 3600) {
    pushWarning(
      warnings,
      "set-long-timer-window",
      `${path}.timerSeconds exceeds one hour (${set.timerSeconds}s).`,
      `${path}.timerSeconds`
    )
  }
}

function walkTimeline(
  warnings: RoutineDslDiagnostic[],
  node: EnduranceTimelineNode,
  path: string
) {
  if (node.kind === "interval") {
    if (node.durationSeconds > 7200) {
      pushWarning(
        warnings,
        "interval-long-duration",
        `${path}.durationSeconds exceeds two hours (${node.durationSeconds}s).`,
        `${path}.durationSeconds`
      )
    }
    return
  }

  if (node.repeats > 12) {
    pushWarning(
      warnings,
      "endurance-block-high-repeat-count",
      `${path}.repeats is high (${node.repeats}).`,
      `${path}.repeats`
    )
  }

  node.children.forEach((child, childIndex) => {
    walkTimeline(warnings, child, `${path}.children[${childIndex}]`)
  })
}

function lintRoutineDraft(draft: RoutineDraft): RoutineDslDiagnostic[] {
  const warnings: RoutineDslDiagnostic[] = []

  draft.strength.blocks.forEach((block, blockIndex) => {
    const blockPath = `strength.blocks[${blockIndex}]`
    if (block.repeatCount > 12) {
      pushWarning(
        warnings,
        "strength-block-high-repeat-count",
        `${blockPath}.repeatCount is high (${block.repeatCount}).`,
        `${blockPath}.repeatCount`
      )
    }

    block.exercises.forEach((exercise, exerciseIndex) => {
      const exercisePath = `${blockPath}.exercises[${exerciseIndex}]`
      exercise.sets.forEach((set, setIndex) => {
        lintStrengthSet(warnings, set, `${exercisePath}.sets[${setIndex}]`)
      })
    })
  })

  draft.endurance.timeline.forEach((node, index) => {
    walkTimeline(warnings, node, `endurance.timeline[${index}]`)
  })

  draft.endurance.reusableBlocks.forEach((entry, index) => {
    walkTimeline(
      warnings,
      entry.block,
      `endurance.reusableBlocks[${index}].block`
    )
  })

  return warnings
}

export function analyzeRoutineDsl(source: string): RoutineDslAnalysis {
  const parseResult = parseRoutineDsl(source)

  if (!parseResult.ok) {
    return {
      canApply: false,
      parseResult,
      errors: [
        {
          code: "dsl-structure-invalid",
          message: parseResult.error,
          path: "root",
          severity: "error"
        }
      ],
      warnings: [],
      primitives: ROUTINE_DSL_PRIMITIVES
    }
  }

  return {
    canApply: true,
    parseResult,
    errors: [],
    warnings: lintRoutineDraft(parseResult.draft),
    primitives: ROUTINE_DSL_PRIMITIVES
  }
}
