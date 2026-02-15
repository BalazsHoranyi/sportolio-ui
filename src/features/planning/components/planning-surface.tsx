"use client"

import { useState } from "react"

import { Card } from "@/components/ui/card"
import { WeeklyAuditChart } from "@/features/audit/components/weekly-audit-chart"
import { weeklyAuditPreviewData } from "@/features/audit/weekly-audit-preview"
import { PlanningCalendar } from "@/features/planning/components/planning-calendar"
import { CycleCreationFlow } from "@/features/planning/components/cycle-creation-flow"
import type {
  PlanningChange,
  PlanningWorkout
} from "@/features/planning/planning-operations"

export function PlanningSurface() {
  const [lastChange, setLastChange] = useState<PlanningChange | null>(null)
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlanningWorkout[]>([])

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Workout Planning Surface
        </h1>
        <p className="text-sm text-muted-foreground">
          Plan workouts in week/month calendar views and emit deterministic
          recomputation payloads for audit updates.
        </p>
      </header>

      <PlanningCalendar
        onPlanningChange={setLastChange}
        onWorkoutsChange={setPlannedWorkouts}
      />

      <CycleCreationFlow plannedWorkouts={plannedWorkouts} />

      <Card className="space-y-3 p-4" aria-label="Audit recompute payload">
        <h2 className="text-base font-medium">
          Latest audit recompute payload
        </h2>
        {lastChange ? (
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(lastChange, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            No planner updates yet. Add, move, or remove a workout to emit a
            recompute payload.
          </p>
        )}
      </Card>

      <WeeklyAuditChart data={weeklyAuditPreviewData} />
    </main>
  )
}
