"use client"

import { useMemo, useState } from "react"

import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg
} from "@fullcalendar/core"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  addWorkout,
  moveWorkout,
  removeWorkout,
  type PlanningChange,
  type PlanningWorkout
} from "@/features/planning/planning-operations"

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const DEFAULT_WORKOUTS: PlanningWorkout[] = [
  {
    id: "w-1",
    title: "Back Squat",
    start: "2026-02-17T09:00:00.000Z",
    end: "2026-02-17T10:00:00.000Z"
  },
  {
    id: "w-2",
    title: "Tempo Run",
    start: "2026-02-19T07:00:00.000Z",
    end: "2026-02-19T08:00:00.000Z"
  }
]

type PlanningCalendarProps = {
  initialWorkouts?: PlanningWorkout[]
  onPlanningChange?: (change: PlanningChange) => void
}

type CalendarViewMode = "week" | "month"

function toIsoString(value: Date): string {
  return value.toISOString()
}

function toDateTimeInputValue(isoString: string): string {
  const date = new Date(isoString)
  const localTimestamp = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
  return localTimestamp.toISOString().slice(0, 16)
}

function parseDateTimeInput(value: string): string | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function buildMovedTimingByOneDay(workout: PlanningWorkout) {
  const start = new Date(workout.start)
  const end = new Date(workout.end)

  return {
    start: toIsoString(new Date(start.getTime() + ONE_DAY_MS)),
    end: toIsoString(new Date(end.getTime() + ONE_DAY_MS))
  }
}

export function PlanningCalendar({
  initialWorkouts = DEFAULT_WORKOUTS,
  onPlanningChange
}: PlanningCalendarProps) {
  const [workouts, setWorkouts] = useState<PlanningWorkout[]>(initialWorkouts)
  const [nextWorkoutIndex, setNextWorkoutIndex] = useState(
    initialWorkouts.length + 1
  )
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week")
  const [titleInput, setTitleInput] = useState("")
  const [startInput, setStartInput] = useState<string>(
    toDateTimeInputValue("2026-02-18T06:30:00.000Z")
  )
  const [endInput, setEndInput] = useState<string>(
    toDateTimeInputValue("2026-02-18T07:15:00.000Z")
  )

  const calendarEvents = useMemo(
    () =>
      workouts.map((workout) => ({
        id: workout.id,
        title: workout.title,
        start: workout.start,
        end: workout.end
      })),
    [workouts]
  )

  const emitChange = (change: PlanningChange) => {
    onPlanningChange?.(change)
  }

  const handleAddWorkout = () => {
    const title = titleInput.trim()
    if (!title) {
      return
    }

    const start = parseDateTimeInput(startInput)
    const end = parseDateTimeInput(endInput)
    if (!start || !end) {
      return
    }
    if (new Date(end).getTime() <= new Date(start).getTime()) {
      return
    }

    const id = `w-${nextWorkoutIndex}`
    const result = addWorkout(workouts, {
      id,
      title,
      start,
      end
    })
    setWorkouts(result.workouts)
    emitChange(result.change)
    setTitleInput("")
    setNextWorkoutIndex((current) => current + 1)
  }

  const handleMoveWorkoutForwardByDay = (workout: PlanningWorkout) => {
    const result = moveWorkout(
      workouts,
      workout.id,
      buildMovedTimingByOneDay(workout),
      "controls"
    )
    setWorkouts(result.workouts)
    emitChange(result.change)
  }

  const handleRemoveWorkout = (
    workoutId: string,
    source: "controls" | "calendar"
  ) => {
    const result = removeWorkout(workouts, workoutId, source)
    setWorkouts(result.workouts)
    emitChange(result.change)
  }

  const handleCalendarDrop = (dropInfo: EventDropArg) => {
    if (!dropInfo.event.start || !dropInfo.event.end) {
      return
    }

    try {
      const result = moveWorkout(
        workouts,
        dropInfo.event.id,
        {
          start: toIsoString(dropInfo.event.start),
          end: toIsoString(dropInfo.event.end)
        },
        "calendar"
      )
      setWorkouts(result.workouts)
      emitChange(result.change)
    } catch (error) {
      dropInfo.revert()
      throw error
    }
  }

  const handleCalendarSelect = (selectionInfo: DateSelectArg) => {
    const nextTitle = `Workout ${nextWorkoutIndex}`
    const result = addWorkout(
      workouts,
      {
        id: `w-${nextWorkoutIndex}`,
        title: nextTitle,
        start: toIsoString(selectionInfo.start),
        end: toIsoString(selectionInfo.end)
      },
      "calendar"
    )

    setWorkouts(result.workouts)
    setNextWorkoutIndex((current) => current + 1)
    emitChange(result.change)
    selectionInfo.view.calendar.unselect()
  }

  const handleCalendarEventClick = (eventInfo: EventClickArg) => {
    handleRemoveWorkout(eventInfo.event.id, "calendar")
  }

  return (
    <section className="space-y-4" aria-label="Planning calendar">
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Planning Calendar</h1>
          <div
            role="group"
            aria-label="Calendar view mode"
            className="flex gap-2"
          >
            <Button
              type="button"
              variant={viewMode === "week" ? "default" : "outline"}
              aria-pressed={viewMode === "week"}
              onClick={() => setViewMode("week")}
            >
              Week view
            </Button>
            <Button
              type="button"
              variant={viewMode === "month" ? "default" : "outline"}
              aria-pressed={viewMode === "month"}
              onClick={() => setViewMode("month")}
            >
              Month view
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="planner-workout-title">Workout title</Label>
            <Input
              id="planner-workout-title"
              aria-label="Workout title"
              placeholder="e.g. Recovery Ride"
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planner-workout-start">Workout start</Label>
            <Input
              id="planner-workout-start"
              aria-label="Workout start"
              type="datetime-local"
              value={startInput}
              onChange={(event) => setStartInput(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="planner-workout-end">Workout end</Label>
            <Input
              id="planner-workout-end"
              aria-label="Workout end"
              type="datetime-local"
              value={endInput}
              onChange={(event) => setEndInput(event.target.value)}
            />
          </div>
        </div>

        <Button type="button" onClick={handleAddWorkout}>
          Add workout
        </Button>
      </Card>

      <Card className="p-4">
        <FullCalendar
          key={viewMode}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMode === "week" ? "timeGridWeek" : "dayGridMonth"}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: ""
          }}
          height="auto"
          editable
          selectable
          events={calendarEvents}
          eventDrop={handleCalendarDrop}
          select={handleCalendarSelect}
          eventClick={handleCalendarEventClick}
        />
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-base font-medium">Planned workouts</h2>
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workouts scheduled.
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Planned workouts list">
            {workouts.map((workout) => (
              <li
                key={workout.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{workout.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(workout.start).toLocaleString()} -{" "}
                    {new Date(workout.end).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveWorkoutForwardByDay(workout)}
                    aria-label={`Move ${workout.title} +1 day`}
                  >
                    Move +1 day
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveWorkout(workout.id, "controls")}
                    aria-label={`Remove ${workout.title}`}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
