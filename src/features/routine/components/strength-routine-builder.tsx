"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WeeklyAuditChart } from "@/features/audit/components/weekly-audit-chart"
import { weeklyAuditPreviewData } from "@/features/audit/weekly-audit-preview"
import { MuscleMap } from "@/features/muscle-map/components/muscle-map"
import {
  buildMicrocycleMuscleUsagePayload,
  buildRoutineMuscleUsagePayload
} from "@/features/muscle-map/payload-preview"
import { StrengthExercisePicker } from "@/features/routine/components/strength-exercise-picker"
import type { Exercise } from "@/features/exercises/types"

export function StrengthRoutineBuilder() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const routineSummary = buildRoutineMuscleUsagePayload(
    "routine-preview",
    selectedExercises
  )
  const microcycleSummary = buildMicrocycleMuscleUsagePayload(
    "microcycle-preview",
    [routineSummary]
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Strength Routine Builder
        </h1>
        <p className="text-sm text-muted-foreground">
          Search, filter, and add exercises to bind canonical metadata into your
          workout model.
        </p>
      </header>

      <Card className="p-4">
        <StrengthExercisePicker
          selectedExerciseIds={selectedExercises.map((exercise) => exercise.id)}
          onSelectExercise={(exercise) => {
            setSelectedExercises((current) => [...current, exercise])
          }}
        />
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Workout Model Preview</h2>
        <ul aria-label="Selected exercises" className="space-y-2">
          {selectedExercises.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No exercises selected.
            </li>
          ) : (
            selectedExercises.map((exercise) => (
              <li key={exercise.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{exercise.canonicalName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exercise.equipment.map((item) => (
                        <Badge key={`${exercise.id}-${item}`}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExercises((current) =>
                        current.filter((entry) => entry.id !== exercise.id)
                      )
                    }}
                    aria-label={`Remove ${exercise.canonicalName}`}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <section className="space-y-4" aria-label="Muscle maps">
        <h2 className="text-lg font-medium">Exercise Muscle Maps</h2>

        {routineSummary.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add exercises to populate the exercise, routine, and microcycle
            muscle maps.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {routineSummary.exercises.map((exerciseSummary) => (
              <MuscleMap
                key={exerciseSummary.exercise_id}
                title={`${exerciseSummary.exercise_name} Muscle Map`}
                contributions={exerciseSummary.contributions}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MuscleMap
          title="Routine Muscle Map"
          contributions={routineSummary.totals}
        />
        <MuscleMap
          title="Microcycle Muscle Map"
          contributions={microcycleSummary.totals}
        />
      </div>

      <WeeklyAuditChart data={weeklyAuditPreviewData} />
    </main>
  )
}
