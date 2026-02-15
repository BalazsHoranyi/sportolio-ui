"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MuscleMap } from "@/features/muscle-map/components/muscle-map"
import {
  buildCycleWarnings,
  buildInitialCycleDraft,
  parseCycleDraft,
  serializeCycleDraft,
  setMicrocycleCount,
  validateGoalStep,
  validateMesocycleStep,
  validateMicrocycleStep,
  type CycleDraft,
  type CycleGoalDraft,
  type GoalModality,
  type MesocycleStrategy
} from "@/features/planning/cycle-creation"
import { buildMicrocycleMuscleSummaries } from "@/features/planning/microcycle-muscle-summary"
import type { PlanningWorkout } from "@/features/planning/planning-operations"

const DRAFT_STORAGE_KEY = "sportolo.cycle-creation.draft.v1"
const INTERFERENCE_AUDIT_STORAGE_KEY =
  "sportolo.cycle-creation.interference-decisions.v1"

const STEP_NAMES = [
  "Goal & Event Setup",
  "Mesocycle Strategy",
  "Microcycle Details",
  "Review"
] as const

const STRATEGY_OPTIONS: MesocycleStrategy[] = ["block", "dup", "linear"]
const MODALITY_OPTIONS: GoalModality[] = [
  "strength",
  "endurance",
  "cycling",
  "triathlon"
]

function buildDefaultGoal(index: number): CycleGoalDraft {
  return {
    id: `goal-${index}`,
    title: "",
    modality: "strength",
    priority: index,
    eventDate: ""
  }
}

function withSeedGoal(draft: CycleDraft): CycleDraft {
  if (draft.goals.length > 0) {
    return draft
  }

  const goal = buildDefaultGoal(1)
  return {
    ...draft,
    goals: [goal],
    activeGoalId: goal.id
  }
}

function nextGoalIndex(goals: CycleGoalDraft[]): number {
  if (goals.length === 0) {
    return 1
  }

  const maxGoalNumber = goals.reduce((maxValue, goal) => {
    const parsed = Number.parseInt(goal.id.replace("goal-", ""), 10)
    if (Number.isNaN(parsed)) {
      return maxValue
    }
    return Math.max(maxValue, parsed)
  }, 0)

  return maxGoalNumber + 1
}

type CycleCreationFlowProps = {
  plannedWorkouts?: PlanningWorkout[]
}

type InterferenceProceedDecision = {
  recordedAt: string
  proceedAnyway: boolean
  warningMessages: string[]
}

export function CycleCreationFlow({
  plannedWorkouts = []
}: CycleCreationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<CycleDraft>(() =>
    withSeedGoal(buildInitialCycleDraft())
  )
  const [errors, setErrors] = useState<string[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [proceedDecisions, setProceedDecisions] = useState<
    InterferenceProceedDecision[]
  >([])

  const warnings = useMemo(
    () => buildCycleWarnings(draft, plannedWorkouts),
    [draft, plannedWorkouts]
  )
  const microcycleSummaries = useMemo(
    () => buildMicrocycleMuscleSummaries(draft, plannedWorkouts),
    [draft, plannedWorkouts]
  )

  useEffect(() => {
    const persistedValue = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!persistedValue) {
      return
    }

    const parsed = parseCycleDraft(persistedValue)
    if (!parsed) {
      return
    }

    setDraft(withSeedGoal(parsed))
    setStatusMessage("Loaded saved draft")
  }, [])

  useEffect(() => {
    const persistedAudit = localStorage.getItem(INTERFERENCE_AUDIT_STORAGE_KEY)
    if (!persistedAudit) {
      return
    }

    try {
      const parsed = JSON.parse(persistedAudit) as InterferenceProceedDecision[]
      if (!Array.isArray(parsed)) {
        return
      }
      setProceedDecisions(
        parsed.filter(
          (entry) =>
            typeof entry.recordedAt === "string" &&
            typeof entry.proceedAnyway === "boolean" &&
            Array.isArray(entry.warningMessages)
        )
      )
    } catch {
      setProceedDecisions([])
    }
  }, [])

  const setGoalField = <K extends keyof CycleGoalDraft>(
    goalId: string,
    key: K,
    value: CycleGoalDraft[K]
  ) => {
    setDraft((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId ? { ...goal, [key]: value } : goal
      )
    }))
  }

  const addGoal = () => {
    setDraft((current) => {
      const goal = buildDefaultGoal(nextGoalIndex(current.goals))
      return {
        ...current,
        goals: [...current.goals, goal]
      }
    })
  }

  const removeGoal = (goalId: string) => {
    setDraft((current) => {
      if (current.goals.length <= 1) {
        return current
      }

      const nextGoals = current.goals.filter((goal) => goal.id !== goalId)
      return {
        ...current,
        goals: nextGoals,
        activeGoalId:
          current.activeGoalId === goalId
            ? (nextGoals[0]?.id ?? null)
            : current.activeGoalId
      }
    })
  }

  const updateStrategy = (strategy: MesocycleStrategy) => {
    setDraft((current) => ({
      ...current,
      mesocycle: {
        ...current.mesocycle,
        strategy
      }
    }))
  }

  const validateStep = (index: number): string[] => {
    if (index === 0) {
      return validateGoalStep(draft)
    }
    if (index === 1) {
      return validateMesocycleStep(draft)
    }
    if (index === 2) {
      return validateMicrocycleStep(draft)
    }
    return []
  }

  const goNext = () => {
    const stepErrors = validateStep(stepIndex)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors([])
    setStepIndex((current) => Math.min(current + 1, STEP_NAMES.length - 1))
  }

  const goBack = () => {
    setErrors([])
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  const saveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeCycleDraft(draft))
    setStatusMessage("Draft saved")
  }

  const recordProceedDecision = (nextProceedAnyway: boolean) => {
    if (warnings.length === 0) {
      return
    }

    const nextDecision: InterferenceProceedDecision = {
      recordedAt: new Date().toISOString(),
      proceedAnyway: nextProceedAnyway,
      warningMessages: warnings.map((warning) => warning.message)
    }

    setProceedDecisions((current) => {
      const next = [nextDecision, ...current].slice(0, 20)
      localStorage.setItem(INTERFERENCE_AUDIT_STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setStatusMessage("Decision recorded")
  }

  return (
    <Card className="space-y-4 p-4" aria-label="Cycle creation flow">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Cycle Creation Flow</h2>
          <p className="text-sm text-muted-foreground">
            Build macro, mesocycle, and microcycle plans in a guided wizard.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={saveDraft}>
          Save draft
        </Button>
      </header>

      {statusMessage ? (
        <p className="text-sm font-medium text-emerald-700">{statusMessage}</p>
      ) : null}

      <div className="flex flex-wrap gap-2" aria-label="Cycle creation steps">
        {STEP_NAMES.map((name, index) => (
          <Badge
            key={name}
            className={
              index === stepIndex
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }
          >
            {index + 1}. {name}
          </Badge>
        ))}
      </div>

      {errors.length > 0 ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3"
        >
          <p className="text-sm font-medium text-red-700">Fix these issues:</p>
          <ul className="list-disc pl-5 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {stepIndex === 0 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Goal & Event Setup</h3>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="macro-start-date">Macro cycle start date</Label>
            <Input
              id="macro-start-date"
              type="date"
              value={draft.macroStartDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  macroStartDate: event.target.value
                }))
              }
            />
          </div>

          <div className="space-y-3">
            {draft.goals.map((goal) => (
              <Card key={goal.id} className="space-y-3 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`goal-title-${goal.id}`}>
                      Goal title {goal.id}
                    </Label>
                    <Input
                      id={`goal-title-${goal.id}`}
                      aria-label={`Goal title ${goal.id}`}
                      value={goal.title}
                      onChange={(event) =>
                        setGoalField(goal.id, "title", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`goal-modality-${goal.id}`}>
                      Goal modality {goal.id}
                    </Label>
                    <select
                      id={`goal-modality-${goal.id}`}
                      aria-label={`Goal modality ${goal.id}`}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={goal.modality}
                      onChange={(event) =>
                        setGoalField(
                          goal.id,
                          "modality",
                          event.target.value as GoalModality
                        )
                      }
                    >
                      {MODALITY_OPTIONS.map((modality) => (
                        <option key={modality} value={modality}>
                          {modality}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`goal-priority-${goal.id}`}>
                      Goal priority {goal.id}
                    </Label>
                    <Input
                      id={`goal-priority-${goal.id}`}
                      aria-label={`Goal priority ${goal.id}`}
                      type="number"
                      min={1}
                      value={goal.priority}
                      onChange={(event) =>
                        setGoalField(
                          goal.id,
                          "priority",
                          Number.parseInt(event.target.value || "0", 10)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`goal-event-date-${goal.id}`}>
                      Goal event date {goal.id}
                    </Label>
                    <Input
                      id={`goal-event-date-${goal.id}`}
                      aria-label={`Goal event date ${goal.id}`}
                      type="date"
                      value={goal.eventDate}
                      onChange={(event) =>
                        setGoalField(goal.id, "eventDate", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      id={`active-goal-${goal.id}`}
                      aria-label={`Active goal ${goal.id}`}
                      type="radio"
                      name="active-goal"
                      checked={draft.activeGoalId === goal.id}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          activeGoalId: goal.id
                        }))
                      }
                    />
                    <Label htmlFor={`active-goal-${goal.id}`}>
                      Active goal {goal.id}
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeGoal(goal.id)}
                    disabled={draft.goals.length <= 1}
                  >
                    Remove {goal.id}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addGoal}>
            Add goal
          </Button>
        </section>
      ) : null}

      {stepIndex === 1 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Mesocycle Strategy</h3>

          <div className="space-y-2">
            {STRATEGY_OPTIONS.map((strategy) => (
              <div key={strategy} className="flex items-center gap-2">
                <input
                  id={`strategy-${strategy}`}
                  aria-label={`Strategy ${strategy}`}
                  type="radio"
                  name="mesocycle-strategy"
                  checked={draft.mesocycle.strategy === strategy}
                  onChange={() => updateStrategy(strategy)}
                />
                <Label htmlFor={`strategy-${strategy}`}>
                  Strategy {strategy}
                </Label>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="focus-share">Focus share</Label>
              <Input
                id="focus-share"
                type="number"
                step={0.01}
                value={draft.mesocycle.focusShare}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    mesocycle: {
                      ...current.mesocycle,
                      focusShare: Number.parseFloat(event.target.value || "0")
                    }
                  }))
                }
              />
            </div>

            {draft.mesocycle.strategy === "block" ? (
              <div className="space-y-2">
                <Label htmlFor="block-size">Block size</Label>
                <Input
                  id="block-size"
                  aria-label="Block size"
                  type="number"
                  min={1}
                  value={draft.mesocycle.blockSize}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      mesocycle: {
                        ...current.mesocycle,
                        blockSize: Number.parseInt(
                          event.target.value || "0",
                          10
                        )
                      }
                    }))
                  }
                />
              </div>
            ) : null}

            {draft.mesocycle.strategy === "dup" ? (
              <div className="space-y-2">
                <Label htmlFor="rotation-offset">Rotation offset</Label>
                <Input
                  id="rotation-offset"
                  type="number"
                  min={0}
                  value={draft.mesocycle.rotationOffset}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      mesocycle: {
                        ...current.mesocycle,
                        rotationOffset: Number.parseInt(
                          event.target.value || "0",
                          10
                        )
                      }
                    }))
                  }
                />
              </div>
            ) : null}

            {draft.mesocycle.strategy === "linear" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-share">Start share</Label>
                  <Input
                    id="start-share"
                    type="number"
                    step={0.01}
                    value={draft.mesocycle.startShare}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        mesocycle: {
                          ...current.mesocycle,
                          startShare: Number.parseFloat(
                            event.target.value || "0"
                          )
                        }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-share">End share</Label>
                  <Input
                    id="end-share"
                    type="number"
                    step={0.01}
                    value={draft.mesocycle.endShare}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        mesocycle: {
                          ...current.mesocycle,
                          endShare: Number.parseFloat(event.target.value || "0")
                        }
                      }))
                    }
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {stepIndex === 2 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Microcycle Details</h3>

          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="microcycle-count">Microcycle count</Label>
            <Input
              id="microcycle-count"
              aria-label="Microcycle count"
              type="number"
              min={1}
              value={draft.microcycleCount}
              onChange={(event) => {
                const nextCount = Number.parseInt(event.target.value || "1", 10)
                setDraft((current) => setMicrocycleCount(current, nextCount))
              }}
            />
          </div>

          <div className="space-y-3">
            {draft.microcycles.map((microcycle) => (
              <Card
                key={microcycle.id}
                className="grid gap-3 p-3 md:grid-cols-3"
              >
                <div className="space-y-2">
                  <Label htmlFor={`microcycle-label-${microcycle.id}`}>
                    Label {microcycle.id}
                  </Label>
                  <Input
                    id={`microcycle-label-${microcycle.id}`}
                    value={microcycle.label}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        microcycles: current.microcycles.map((entry) =>
                          entry.id === microcycle.id
                            ? { ...entry, label: event.target.value }
                            : entry
                        )
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`focus-${microcycle.id}`}>
                    Focus {microcycle.id}
                  </Label>
                  <select
                    id={`focus-${microcycle.id}`}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={microcycle.focus}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        microcycles: current.microcycles.map((entry) =>
                          entry.id === microcycle.id
                            ? {
                                ...entry,
                                focus: event.target.value as GoalModality
                              }
                            : entry
                        )
                      }))
                    }
                  >
                    {MODALITY_OPTIONS.map((modality) => (
                      <option key={modality} value={modality}>
                        {modality}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`key-sessions-${microcycle.id}`}>
                    Key sessions {microcycle.id}
                  </Label>
                  <Input
                    id={`key-sessions-${microcycle.id}`}
                    aria-label={`Key sessions ${microcycle.id}`}
                    type="number"
                    min={0}
                    value={microcycle.keySessions}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        microcycles: current.microcycles.map((entry) =>
                          entry.id === microcycle.id
                            ? {
                                ...entry,
                                keySessions: Number.parseInt(
                                  event.target.value || "0",
                                  10
                                )
                              }
                            : entry
                        )
                      }))
                    }
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {stepIndex === 3 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Review</h3>

          <Card className="space-y-2 p-3">
            <p className="text-sm font-medium">Goals</p>
            <ul className="list-disc pl-5 text-sm">
              {draft.goals
                .slice()
                .sort((left, right) => left.priority - right.priority)
                .map((goal) => (
                  <li key={goal.id}>
                    {goal.title || goal.id} ({goal.modality}) - priority{" "}
                    {goal.priority}
                  </li>
                ))}
            </ul>
          </Card>

          {warnings.length > 0 ? (
            <Card className="space-y-2 border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">
                Soft warnings
              </p>
              <ul className="space-y-2 text-sm text-amber-900">
                {warnings.map((warning) => (
                  <li key={`${warning.code}-${warning.message}`}>
                    <p>{warning.message}</p>
                    {warning.alternatives.map((alternative) => (
                      <p key={alternative}>Alternative: {alternative}</p>
                    ))}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="proceed-anyway"
                  checked={draft.proceedAnyway}
                  onCheckedChange={(checked) => {
                    const nextProceedAnyway = checked === true
                    setDraft((current) => ({
                      ...current,
                      proceedAnyway: nextProceedAnyway
                    }))
                    recordProceedDecision(nextProceedAnyway)
                  }}
                />
                <Label htmlFor="proceed-anyway">Proceed anyway</Label>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              No soft warnings detected for this draft.
            </p>
          )}

          {proceedDecisions.length > 0 ? (
            <Card
              className="space-y-2 border-slate-200 bg-slate-50 p-3"
              aria-label="Proceed decisions"
            >
              <p className="text-sm font-medium text-slate-800">
                Proceed decisions
              </p>
              <ul className="space-y-2 text-sm text-slate-900">
                {proceedDecisions.map((decision) => (
                  <li key={`${decision.recordedAt}-${decision.proceedAnyway}`}>
                    <p>
                      {decision.proceedAnyway
                        ? "Proceed anyway selected"
                        : "Proceed anyway cleared"}{" "}
                      ({new Date(decision.recordedAt).toLocaleString()})
                    </p>
                    <p className="text-slate-600">
                      Captured warnings: {decision.warningMessages.length}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <section
            className="space-y-3"
            aria-label="Microcycle muscle summaries"
          >
            <h4 className="text-base font-semibold">
              Microcycle muscle-map summary
            </h4>
            <p className="text-sm text-muted-foreground">
              Summary updates when planner workouts are added, moved, or
              removed.
            </p>

            {microcycleSummaries.map((summary) => (
              <Card
                key={summary.microcycleId}
                aria-label={`${summary.microcycleId} muscle summary`}
                className="space-y-3 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {summary.label} ({summary.microcycleId})
                  </p>
                  {summary.hasHighOverlap ? (
                    <Badge className="border-amber-300 bg-amber-100 text-amber-900">
                      High overlap
                    </Badge>
                  ) : null}
                </div>

                {summary.hasHighOverlap && summary.highOverlapBodyPart ? (
                  <p className="text-sm text-amber-900">
                    Visual warning: high overlap on{" "}
                    {summary.highOverlapBodyPart}.
                  </p>
                ) : null}

                <MuscleMap
                  title={`${summary.label} Muscle Map`}
                  contributions={summary.totals}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Drill-down</p>
                  {summary.workouts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No planned workouts mapped to this microcycle yet.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {summary.workouts.map((workout) => (
                        <li key={workout.workoutId}>
                          <a
                            href={`#planner-workout-${workout.workoutId}`}
                            className="font-medium underline underline-offset-2"
                          >
                            {workout.title}
                          </a>
                          {workout.exerciseNames.length > 0 ? (
                            <p className="text-muted-foreground">
                              Exercises: {workout.exerciseNames.join(", ")}
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              Exercises: no matched catalog exercise.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ))}
          </section>
        </section>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : null}
        </div>
        <div>
          {stepIndex === 0 ? (
            <Button type="button" onClick={goNext}>
              Next: Mesocycle
            </Button>
          ) : null}
          {stepIndex === 1 ? (
            <Button type="button" onClick={goNext}>
              Next: Microcycles
            </Button>
          ) : null}
          {stepIndex === 2 ? (
            <Button type="button" onClick={goNext}>
              Next: Review
            </Button>
          ) : null}
        </div>
      </footer>
    </Card>
  )
}
