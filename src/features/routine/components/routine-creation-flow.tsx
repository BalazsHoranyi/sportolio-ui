"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EXERCISE_CATALOG } from "@/features/exercises/catalog"
import type { Exercise } from "@/features/exercises/types"
import {
  buildInitialRoutineDraft,
  parseRoutineDsl,
  serializeRoutineDraft
} from "@/features/routine/routine-dsl"
import { StrengthExercisePicker } from "@/features/routine/components/strength-exercise-picker"
import { EnduranceTimelineBuilder } from "@/features/routine/components/endurance-timeline-builder"
import type {
  EnduranceTargetType,
  RoutineDraft,
  RoutineMode,
  RoutinePath
} from "@/features/routine/types"

const TARGET_TYPES: EnduranceTargetType[] = ["power", "pace", "hr", "cadence"]

function mapExercisesById(ids: string[]): Exercise[] {
  const catalogById = new Map(
    EXERCISE_CATALOG.map((exercise) => [exercise.id, exercise])
  )

  return ids
    .map((id) => catalogById.get(id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function createNextDraft(
  draft: RoutineDraft,
  updater: (current: RoutineDraft) => RoutineDraft
): RoutineDraft {
  const nextDraft = updater(draft)

  return {
    ...nextDraft,
    strength: {
      exerciseIds: [...nextDraft.strength.exerciseIds]
    },
    endurance: {
      timeline: [...nextDraft.endurance.timeline],
      reusableBlocks: [...nextDraft.endurance.reusableBlocks]
    }
  }
}

export function RoutineCreationFlow() {
  const [mode, setMode] = useState<RoutineMode>("visual")
  const [draft, setDraft] = useState<RoutineDraft>(() =>
    buildInitialRoutineDraft()
  )
  const [dslValue, setDslValue] = useState<string>(() =>
    serializeRoutineDraft(buildInitialRoutineDraft())
  )
  const [dslError, setDslError] = useState<string | null>(null)

  const selectedStrengthExercises = useMemo(
    () => mapExercisesById(draft.strength.exerciseIds),
    [draft.strength.exerciseIds]
  )

  const applyDraftUpdate = (
    updater: (current: RoutineDraft) => RoutineDraft
  ) => {
    setDraft((current) => {
      const next = createNextDraft(current, updater)

      if (mode === "dsl") {
        setDslValue(serializeRoutineDraft(next))
      }

      return next
    })
  }

  const setActivePath = (path: RoutinePath) => {
    applyDraftUpdate((current) => ({
      ...current,
      path
    }))
  }

  const setActiveMode = (nextMode: RoutineMode) => {
    setMode(nextMode)

    if (nextMode === "dsl") {
      setDslValue(serializeRoutineDraft(draft))
      setDslError(null)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Routine Creation Flow
        </h1>
        <p className="text-sm text-muted-foreground">
          Build routines in visual mode or edit the advanced DSL directly while
          keeping both views synchronized.
        </p>
      </header>

      <Card className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="routine-name-input">Routine name</Label>
          <Input
            id="routine-name-input"
            value={draft.name}
            onChange={(event) => {
              applyDraftUpdate((current) => ({
                ...current,
                name: event.target.value
              }))
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Entry path</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Routine entry path"
          >
            <Button
              type="button"
              variant={draft.path === "strength" ? "default" : "outline"}
              aria-pressed={draft.path === "strength"}
              onClick={() => setActivePath("strength")}
            >
              Strength
            </Button>
            <Button
              type="button"
              variant={draft.path === "endurance" ? "default" : "outline"}
              aria-pressed={draft.path === "endurance"}
              onClick={() => setActivePath("endurance")}
            >
              Endurance
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Editing mode</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Routine editing mode"
          >
            <Button
              type="button"
              variant={mode === "visual" ? "default" : "outline"}
              aria-pressed={mode === "visual"}
              onClick={() => setActiveMode("visual")}
            >
              Visual
            </Button>
            <Button
              type="button"
              variant={mode === "dsl" ? "default" : "outline"}
              aria-pressed={mode === "dsl"}
              onClick={() => setActiveMode("dsl")}
            >
              DSL
            </Button>
          </div>
        </div>
      </Card>

      {mode === "visual" ? (
        <Card className="space-y-4 p-4">
          {draft.path === "strength" ? (
            <>
              <StrengthExercisePicker
                selectedExerciseIds={draft.strength.exerciseIds}
                onSelectExercise={(exercise) => {
                  applyDraftUpdate((current) => ({
                    ...current,
                    strength: {
                      exerciseIds: current.strength.exerciseIds.includes(
                        exercise.id
                      )
                        ? current.strength.exerciseIds
                        : [...current.strength.exerciseIds, exercise.id]
                    }
                  }))
                }}
              />

              <section
                className="space-y-2"
                aria-label="Selected strength exercises"
              >
                <h2 className="text-base font-medium">
                  Selected strength exercises
                </h2>
                {selectedStrengthExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No exercises selected yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedStrengthExercises.map((exercise) => (
                      <li key={exercise.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {exercise.canonicalName}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {exercise.equipment.map((equipment) => (
                                <Badge key={`${exercise.id}-${equipment}`}>
                                  {equipment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              applyDraftUpdate((current) => ({
                                ...current,
                                strength: {
                                  exerciseIds:
                                    current.strength.exerciseIds.filter(
                                      (id) => id !== exercise.id
                                    )
                                }
                              }))
                            }}
                            aria-label={`Remove ${exercise.canonicalName}`}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <EnduranceTimelineBuilder
              timeline={draft.endurance.timeline}
              reusableBlocks={draft.endurance.reusableBlocks}
              onTimelineChange={(nextTimeline) => {
                applyDraftUpdate((current) => ({
                  ...current,
                  endurance: {
                    ...current.endurance,
                    timeline: nextTimeline
                  }
                }))
              }}
              onReusableBlocksChange={(nextReusableBlocks) => {
                applyDraftUpdate((current) => ({
                  ...current,
                  endurance: {
                    ...current.endurance,
                    reusableBlocks: nextReusableBlocks
                  }
                }))
              }}
            />
          )}
        </Card>
      ) : (
        <Card className="space-y-3 p-4">
          <Label htmlFor="routine-dsl-editor">Routine DSL editor</Label>
          <textarea
            id="routine-dsl-editor"
            aria-label="Routine DSL editor"
            className="min-h-[300px] w-full rounded-md border px-3 py-2 font-mono text-sm"
            spellCheck={false}
            value={dslValue}
            onChange={(event) => {
              const nextValue = event.target.value
              setDslValue(nextValue)

              const parseResult = parseRoutineDsl(nextValue)
              if (!parseResult.ok) {
                setDslError(parseResult.error)
                return
              }

              setDslError(null)
              setDraft(parseResult.draft)
            }}
          />
          {dslError ? (
            <p role="alert" className="text-sm text-red-700">
              {dslError}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              DSL is synchronized with visual mode for supported routine fields.
            </p>
          )}
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-medium">UI parity hook preview</h2>
        <p className="text-sm text-muted-foreground">
          Current routine payload exposed for downstream synchronization hooks.
        </p>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
          {serializeRoutineDraft(draft)}
        </pre>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-medium">Endurance target reference</h2>
        <div className="flex flex-wrap gap-2">
          {TARGET_TYPES.map((target) => (
            <Badge key={target}>{target}</Badge>
          ))}
        </div>
      </Card>
    </main>
  )
}
