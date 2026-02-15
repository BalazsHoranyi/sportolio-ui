"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { StrengthExercisePicker } from "@/features/routine/components/strength-exercise-picker"
import type { Exercise } from "@/features/exercises/types"

export function StrengthRoutineBuilder() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])

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
                <p className="font-medium">{exercise.canonicalName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {exercise.equipment.map((item) => (
                    <Badge key={`${exercise.id}-${item}`}>{item}</Badge>
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </main>
  )
}
