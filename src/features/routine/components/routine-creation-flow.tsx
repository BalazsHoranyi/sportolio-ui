"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppShell } from "@/components/layout/app-shell"
import { EXERCISE_CATALOG } from "@/features/exercises/catalog"
import type { Exercise } from "@/features/exercises/types"
import {
  analyzeRoutineDsl,
  ROUTINE_DSL_PRIMITIVES
} from "@/features/routine/routine-dsl-diagnostics"
import {
  buildInitialRoutineDraft,
  serializeRoutineDraft
} from "@/features/routine/routine-dsl"
import { buildRoutineExecutionPayload } from "@/features/routine/routine-execution-payload"
import {
  buildRoutineTemplate,
  canInstantiateRoutineTemplate,
  filterRoutineTemplates,
  instantiateRoutineTemplate,
  parseTemplateTagInput
} from "@/features/routine/routine-template-library"
import { StrengthExercisePicker } from "@/features/routine/components/strength-exercise-picker"
import { EnduranceTimelineBuilder } from "@/features/routine/components/endurance-timeline-builder"
import { RoutineDslEditor } from "@/features/routine/components/routine-dsl-editor"
import type {
  EnduranceTargetType,
  RoutineDraft,
  RoutineMode,
  RoutinePath,
  RoutineTemplate,
  RoutineTemplateContext,
  RoutineTemplateOwnerRole,
  RoutineTemplateVisibility,
  StrengthExerciseEntryDraft,
  StrengthProgressionStrategy
} from "@/features/routine/types"

const TARGET_TYPES: EnduranceTargetType[] = ["power", "pace", "hr", "cadence"]
const INITIAL_ROUTINE_DRAFT = buildInitialRoutineDraft()
const USER_IDS_BY_ROLE: Record<RoutineTemplateOwnerRole, string> = {
  athlete: "athlete-1",
  coach: "coach-1"
}

type DraftHistory = {
  past: RoutineDraft[]
  present: RoutineDraft
  future: RoutineDraft[]
}

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
  return structuredClone(updater(draft))
}

function draftsEqual(left: RoutineDraft, right: RoutineDraft): boolean {
  return serializeRoutineDraft(left) === serializeRoutineDraft(right)
}

function createStrengthExerciseEntry(
  exerciseId: string,
  index: number
): StrengthExerciseEntryDraft {
  return {
    id: `entry-${index + 1}`,
    exerciseId,
    condition: "",
    sets: [
      {
        id: `set-${index + 1}-1`,
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
    ]
  }
}

function ensurePrimaryBlock(
  draft: RoutineDraft
): RoutineDraft["strength"]["blocks"] {
  if (draft.strength.blocks.length > 0) {
    return draft.strength.blocks
  }

  return [
    {
      id: "block-1",
      name: "Primary block",
      repeatCount: 1,
      condition: "",
      exercises: []
    }
  ]
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items
  }

  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  if (!item) {
    return items
  }
  next.splice(toIndex, 0, item)
  return next
}

function parseTagFilter(value: string): string[] {
  return parseTemplateTagInput(value)
}

export function RoutineCreationFlow() {
  const [mode, setMode] = useState<RoutineMode>("visual")
  const [history, setHistory] = useState<DraftHistory>(() => ({
    past: [],
    present: structuredClone(INITIAL_ROUTINE_DRAFT),
    future: []
  }))
  const [dslValue, setDslValue] = useState<string>(() =>
    serializeRoutineDraft(INITIAL_ROUTINE_DRAFT)
  )
  const [dslErrors, setDslErrors] = useState<string[]>([])
  const [dslWarnings, setDslWarnings] = useState<string[]>([])
  const draft = history.present
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null)
  const [templateLibrary, setTemplateLibrary] = useState<RoutineTemplate[]>([])
  const [activeUserRole, setActiveUserRole] =
    useState<RoutineTemplateOwnerRole>("coach")
  const [templateOwnerRole, setTemplateOwnerRole] =
    useState<RoutineTemplateOwnerRole>("coach")
  const [templateVisibility, setTemplateVisibility] =
    useState<RoutineTemplateVisibility>("shared")
  const [templateTagInput, setTemplateTagInput] = useState("")
  const [templateSearchInput, setTemplateSearchInput] = useState("")
  const [templateFilterModality, setTemplateFilterModality] = useState<
    RoutinePath | "all"
  >("all")
  const [templateFilterTagInput, setTemplateFilterTagInput] = useState("")
  const [instantiationContext, setInstantiationContext] =
    useState<RoutineTemplateContext>("macro")
  const [templateStatusMessage, setTemplateStatusMessage] = useState<
    string | null
  >(null)

  const selectedStrengthExercises = useMemo(
    () => mapExercisesById(draft.strength.exerciseIds),
    [draft.strength.exerciseIds]
  )
  const selectedStrengthExercisesById = useMemo(
    () =>
      new Map(
        selectedStrengthExercises.map((exercise) => [exercise.id, exercise])
      ),
    [selectedStrengthExercises]
  )
  const strengthBlocks = useMemo(() => ensurePrimaryBlock(draft), [draft])
  const filteredTemplates = useMemo(
    () =>
      filterRoutineTemplates(templateLibrary, {
        query: templateSearchInput,
        modality: templateFilterModality,
        tags: parseTagFilter(templateFilterTagInput)
      }),
    [
      templateFilterModality,
      templateFilterTagInput,
      templateLibrary,
      templateSearchInput
    ]
  )
  const trackingExecutionPayload = useMemo(
    () => buildRoutineExecutionPayload(draft),
    [draft]
  )

  const commitDraft = useCallback(
    (nextDraft: RoutineDraft, options?: { dslBuffer?: string }) => {
      if (!draftsEqual(history.present, nextDraft)) {
        setHistory((current) => ({
          past: [...current.past, current.present],
          present: structuredClone(nextDraft),
          future: []
        }))
      }

      const serialized = options?.dslBuffer ?? serializeRoutineDraft(nextDraft)
      const diagnostics = analyzeRoutineDsl(serialized)
      setDslValue(serialized)
      setDslErrors(diagnostics.errors.map((error) => error.message))
      setDslWarnings(diagnostics.warnings.map((warning) => warning.message))
    },
    [history.present]
  )

  const applyDraftUpdate = useCallback(
    (updater: (current: RoutineDraft) => RoutineDraft) => {
      commitDraft(createNextDraft(draft, updater))
    },
    [commitDraft, draft]
  )

  const undo = useCallback(() => {
    if (!canUndo) {
      return
    }

    const previousDraft = history.past[history.past.length - 1]
    setHistory((current) => {
      if (current.past.length === 0) {
        return current
      }

      const previous = current.past[current.past.length - 1]
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future]
      }
    })
    const serialized = serializeRoutineDraft(previousDraft)
    const diagnostics = analyzeRoutineDsl(serialized)
    setDslValue(serialized)
    setDslErrors(diagnostics.errors.map((error) => error.message))
    setDslWarnings(diagnostics.warnings.map((warning) => warning.message))
  }, [canUndo, history.past])

  const redo = useCallback(() => {
    if (!canRedo) {
      return
    }

    const nextDraft = history.future[0]
    setHistory((current) => {
      if (current.future.length === 0) {
        return current
      }

      const [next, ...remainingFuture] = current.future
      return {
        past: [...current.past, current.present],
        present: next,
        future: remainingFuture
      }
    })
    const serialized = serializeRoutineDraft(nextDraft)
    const diagnostics = analyzeRoutineDsl(serialized)
    setDslValue(serialized)
    setDslErrors(diagnostics.errors.map((error) => error.message))
    setDslWarnings(diagnostics.warnings.map((warning) => warning.message))
  }, [canRedo, history.future])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey
      if (!hasModifier) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === "z" && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [redo, undo])

  const setActivePath = (path: RoutinePath) => {
    applyDraftUpdate((current) => ({
      ...current,
      path
    }))
  }

  const setActiveMode = (nextMode: RoutineMode) => {
    setMode(nextMode)

    if (nextMode === "dsl") {
      const serialized = serializeRoutineDraft(draft)
      const diagnostics = analyzeRoutineDsl(serialized)
      setDslValue(serialized)
      setDslErrors(diagnostics.errors.map((error) => error.message))
      setDslWarnings(diagnostics.warnings.map((warning) => warning.message))
    }
  }

  const addExerciseToStrengthDraft = (exerciseId: string) => {
    applyDraftUpdate((current) => {
      const blocks = ensurePrimaryBlock(current)
      const existingEntryIds = new Set(
        blocks.flatMap((block) =>
          block.exercises.map((entry) => entry.exerciseId)
        )
      )
      const nextBlocks = structuredClone(blocks)
      if (!existingEntryIds.has(exerciseId)) {
        nextBlocks[0]?.exercises.push(
          createStrengthExerciseEntry(
            exerciseId,
            (nextBlocks[0]?.exercises.length ?? 0) + 1
          )
        )
      }

      return {
        ...current,
        strength: {
          ...current.strength,
          exerciseIds: current.strength.exerciseIds.includes(exerciseId)
            ? current.strength.exerciseIds
            : [...current.strength.exerciseIds, exerciseId],
          blocks: nextBlocks
        }
      }
    })
  }

  const removeExerciseFromStrengthDraft = (exerciseId: string) => {
    applyDraftUpdate((current) => ({
      ...current,
      strength: {
        ...current.strength,
        exerciseIds: current.strength.exerciseIds.filter(
          (id) => id !== exerciseId
        ),
        blocks: ensurePrimaryBlock(current).map((block) => ({
          ...block,
          exercises: block.exercises.filter(
            (entry) => entry.exerciseId !== exerciseId
          )
        }))
      }
    }))
  }

  const reorderExerciseInBlock = (
    blockId: string,
    fromEntryId: string,
    toEntryId: string
  ) => {
    applyDraftUpdate((current) => ({
      ...current,
      strength: {
        ...current.strength,
        blocks: ensurePrimaryBlock(current).map((block) => {
          if (block.id !== blockId) {
            return block
          }

          const fromIndex = block.exercises.findIndex(
            (entry) => entry.id === fromEntryId
          )
          const toIndex = block.exercises.findIndex(
            (entry) => entry.id === toEntryId
          )

          return {
            ...block,
            exercises: moveItem(block.exercises, fromIndex, toIndex)
          }
        })
      }
    }))
  }

  const saveCurrentRoutineAsTemplate = () => {
    const template = buildRoutineTemplate({
      routine: draft,
      ownerRole: templateOwnerRole,
      ownerId: USER_IDS_BY_ROLE[templateOwnerRole],
      visibility: templateVisibility,
      tags: parseTemplateTagInput(templateTagInput),
      name: draft.name
    })

    setTemplateLibrary((current) => [template, ...current])
    setTemplateStatusMessage(`Saved template ${template.name}.`)
  }

  const instantiateFromTemplate = (template: RoutineTemplate) => {
    const result = instantiateRoutineTemplate({
      template,
      actorRole: activeUserRole,
      actorId: USER_IDS_BY_ROLE[activeUserRole],
      context: instantiationContext
    })

    if (!result.ok) {
      setTemplateStatusMessage(result.error)
      return
    }

    commitDraft(result.routine)
    setTemplateStatusMessage(
      `Instantiated ${template.name} into ${instantiationContext} context.`
    )
  }

  return (
    <AppShell
      title="Routine Creation Flow"
      description="Build routines in visual mode or edit the advanced DSL directly while keeping both views synchronized."
      maxWidth="narrow"
    >
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

        <div className="space-y-2">
          <p className="text-sm font-medium">History</p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Routine edit history"
          >
            <Button
              type="button"
              variant="outline"
              aria-keyshortcuts="Control+Z Meta+Z"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-keyshortcuts="Control+Y Meta+Y Control+Shift+Z Meta+Shift+Z"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4" aria-label="Routine template library">
        <header className="space-y-1">
          <h2 className="text-lg font-medium">Routine template library</h2>
          <p className="text-sm text-muted-foreground">
            Save reusable templates and instantiate them into macro, meso, or
            micro planning contexts.
          </p>
        </header>

        {templateStatusMessage ? (
          <p className="text-sm font-medium text-emerald-700">
            {templateStatusMessage}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="active-user-role">Active user role</Label>
            <select
              id="active-user-role"
              aria-label="Active user role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={activeUserRole}
              onChange={(event) => {
                setActiveUserRole(
                  event.target.value as RoutineTemplateOwnerRole
                )
              }}
            >
              <option value="coach">coach</option>
              <option value="athlete">athlete</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="template-owner-role">Template owner role</Label>
            <select
              id="template-owner-role"
              aria-label="Template owner role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={templateOwnerRole}
              onChange={(event) => {
                setTemplateOwnerRole(
                  event.target.value as RoutineTemplateOwnerRole
                )
              }}
            >
              <option value="coach">coach</option>
              <option value="athlete">athlete</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="template-visibility">Template visibility</Label>
            <select
              id="template-visibility"
              aria-label="Template visibility"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={templateVisibility}
              onChange={(event) => {
                setTemplateVisibility(
                  event.target.value as RoutineTemplateVisibility
                )
              }}
            >
              <option value="shared">shared</option>
              <option value="private">private</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="instantiation-context">Instantiation context</Label>
            <select
              id="instantiation-context"
              aria-label="Instantiation context"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={instantiationContext}
              onChange={(event) => {
                setInstantiationContext(
                  event.target.value as RoutineTemplateContext
                )
              }}
            >
              <option value="macro">macro</option>
              <option value="meso">meso</option>
              <option value="micro">micro</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="template-tags">Template tags</Label>
            <Input
              id="template-tags"
              aria-label="Template tags"
              placeholder="strength, power"
              value={templateTagInput}
              onChange={(event) => {
                setTemplateTagInput(event.target.value)
              }}
            />
          </div>

          <div className="flex items-end">
            <Button type="button" onClick={saveCurrentRoutineAsTemplate}>
              Save as template
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="template-search">Template search</Label>
            <Input
              id="template-search"
              aria-label="Template search"
              placeholder="Search by name or tag"
              value={templateSearchInput}
              onChange={(event) => {
                setTemplateSearchInput(event.target.value)
              }}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="template-filter-modality">Filter modality</Label>
            <select
              id="template-filter-modality"
              aria-label="Filter modality"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={templateFilterModality}
              onChange={(event) => {
                const nextValue = event.target.value
                setTemplateFilterModality(
                  nextValue === "all" ? "all" : (nextValue as RoutinePath)
                )
              }}
            >
              <option value="all">all</option>
              <option value="strength">strength</option>
              <option value="endurance">endurance</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="template-filter-tags">Filter tags</Label>
            <Input
              id="template-filter-tags"
              aria-label="Filter tags"
              placeholder="vo2, threshold"
              value={templateFilterTagInput}
              onChange={(event) => {
                setTemplateFilterTagInput(event.target.value)
              }}
            />
          </div>
        </div>

        <section className="space-y-2" aria-label="Saved routine templates">
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates match the current filters.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredTemplates.map((template) => {
                const canInstantiate = canInstantiateRoutineTemplate({
                  template,
                  actorRole: activeUserRole,
                  actorId: USER_IDS_BY_ROLE[activeUserRole]
                })

                return (
                  <li key={template.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">{template.name}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge>{template.path}</Badge>
                          <Badge>{template.visibility}</Badge>
                          <Badge>
                            {template.ownerRole}:{template.ownerId}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tags:{" "}
                          {template.tags.length > 0
                            ? template.tags.join(", ")
                            : "none"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-label={`Instantiate ${template.name}`}
                        disabled={!canInstantiate}
                        onClick={() => {
                          instantiateFromTemplate(template)
                        }}
                      >
                        Instantiate {template.name}
                      </Button>
                    </div>
                    {!canInstantiate ? (
                      <p className="mt-2 text-xs text-amber-700">
                        No access for current user role.
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </Card>

      {mode === "visual" ? (
        <Card className="space-y-4 p-4">
          {draft.path === "strength" ? (
            <>
              <StrengthExercisePicker
                selectedExerciseIds={draft.strength.exerciseIds}
                onSelectExercise={(exercise) => {
                  addExerciseToStrengthDraft(exercise.id)
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
                  <div className="space-y-4">
                    <section
                      className="space-y-3 rounded-md border p-3"
                      aria-label="Strength variables"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                          Custom variables
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            applyDraftUpdate((current) => ({
                              ...current,
                              strength: {
                                ...current.strength,
                                variables: [
                                  ...current.strength.variables,
                                  {
                                    id: `var-${current.strength.variables.length + 1}`,
                                    name: "",
                                    defaultValue: ""
                                  }
                                ]
                              }
                            }))
                          }}
                        >
                          Add variable
                        </Button>
                      </div>

                      {draft.strength.variables.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No variables yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {draft.strength.variables.map((variable, index) => (
                            <div
                              key={variable.id}
                              className="grid gap-2 md:grid-cols-3"
                            >
                              <div className="space-y-1">
                                <Label htmlFor={`variable-name-${variable.id}`}>
                                  Variable name {index + 1}
                                </Label>
                                <Input
                                  id={`variable-name-${variable.id}`}
                                  aria-label={`Variable name ${index + 1}`}
                                  value={variable.name}
                                  onChange={(event) => {
                                    applyDraftUpdate((current) => ({
                                      ...current,
                                      strength: {
                                        ...current.strength,
                                        variables:
                                          current.strength.variables.map(
                                            (entry) =>
                                              entry.id === variable.id
                                                ? {
                                                    ...entry,
                                                    name: event.target.value
                                                  }
                                                : entry
                                          )
                                      }
                                    }))
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`variable-default-${variable.id}`}
                                >
                                  Variable default value {index + 1}
                                </Label>
                                <Input
                                  id={`variable-default-${variable.id}`}
                                  aria-label={`Variable default value ${index + 1}`}
                                  value={variable.defaultValue}
                                  onChange={(event) => {
                                    applyDraftUpdate((current) => ({
                                      ...current,
                                      strength: {
                                        ...current.strength,
                                        variables:
                                          current.strength.variables.map(
                                            (entry) =>
                                              entry.id === variable.id
                                                ? {
                                                    ...entry,
                                                    defaultValue:
                                                      event.target.value
                                                  }
                                                : entry
                                          )
                                      }
                                    }))
                                  }}
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    applyDraftUpdate((current) => ({
                                      ...current,
                                      strength: {
                                        ...current.strength,
                                        variables:
                                          current.strength.variables.filter(
                                            (entry) => entry.id !== variable.id
                                          )
                                      }
                                    }))
                                  }}
                                >
                                  Remove variable {index + 1}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {strengthBlocks.map((block) => (
                      <section
                        key={block.id}
                        className="space-y-3 rounded-md border p-3"
                        aria-label={`Strength block ${block.name}`}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`block-repeat-${block.id}`}>
                              Loop count for {block.name}
                            </Label>
                            <Input
                              id={`block-repeat-${block.id}`}
                              aria-label={`Loop count for ${block.name}`}
                              type="number"
                              min={1}
                              value={block.repeatCount}
                              onChange={(event) => {
                                const nextValue = Number.parseInt(
                                  event.target.value || "1",
                                  10
                                )
                                applyDraftUpdate((current) => ({
                                  ...current,
                                  strength: {
                                    ...current.strength,
                                    blocks: ensurePrimaryBlock(current).map(
                                      (entry) =>
                                        entry.id === block.id
                                          ? {
                                              ...entry,
                                              repeatCount:
                                                Number.isFinite(nextValue) &&
                                                nextValue > 0
                                                  ? nextValue
                                                  : 1
                                            }
                                          : entry
                                    )
                                  }
                                }))
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`block-condition-${block.id}`}>
                              Condition for {block.name}
                            </Label>
                            <Input
                              id={`block-condition-${block.id}`}
                              aria-label={`Condition for ${block.name}`}
                              placeholder="e.g. week<=4"
                              value={block.condition}
                              onChange={(event) => {
                                applyDraftUpdate((current) => ({
                                  ...current,
                                  strength: {
                                    ...current.strength,
                                    blocks: ensurePrimaryBlock(current).map(
                                      (entry) =>
                                        entry.id === block.id
                                          ? {
                                              ...entry,
                                              condition: event.target.value
                                            }
                                          : entry
                                    )
                                  }
                                }))
                              }}
                            />
                          </div>
                        </div>

                        <ul
                          className="space-y-3"
                          aria-label={`Exercises in ${block.name}`}
                        >
                          {block.exercises.map(
                            (exerciseEntry, exerciseIndex) => {
                              const exercise =
                                selectedStrengthExercisesById.get(
                                  exerciseEntry.exerciseId
                                )
                              const exerciseName =
                                exercise?.canonicalName ??
                                exerciseEntry.exerciseId

                              return (
                                <li
                                  key={exerciseEntry.id}
                                  className="rounded-md border p-3"
                                >
                                  <div
                                    className="h-2 rounded bg-muted"
                                    aria-label={`Drop before ${exerciseName}`}
                                    onDragOver={(event) => {
                                      event.preventDefault()
                                    }}
                                    onDrop={() => {
                                      if (!draggedEntryId) {
                                        return
                                      }
                                      reorderExerciseInBlock(
                                        block.id,
                                        draggedEntryId,
                                        exerciseEntry.id
                                      )
                                      setDraggedEntryId(null)
                                    }}
                                  />

                                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium">
                                      {exerciseName}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        draggable
                                        aria-label={`Drag ${exerciseName}`}
                                        onDragStart={() =>
                                          setDraggedEntryId(exerciseEntry.id)
                                        }
                                        onDragEnd={() =>
                                          setDraggedEntryId(null)
                                        }
                                      >
                                        Drag
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        aria-label={`Move ${exerciseName} up`}
                                        disabled={exerciseIndex === 0}
                                        onClick={() => {
                                          const targetIndex = Math.max(
                                            0,
                                            exerciseIndex - 1
                                          )
                                          const targetEntry =
                                            block.exercises[targetIndex]
                                          if (!targetEntry) {
                                            return
                                          }
                                          reorderExerciseInBlock(
                                            block.id,
                                            exerciseEntry.id,
                                            targetEntry.id
                                          )
                                        }}
                                      >
                                        Up
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        aria-label={`Move ${exerciseName} down`}
                                        disabled={
                                          exerciseIndex ===
                                          block.exercises.length - 1
                                        }
                                        onClick={() => {
                                          const targetEntry =
                                            block.exercises[exerciseIndex + 1]
                                          if (!targetEntry) {
                                            return
                                          }
                                          reorderExerciseInBlock(
                                            block.id,
                                            exerciseEntry.id,
                                            targetEntry.id
                                          )
                                        }}
                                      >
                                        Down
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        aria-label={`Remove ${exerciseName}`}
                                        onClick={() =>
                                          removeExerciseFromStrengthDraft(
                                            exerciseEntry.exerciseId
                                          )
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-3">
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`exercise-condition-${exerciseEntry.id}`}
                                      >
                                        Condition for {exerciseName}
                                      </Label>
                                      <Input
                                        id={`exercise-condition-${exerciseEntry.id}`}
                                        aria-label={`Condition for ${exerciseName}`}
                                        placeholder="e.g. readiness>=7"
                                        value={exerciseEntry.condition}
                                        onChange={(event) => {
                                          applyDraftUpdate((current) => ({
                                            ...current,
                                            strength: {
                                              ...current.strength,
                                              blocks: ensurePrimaryBlock(
                                                current
                                              ).map((entry) =>
                                                entry.id === block.id
                                                  ? {
                                                      ...entry,
                                                      exercises:
                                                        entry.exercises.map(
                                                          (exerciseNode) =>
                                                            exerciseNode.id ===
                                                            exerciseEntry.id
                                                              ? {
                                                                  ...exerciseNode,
                                                                  condition:
                                                                    event.target
                                                                      .value
                                                                }
                                                              : exerciseNode
                                                        )
                                                    }
                                                  : entry
                                              )
                                            }
                                          }))
                                        }}
                                      />
                                    </div>

                                    {exerciseEntry.sets.map((set, setIndex) => (
                                      <div
                                        key={set.id}
                                        className="grid gap-3 md:grid-cols-2"
                                      >
                                        <div className="space-y-1">
                                          <Label htmlFor={`reps-${set.id}`}>
                                            Reps for {exerciseName} set{" "}
                                            {setIndex + 1}
                                          </Label>
                                          <Input
                                            id={`reps-${set.id}`}
                                            type="number"
                                            min={1}
                                            value={set.reps}
                                            onChange={(event) => {
                                              const nextValue = Number.parseInt(
                                                event.target.value || "1",
                                                10
                                              )
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                reps:
                                                                                  Number.isFinite(
                                                                                    nextValue
                                                                                  ) &&
                                                                                  nextValue >
                                                                                    0
                                                                                    ? nextValue
                                                                                    : 1
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label htmlFor={`load-${set.id}`}>
                                            Load for {exerciseName} set{" "}
                                            {setIndex + 1}
                                          </Label>
                                          <Input
                                            id={`load-${set.id}`}
                                            value={set.load}
                                            onChange={(event) => {
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                load: event
                                                                                  .target
                                                                                  .value
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label htmlFor={`rest-${set.id}`}>
                                            Rest (seconds) for {exerciseName}{" "}
                                            set {setIndex + 1}
                                          </Label>
                                          <Input
                                            id={`rest-${set.id}`}
                                            type="number"
                                            min={0}
                                            value={set.restSeconds}
                                            onChange={(event) => {
                                              const nextValue = Number.parseInt(
                                                event.target.value || "0",
                                                10
                                              )
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                restSeconds:
                                                                                  Number.isFinite(
                                                                                    nextValue
                                                                                  ) &&
                                                                                  nextValue >=
                                                                                    0
                                                                                    ? nextValue
                                                                                    : 0
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label htmlFor={`timer-${set.id}`}>
                                            Timer (seconds) for {exerciseName}{" "}
                                            set {setIndex + 1}
                                          </Label>
                                          <Input
                                            id={`timer-${set.id}`}
                                            type="number"
                                            min={0}
                                            value={set.timerSeconds ?? ""}
                                            onChange={(event) => {
                                              const rawValue =
                                                event.target.value.trim()
                                              const nextValue =
                                                rawValue.length === 0
                                                  ? null
                                                  : Number.parseInt(
                                                      rawValue,
                                                      10
                                                    )
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                timerSeconds:
                                                                                  nextValue !==
                                                                                    null &&
                                                                                  Number.isFinite(
                                                                                    nextValue
                                                                                  ) &&
                                                                                  nextValue >=
                                                                                    0
                                                                                    ? nextValue
                                                                                    : null
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          />
                                        </div>

                                        <div className="space-y-1">
                                          <Label
                                            htmlFor={`progression-${set.id}`}
                                          >
                                            Progression for {exerciseName} set{" "}
                                            {setIndex + 1}
                                          </Label>
                                          <select
                                            id={`progression-${set.id}`}
                                            aria-label={`Progression for ${exerciseName} set ${setIndex + 1}`}
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            value={set.progression.strategy}
                                            onChange={(event) => {
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                progression:
                                                                                  {
                                                                                    ...setNode.progression,
                                                                                    strategy:
                                                                                      event
                                                                                        .target
                                                                                        .value as StrengthProgressionStrategy
                                                                                  }
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          >
                                            <option value="none">none</option>
                                            <option value="linear">
                                              linear
                                            </option>
                                            <option value="double-progression">
                                              double-progression
                                            </option>
                                            <option value="wave">wave</option>
                                            <option value="custom">
                                              custom
                                            </option>
                                          </select>
                                        </div>

                                        <div className="space-y-1">
                                          <Label
                                            htmlFor={`progression-value-${set.id}`}
                                          >
                                            Progression value for {exerciseName}{" "}
                                            set {setIndex + 1}
                                          </Label>
                                          <Input
                                            id={`progression-value-${set.id}`}
                                            aria-label={`Progression value for ${exerciseName} set ${setIndex + 1}`}
                                            placeholder="e.g. +2.5kg/week"
                                            value={set.progression.value}
                                            onChange={(event) => {
                                              applyDraftUpdate((current) => ({
                                                ...current,
                                                strength: {
                                                  ...current.strength,
                                                  blocks: ensurePrimaryBlock(
                                                    current
                                                  ).map((entry) =>
                                                    entry.id === block.id
                                                      ? {
                                                          ...entry,
                                                          exercises:
                                                            entry.exercises.map(
                                                              (exerciseNode) =>
                                                                exerciseNode.id ===
                                                                exerciseEntry.id
                                                                  ? {
                                                                      ...exerciseNode,
                                                                      sets: exerciseNode.sets.map(
                                                                        (
                                                                          setNode
                                                                        ) =>
                                                                          setNode.id ===
                                                                          set.id
                                                                            ? {
                                                                                ...setNode,
                                                                                progression:
                                                                                  {
                                                                                    ...setNode.progression,
                                                                                    value:
                                                                                      event
                                                                                        .target
                                                                                        .value
                                                                                  }
                                                                              }
                                                                            : setNode
                                                                      )
                                                                    }
                                                                  : exerciseNode
                                                            )
                                                        }
                                                      : entry
                                                  )
                                                }
                                              }))
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </li>
                              )
                            }
                          )}
                        </ul>
                      </section>
                    ))}
                  </div>
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
          <RoutineDslEditor
            id="routine-dsl-editor"
            value={dslValue}
            label="Routine DSL editor"
            onChange={(nextValue) => {
              setDslValue(nextValue)
              const diagnostics = analyzeRoutineDsl(nextValue)
              setDslErrors(diagnostics.errors.map((error) => error.message))
              setDslWarnings(
                diagnostics.warnings.map((warning) => warning.message)
              )
              if (!diagnostics.parseResult.ok) {
                return
              }

              commitDraft(diagnostics.parseResult.draft, {
                dslBuffer: nextValue
              })
            }}
          />
          {dslErrors.length > 0 ? (
            <ul role="alert" className="space-y-1 text-sm text-red-700">
              {dslErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          {dslWarnings.length > 0 ? (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">
                Non-blocking safety warnings
              </p>
              <ul
                aria-label="DSL lint warnings"
                className="list-disc space-y-1 pl-4 text-sm text-amber-900"
              >
                {dslWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {dslErrors.length === 0 && dslWarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              DSL is synchronized with visual mode for supported routine fields.
            </p>
          ) : null}

          <section className="space-y-2 rounded-md border bg-muted/30 p-3">
            <h2 className="text-sm font-semibold">DSL primitive reference</h2>
            <ul className="space-y-2">
              {ROUTINE_DSL_PRIMITIVES.map((primitive) => (
                <li key={primitive.primitive} className="space-y-1 text-sm">
                  <p className="font-medium">{primitive.primitive}</p>
                  <p className="text-muted-foreground">
                    {primitive.description}
                  </p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
                    {primitive.example}
                  </pre>
                </li>
              ))}
            </ul>
          </section>
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-medium">UI parity hook preview</h2>
        <p className="text-sm text-muted-foreground">
          Current routine payload exposed for downstream synchronization hooks.
        </p>
        <pre
          aria-label="Routine payload preview"
          className="overflow-x-auto rounded-md bg-muted p-3 text-xs"
        >
          {serializeRoutineDraft(draft)}
        </pre>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-medium">Tracking execution payload</h2>
        <p className="text-sm text-muted-foreground">
          Expanded session contract for downstream execution and logging
          surfaces.
        </p>
        <pre
          aria-label="Tracking execution payload preview"
          className="overflow-x-auto rounded-md bg-muted p-3 text-xs"
        >
          {JSON.stringify(trackingExecutionPayload, null, 2)}
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
    </AppShell>
  )
}
