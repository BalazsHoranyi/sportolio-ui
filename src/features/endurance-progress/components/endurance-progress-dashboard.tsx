"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  buildEnduranceProgressSnapshot,
  classifyConfidenceBand,
  normalizeEnduranceProgressData,
  selectEnduranceProgressWindow
} from "@/features/endurance-progress/endurance-progress-query"
import type { EnduranceProgressData } from "@/features/endurance-progress/types"

const CHART_HEIGHT = 300
const CHART_WIDTH = 980
const CHART_PADDING = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 44
}

function capitalize(value: string): string {
  return value[0]?.toUpperCase() + value.slice(1).toLowerCase()
}

function formatPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ")
}

function zoneLabel(zone: string): string {
  return zone.toUpperCase()
}

function formatThresholdValue(value: number, unit: string): string {
  if (unit.toLowerCase() === "w") {
    return `${Math.round(value)} ${unit}`
  }
  return `${value.toFixed(2)} ${unit}`
}

function confidenceSummary(confidence: number): string {
  const percent = Math.round(confidence * 100)
  const band = capitalize(classifyConfidenceBand(confidence))
  return `${percent}% (${band})`
}

export function EnduranceProgressDashboard({
  data
}: {
  data: EnduranceProgressData
}) {
  const normalizedData = useMemo(
    () => normalizeEnduranceProgressData(data),
    [data]
  )

  const initialWindow =
    selectEnduranceProgressWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    ) ?? normalizedData.windows[0]
  const initialWindowKey = initialWindow?.key ?? ""
  const initialMetricKey = initialWindow?.thresholdMetrics[0]?.key ?? ""

  const [activeWindowKey, setActiveWindowKey] = useState(initialWindowKey)
  const [activeMetricKey, setActiveMetricKey] = useState(initialMetricKey)
  const [activePointIndex, setActivePointIndex] = useState(0)

  const snapshot = buildEnduranceProgressSnapshot(normalizedData, {
    windowKey: activeWindowKey,
    metricKey: activeMetricKey
  })
  const activeWindow = snapshot.window
  const activeMetric = snapshot.metric

  if (!activeWindow) {
    return (
      <AppShell
        title="Endurance Progress"
        description="Launch dashboard for zone distribution and threshold trend monitoring."
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Endurance progress requires at least one data window.
          </p>
        </Card>
      </AppShell>
    )
  }

  if (!activeMetric || activeMetric.points.length === 0) {
    return (
      <AppShell
        title="Endurance Progress"
        description="Launch dashboard for zone distribution and threshold trend monitoring."
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Endurance progress requires at least one threshold trend point in
            the selected window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const points = activeMetric.points
  const activePoint = points[activePointIndex] ?? points[0]

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const xForIndex = (index: number) =>
    CHART_PADDING.left +
    (points.length <= 1 ? 0.5 : index / (points.length - 1)) * plotWidth

  const rawMin = Math.min(...points.map((point) => point.value))
  const rawMax = Math.max(...points.map((point) => point.value))
  const spreadPadding =
    rawMax === rawMin ? Math.max(1, rawMax * 0.05) : (rawMax - rawMin) * 0.12
  const minValue = rawMin - spreadPadding
  const maxValue = rawMax + spreadPadding

  const yForValue = (value: number) =>
    CHART_PADDING.top +
    ((maxValue - value) / (maxValue - minValue)) * plotHeight

  const trendPath = formatPath(
    points.map((point, index) => ({
      x: xForIndex(index),
      y: yForValue(point.value)
    }))
  )

  return (
    <AppShell
      title="Endurance Progress"
      description="Launch dashboard for zone distribution and threshold trend monitoring."
      headerContent={
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Window selector"
        >
          {normalizedData.windows.map((window) => (
            <Button
              key={window.key}
              type="button"
              size="sm"
              variant={window.key === activeWindow.key ? "default" : "outline"}
              aria-pressed={window.key === activeWindow.key}
              onClick={() => {
                setActiveWindowKey(window.key)
                setActiveMetricKey(window.thresholdMetrics[0]?.key ?? "")
                setActivePointIndex(0)
              }}
            >
              {window.label}
            </Button>
          ))}
        </div>
      }
    >
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{activeWindow.label}</p>
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total zone minutes
            </p>
            <p className="text-xl font-semibold">{snapshot.totalZoneMinutes}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Threshold metric
          </p>
          <div className="flex flex-wrap gap-2">
            {activeWindow.thresholdMetrics.map((metric) => (
              <Button
                key={metric.key}
                type="button"
                size="sm"
                variant={
                  metric.key === activeMetric.key ? "default" : "outline"
                }
                aria-pressed={metric.key === activeMetric.key}
                onClick={() => {
                  setActiveMetricKey(metric.key)
                  setActivePointIndex(0)
                }}
              >
                {metric.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {snapshot.zoneDistribution.map((entry) => (
            <div key={entry.zone} className="rounded-md border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {zoneLabel(entry.zone)}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {entry.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.minutes} min
              </p>
            </div>
          ))}
        </div>

        <div className="w-full">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-auto w-full"
            aria-label="Endurance threshold trend chart"
          >
            <path
              d={trendPath}
              fill="none"
              stroke="#0f766e"
              strokeWidth={2.4}
              strokeLinecap="round"
              aria-label={`${activeMetric.label} trend series`}
            />

            {points.map((point, index) => (
              <circle
                key={`${point.date}-${index}`}
                cx={xForIndex(index)}
                cy={yForValue(point.value)}
                r={points.length > 12 ? 3.5 : 5}
                fill={index === activePointIndex ? "#0f172a" : "#ffffff"}
                stroke="#0f172a"
                strokeWidth={1.1}
                role="button"
                tabIndex={0}
                aria-label={`${point.dayLabel} trend point`}
                onMouseEnter={() => {
                  setActivePointIndex(index)
                }}
                onFocus={() => {
                  setActivePointIndex(index)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setActivePointIndex(index)
                  }
                }}
              />
            ))}
          </svg>
        </div>

        <Card
          className="space-y-3 border-dashed p-3"
          role="region"
          aria-label="Threshold point details"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{activePoint.date}</p>
            <p className="text-sm text-muted-foreground">
              {formatThresholdValue(activePoint.value, activeMetric.unit)}
            </p>
          </div>

          {activePoint.inferred ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inferred source confidence
              </p>
              <p className="text-sm">
                {confidenceSummary(activePoint.confidence)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Direct source measurement
            </p>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Contributing sessions</h3>
            {activePoint.contributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contributing sessions for this point.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {activePoint.contributors.map((session) => (
                  <li key={session.id}>
                    <a
                      href={session.href}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {session.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </Card>
    </AppShell>
  )
}
