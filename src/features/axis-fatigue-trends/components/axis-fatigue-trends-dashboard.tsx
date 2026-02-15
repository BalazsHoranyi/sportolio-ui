"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getAuditSeriesStyle,
  normalizeAuditSeriesState
} from "@/features/audit/chart-style-contract"
import {
  normalizeAxisFatigueTrendsData,
  selectAxisFatigueWindow
} from "@/features/axis-fatigue-trends/axis-fatigue-trends-query"
import type {
  AxisFatigueSeriesPoint,
  AxisFatigueTrendDay,
  AxisFatigueTrendsData
} from "@/features/axis-fatigue-trends/types"

const CHART_HEIGHT = 320
const CHART_WIDTH = 980
const CHART_PADDING = {
  top: 20,
  right: 18,
  bottom: 38,
  left: 44
}
const MAX_SCORE = 10
const MIN_SCORE = 0
const RED_ZONE_THRESHOLD = 7
const RECRUITMENT_BAND_WIDTH = 0.35

const AXIS_COLORS = {
  neural: "#0b5fff",
  metabolic: "#0f8f5f",
  mechanical: "#bd5b00"
} as const

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ")
}

function getPointSeries(
  days: AxisFatigueTrendDay[],
  getSeriesPoint: (day: AxisFatigueTrendDay) => AxisFatigueSeriesPoint,
  key: keyof AxisFatigueSeriesPoint,
  xForIndex: (index: number) => number,
  yForScore: (score: number) => number
) {
  return days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(getSeriesPoint(day)[key])
  }))
}

export function AxisFatigueTrendsDashboard({
  data
}: {
  data: AxisFatigueTrendsData
}) {
  const normalizedData = useMemo(
    () => normalizeAxisFatigueTrendsData(data),
    [data]
  )

  const initialWindowKey =
    selectAxisFatigueWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    )?.key ??
    normalizedData.windows[0]?.key ??
    ""

  const [activeWindowKey, setActiveWindowKey] = useState(initialWindowKey)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const activeWindow =
    selectAxisFatigueWindow(normalizedData, activeWindowKey) ??
    normalizedData.windows[0]

  if (!activeWindow) {
    return (
      <AppShell
        title="Axis Fatigue Trends"
        description="Launch dashboard for axis trend visibility across planned and completed workloads."
        maxWidth="default"
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Axis fatigue trends require at least one data window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const days = activeWindow.days
  if (days.length === 0) {
    return (
      <AppShell
        title="Axis Fatigue Trends"
        description="Launch dashboard for axis trend visibility across planned and completed workloads."
        maxWidth="default"
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Axis fatigue trends require at least one day in the selected window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const xForIndex = (index: number) =>
    CHART_PADDING.left +
    (days.length === 1 ? 0.5 : index / (days.length - 1)) * plotWidth

  const yForScore = (score: number) => {
    const normalized =
      (clamp(score, MIN_SCORE, MAX_SCORE) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)
    return CHART_PADDING.top + (1 - normalized) * plotHeight
  }

  const completedStyle = getAuditSeriesStyle(
    normalizeAuditSeriesState("completed")
  )
  const plannedStyle = getAuditSeriesStyle(normalizeAuditSeriesState("planned"))

  const completedNeuralPoints = getPointSeries(
    days,
    (day) => day.completed,
    "neural",
    xForIndex,
    yForScore
  )
  const completedMetabolicPoints = getPointSeries(
    days,
    (day) => day.completed,
    "metabolic",
    xForIndex,
    yForScore
  )
  const completedMechanicalPoints = getPointSeries(
    days,
    (day) => day.completed,
    "mechanical",
    xForIndex,
    yForScore
  )

  const plannedNeuralPoints = getPointSeries(
    days,
    (day) => day.planned,
    "neural",
    xForIndex,
    yForScore
  )
  const plannedMetabolicPoints = getPointSeries(
    days,
    (day) => day.planned,
    "metabolic",
    xForIndex,
    yForScore
  )
  const plannedMechanicalPoints = getPointSeries(
    days,
    (day) => day.planned,
    "mechanical",
    xForIndex,
    yForScore
  )

  const completedRecruitmentUpper = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.completed.recruitment + RECRUITMENT_BAND_WIDTH)
  }))
  const completedRecruitmentLower = [...days]
    .reverse()
    .map((day, reverseIndex) => {
      const index = days.length - 1 - reverseIndex
      return {
        x: xForIndex(index),
        y: yForScore(day.completed.recruitment - RECRUITMENT_BAND_WIDTH)
      }
    })
  const plannedRecruitmentPoints = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.planned.recruitment)
  }))

  const chartGeometry = {
    completedNeuralLine: formatPath(completedNeuralPoints),
    completedMetabolicLine: formatPath(completedMetabolicPoints),
    completedMechanicalLine: formatPath(completedMechanicalPoints),
    plannedNeuralLine: formatPath(plannedNeuralPoints),
    plannedMetabolicLine: formatPath(plannedMetabolicPoints),
    plannedMechanicalLine: formatPath(plannedMechanicalPoints),
    completedRecruitmentArea: `${formatPath(completedRecruitmentUpper)} ${formatPath(
      completedRecruitmentLower
    )} Z`,
    plannedRecruitmentLine: formatPath(plannedRecruitmentPoints),
    markerY: completedNeuralPoints.map((point) => point.y)
  }

  const activeDay = days[activeDayIndex] ?? days[0]
  const thresholdY = yForScore(RED_ZONE_THRESHOLD)

  return (
    <AppShell
      title="Axis Fatigue Trends"
      description="Launch dashboard for axis trend visibility across planned and completed workloads."
      maxWidth="default"
      headerContent={
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Window selector"
        >
          {normalizedData.windows.map((window) => (
            <Button
              key={window.key}
              type="button"
              variant={window.key === activeWindow.key ? "default" : "outline"}
              size="sm"
              aria-pressed={window.key === activeWindow.key}
              onClick={() => {
                setActiveWindowKey(window.key)
                setActiveDayIndex(0)
              }}
            >
              {window.label}
            </Button>
          ))}
        </div>
      }
    >
      <Card className="space-y-4 p-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{activeWindow.label}</p>
          <h2 className="text-lg font-semibold">
            Planned vs completed axis trends
          </h2>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-auto min-w-[840px]"
            aria-label="Axis fatigue trends chart"
          >
            <rect
              x={CHART_PADDING.left}
              y={yForScore(MAX_SCORE)}
              width={plotWidth}
              height={thresholdY - yForScore(MAX_SCORE)}
              fill="#ef4444"
              fillOpacity={0.13}
              aria-label="Red zone area"
            />
            <line
              x1={CHART_PADDING.left}
              y1={thresholdY}
              x2={CHART_PADDING.left + plotWidth}
              y2={thresholdY}
              stroke="#b91c1c"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              aria-label="Red zone threshold at 7.0"
            />

            <path
              d={chartGeometry.completedRecruitmentArea}
              fill="#14b8a6"
              fillOpacity={0.2}
              stroke="#0f766e"
              strokeWidth={1}
              aria-label="Completed recruitment overlay band"
            />
            <path
              d={chartGeometry.plannedRecruitmentLine}
              fill="none"
              stroke="#0f766e"
              strokeWidth={1.75}
              strokeDasharray={plannedStyle.strokeDasharray}
              aria-label="Planned recruitment overlay line"
            />

            <path
              d={chartGeometry.completedNeuralLine}
              fill="none"
              stroke={AXIS_COLORS.neural}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeDasharray={completedStyle.strokeDasharray}
              aria-label="Completed neural axis series"
            />
            <path
              d={chartGeometry.plannedNeuralLine}
              fill="none"
              stroke={AXIS_COLORS.neural}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={plannedStyle.strokeDasharray}
              aria-label="Planned neural axis series"
            />

            <path
              d={chartGeometry.completedMetabolicLine}
              fill="none"
              stroke={AXIS_COLORS.metabolic}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeDasharray={completedStyle.strokeDasharray}
              aria-label="Completed metabolic axis series"
            />
            <path
              d={chartGeometry.plannedMetabolicLine}
              fill="none"
              stroke={AXIS_COLORS.metabolic}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={plannedStyle.strokeDasharray}
              aria-label="Planned metabolic axis series"
            />

            <path
              d={chartGeometry.completedMechanicalLine}
              fill="none"
              stroke={AXIS_COLORS.mechanical}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeDasharray={completedStyle.strokeDasharray}
              aria-label="Completed mechanical axis series"
            />
            <path
              d={chartGeometry.plannedMechanicalLine}
              fill="none"
              stroke={AXIS_COLORS.mechanical}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={plannedStyle.strokeDasharray}
              aria-label="Planned mechanical axis series"
            />

            {days.map((day, index) => (
              <circle
                key={`${day.date}-${index}`}
                cx={xForIndex(index)}
                cy={chartGeometry.markerY[index]}
                r={days.length > 10 ? 3 : 5}
                fill={index === activeDayIndex ? "#111827" : "#ffffff"}
                stroke="#111827"
                strokeWidth={1.2}
                role="button"
                tabIndex={0}
                aria-label={`${day.dayLabel ?? day.date} day marker`}
                onMouseEnter={() => {
                  setActiveDayIndex(index)
                }}
                onFocus={() => {
                  setActiveDayIndex(index)
                }}
              />
            ))}
          </svg>
        </div>

        <ul
          className="grid gap-2 text-center text-xs text-muted-foreground"
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`
          }}
          aria-label="Axis fatigue x-axis labels"
        >
          {days.map((day) => (
            <li key={`label-${day.date}`}>{day.dayLabel}</li>
          ))}
        </ul>

        <section
          aria-label="Axis fatigue day details"
          role="region"
          className="rounded-md border p-3"
        >
          <p className="text-sm font-medium">{activeDay.date}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Contributing sessions
          </p>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium">Completed sessions</h3>
              {activeDay.completedSessions.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No completed sessions for this day.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {activeDay.completedSessions.map((session) => (
                    <li key={`completed-${session.id}`}>
                      <a
                        className="text-primary underline-offset-2 hover:underline"
                        href={session.href}
                      >
                        {session.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium">Planned sessions</h3>
              {activeDay.plannedSessions.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No planned sessions for this day.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {activeDay.plannedSessions.map((session) => (
                    <li key={`planned-${session.id}`}>
                      <a
                        className="text-primary underline-offset-2 hover:underline"
                        href={session.href}
                      >
                        {session.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </Card>
    </AppShell>
  )
}
