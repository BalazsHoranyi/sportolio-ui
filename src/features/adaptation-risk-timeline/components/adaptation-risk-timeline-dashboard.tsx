"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  normalizeAdaptationRiskTimelineData,
  resolveRiskZone,
  selectAdaptationRiskWindow
} from "@/features/adaptation-risk-timeline/adaptation-risk-timeline-query"
import type { AdaptationRiskTimelineData } from "@/features/adaptation-risk-timeline/types"

const CHART_HEIGHT = 320
const CHART_WIDTH = 980
const CHART_PADDING = {
  top: 20,
  right: 18,
  bottom: 38,
  left: 44
}
const MIN_SCORE = 0
const MAX_SCORE = 10
const YELLOW_THRESHOLD = 5
const RED_THRESHOLD = 7

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ")
}

function formatScore(score: number | undefined): string {
  if (score == null || Number.isNaN(score)) {
    return "0.0"
  }
  return score.toFixed(1)
}

export function AdaptationRiskTimelineDashboard({
  data
}: {
  data: AdaptationRiskTimelineData
}) {
  const normalizedData = useMemo(
    () => normalizeAdaptationRiskTimelineData(data),
    [data]
  )

  const initialWindowKey =
    selectAdaptationRiskWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    )?.key ??
    normalizedData.windows[0]?.key ??
    ""

  const [activeWindowKey, setActiveWindowKey] = useState(initialWindowKey)
  const [activePointIndex, setActivePointIndex] = useState(0)

  const activeWindow =
    selectAdaptationRiskWindow(normalizedData, activeWindowKey) ??
    normalizedData.windows[0]

  if (!activeWindow) {
    return (
      <AppShell
        title="Adaptation Risk Timeline"
        description="Launch dashboard for identifying high-risk adaptation windows over time."
        maxWidth="default"
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Adaptation risk timeline requires at least one data window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const points = activeWindow.points
  if (points.length === 0) {
    return (
      <AppShell
        title="Adaptation Risk Timeline"
        description="Launch dashboard for identifying high-risk adaptation windows over time."
        maxWidth="default"
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Adaptation risk timeline requires at least one point in the selected
            window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const xForIndex = (index: number) =>
    CHART_PADDING.left +
    (points.length === 1 ? 0.5 : index / (points.length - 1)) * plotWidth

  const yForScore = (score: number) => {
    const normalized =
      (clamp(score, MIN_SCORE, MAX_SCORE) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)
    return CHART_PADDING.top + (1 - normalized) * plotHeight
  }

  const gatedRiskPoints = points.map((point, index) => ({
    x: xForIndex(index),
    y: yForScore(point.gatedRiskScore ?? 0)
  }))
  const linePath = formatPath(gatedRiskPoints)

  const thresholdFiveY = yForScore(YELLOW_THRESHOLD)
  const thresholdSevenY = yForScore(RED_THRESHOLD)
  const zoneTop = yForScore(MAX_SCORE)
  const zoneBottom = yForScore(MIN_SCORE)

  const activePoint = points[activePointIndex] ?? points[0]
  const activeScore = activePoint.gatedRiskScore ?? 0
  const activeZone = resolveRiskZone(activeScore)

  return (
    <AppShell
      title="Adaptation Risk Timeline"
      description="Launch dashboard for identifying high-risk adaptation windows over time."
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
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{activeWindow.label}</p>
          <h2 className="text-lg font-semibold">
            Combined fatigue adaptation risk
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Green &lt; 5.0
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Yellow 5.0 - 6.9
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Red &gt;= 7.0
          </span>
        </div>

        <div className="w-full">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-auto w-full"
            aria-label="Adaptation risk timeline chart"
          >
            <rect
              x={CHART_PADDING.left}
              y={thresholdFiveY}
              width={plotWidth}
              height={zoneBottom - thresholdFiveY}
              fill="#10b981"
              fillOpacity={0.14}
              aria-label="Green risk zone band"
            />
            <rect
              x={CHART_PADDING.left}
              y={thresholdSevenY}
              width={plotWidth}
              height={thresholdFiveY - thresholdSevenY}
              fill="#f59e0b"
              fillOpacity={0.18}
              aria-label="Yellow risk zone band"
            />
            <rect
              x={CHART_PADDING.left}
              y={zoneTop}
              width={plotWidth}
              height={thresholdSevenY - zoneTop}
              fill="#ef4444"
              fillOpacity={0.16}
              aria-label="Red risk zone band"
            />

            <line
              x1={CHART_PADDING.left}
              y1={thresholdFiveY}
              x2={CHART_PADDING.left + plotWidth}
              y2={thresholdFiveY}
              stroke="#a16207"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              aria-label="Yellow threshold at 5.0"
            />
            <line
              x1={CHART_PADDING.left}
              y1={thresholdSevenY}
              x2={CHART_PADDING.left + plotWidth}
              y2={thresholdSevenY}
              stroke="#991b1b"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              aria-label="Red threshold at 7.0"
            />

            <path
              d={linePath}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth={2.4}
              strokeLinecap="round"
              aria-label="Gated risk score series"
            />

            {points.map((point, index) => (
              <circle
                key={`${point.date}-${index}`}
                cx={xForIndex(index)}
                cy={yForScore(point.gatedRiskScore ?? 0)}
                r={points.length > 12 ? 3.5 : 5}
                fill={index === activePointIndex ? "#111827" : "#ffffff"}
                stroke="#111827"
                strokeWidth={1.2}
                role="button"
                tabIndex={0}
                aria-label={`${point.dayLabel ?? point.date} risk marker`}
                onMouseEnter={() => {
                  setActivePointIndex(index)
                }}
                onFocus={() => {
                  setActivePointIndex(index)
                }}
              />
            ))}
          </svg>
        </div>

        <ul
          className="grid gap-2 text-center text-xs text-muted-foreground"
          style={{
            gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`
          }}
          aria-label="Adaptation risk x-axis labels"
        >
          {points.map((point) => (
            <li key={`label-${point.date}`}>{point.dayLabel}</li>
          ))}
        </ul>

        <section
          aria-label="Risk point details"
          role="region"
          className="rounded-md border p-3"
        >
          <p className="text-sm font-medium">{activePoint.date}</p>
          <p className="mt-1 text-sm">
            Gated risk score:{" "}
            <span className="font-semibold">{formatScore(activeScore)}</span> (
            {activeZone})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Why this risk point
          </p>

          {activePoint.contributors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No contributors available for this point.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {activePoint.contributors.map((session) => (
                <li key={session.id}>
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
        </section>
      </Card>
    </AppShell>
  )
}
