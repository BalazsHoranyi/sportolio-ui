"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { MonthlyAuditChart } from "@/features/audit/components/monthly-audit-chart"
import { WeeklyAuditChart } from "@/features/audit/components/weekly-audit-chart"
import { PlanningCalendar } from "@/features/planning/components/planning-calendar"
import { buildPlannedAuditReflow } from "@/features/planning/planning-audit-reflow"
import { CycleCreationFlow } from "@/features/planning/components/cycle-creation-flow"
import type {
  PlanningChange,
  PlanningWorkout
} from "@/features/planning/planning-operations"

export function PlanningSurface() {
  const [lastChange, setLastChange] = useState<PlanningChange | null>(null)
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlanningWorkout[]>([])
  const [auditView, setAuditView] = useState<"week" | "month">("week")
  const auditData = useMemo(
    () => buildPlannedAuditReflow(plannedWorkouts),
    [plannedWorkouts]
  )

  return (
    <AppShell
      title="Workout Planning Surface"
      description="Plan workouts in week/month calendar views and emit deterministic recomputation payloads for audit updates."
    >
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

      <Card className="space-y-3 p-4" aria-label="Audit chart view controls">
        <h2 className="text-base font-medium">Audit chart window</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={auditView === "week" ? "default" : "outline"}
            onClick={() => {
              setAuditView("week")
            }}
          >
            Week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={auditView === "month" ? "default" : "outline"}
            onClick={() => {
              setAuditView("month")
            }}
          >
            Month
          </Button>
        </div>
      </Card>

      {auditView === "week" ? (
        <WeeklyAuditChart data={auditData.weekly} />
      ) : (
        <MonthlyAuditChart data={auditData.monthly} />
      )}
    </AppShell>
  )
}
