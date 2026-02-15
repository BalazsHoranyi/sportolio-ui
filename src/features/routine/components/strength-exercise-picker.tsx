"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExerciseSearch } from "@/features/exercises/hooks/use-exercise-search"
import type { Exercise } from "@/features/exercises/types"

type StrengthExercisePickerProps = {
  selectedExerciseIds: string[]
  onSelectExercise: (exercise: Exercise) => void
}

const EQUIPMENT_FILTERS = [
  "barbell",
  "dumbbell",
  "bench",
  "cable",
  "rack"
] as const
const MUSCLE_FILTERS = [
  "quadriceps",
  "glutes",
  "lats",
  "biceps",
  "rhomboids"
] as const

function toggleValue(values: string[], nextValue: string): string[] {
  if (values.includes(nextValue)) {
    return values.filter((value) => value !== nextValue)
  }
  return [...values, nextValue]
}

export function StrengthExercisePicker({
  selectedExerciseIds,
  onSelectExercise
}: StrengthExercisePickerProps) {
  const [query, setQuery] = useState("")
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>([])
  const [muscleFilters, setMuscleFilters] = useState<string[]>([])

  const { items, isLoading, errorMessage } = useExerciseSearch({
    query,
    equipment: equipmentFilters,
    muscles: muscleFilters
  })

  const selectedIdSet = useMemo(
    () => new Set(selectedExerciseIds),
    [selectedExerciseIds]
  )

  return (
    <section className="space-y-4" aria-label="Exercise picker">
      <div className="space-y-2">
        <Label htmlFor="exercise-search-input">Search exercises</Label>
        <Input
          id="exercise-search-input"
          aria-label="Search exercises"
          placeholder="e.g. split squat"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="space-y-2 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">
            Equipment filters
          </legend>
          {EQUIPMENT_FILTERS.map((equipment) => {
            const id = `equipment-${equipment}`
            return (
              <div key={equipment} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  aria-label={`Filter by equipment ${equipment}`}
                  checked={equipmentFilters.includes(equipment)}
                  onCheckedChange={() => {
                    setEquipmentFilters((values) =>
                      toggleValue(values, equipment)
                    )
                  }}
                />
                <Label htmlFor={id} className="capitalize text-sm">
                  {equipment}
                </Label>
              </div>
            )
          })}
        </fieldset>

        <fieldset className="space-y-2 rounded-md border p-3">
          <legend className="px-1 text-sm font-medium">Muscle filters</legend>
          {MUSCLE_FILTERS.map((muscle) => {
            const id = `muscle-${muscle}`
            return (
              <div key={muscle} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  aria-label={`Filter by muscle ${muscle}`}
                  checked={muscleFilters.includes(muscle)}
                  onCheckedChange={() => {
                    setMuscleFilters((values) => toggleValue(values, muscle))
                  }}
                />
                <Label htmlFor={id} className="capitalize text-sm">
                  {muscle}
                </Label>
              </div>
            )
          })}
        </fieldset>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Search results</h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading exercises...</p>
        ) : null}
        {!isLoading && errorMessage ? (
          <p role="alert" className="text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exercises found for the current filters.
          </p>
        ) : null}

        {!errorMessage && items.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Exercise search results"
            className="max-h-80 space-y-2 overflow-y-auto"
          >
            {items.map((exercise) => {
              const isAlreadySelected = selectedIdSet.has(exercise.id)

              return (
                <li
                  key={exercise.id}
                  role="option"
                  aria-disabled={isAlreadySelected}
                  aria-selected={isAlreadySelected}
                  tabIndex={0}
                  onClick={() => {
                    if (!isAlreadySelected) {
                      onSelectExercise(exercise)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      if (!isAlreadySelected) {
                        onSelectExercise(exercise)
                      }
                    }
                  }}
                  className="cursor-pointer rounded-md border p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{exercise.canonicalName}</p>
                      <p className="text-xs text-muted-foreground">
                        Equipment: {exercise.equipment.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Primary muscles: {exercise.primaryMuscles.join(", ")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAlreadySelected}
                    >
                      {isAlreadySelected ? "Added" : "Add"}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
