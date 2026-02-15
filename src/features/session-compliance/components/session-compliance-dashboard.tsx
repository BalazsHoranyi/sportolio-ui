"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AnalyticsMetricGlossary } from "@/features/analytics-glossary/components/analytics-metric-glossary"
import {
  buildSessionComplianceSnapshot,
  normalizeSessionComplianceData,
  selectSessionComplianceWindow
} from "@/features/session-compliance/session-compliance-query"
import type {
  SessionComplianceAdherenceState,
  SessionComplianceData,
  SessionComplianceState
} from "@/features/session-compliance/types"

const CHART_HEIGHT = 300
const CHART_WIDTH = 980
const CHART_PADDING = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 44
}

const ADHERENCE_COLORS: Record<SessionComplianceAdherenceState, string> = {
  green: "bg-emerald-100 text-emerald-900 border-emerald-300",
  yellow: "bg-amber-100 text-amber-900 border-amber-300",
  red: "bg-red-100 text-red-900 border-red-300"
}

function formatPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ")
}

function capitalize(value: string): string {
  return value[0]?.toUpperCase() + value.slice(1).toLowerCase()
}

function renderSessionLinks(
  title: string,
  state: SessionComplianceState,
  sessions: {
    id: string
    label: string
    href: string
    state: SessionComplianceState
  }[]
) {
  const filtered = sessions.filter((session) => session.state === state)
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {filtered.map((session) => (
            <li key={`${state}-${session.id}`}>
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
  )
}

export function SessionComplianceDashboard({
  data
}: {
  data: SessionComplianceData
}) {
  const normalizedData = useMemo(
    () => normalizeSessionComplianceData(data),
    [data]
  )

  const initialWindowKey =
    selectSessionComplianceWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    )?.key ??
    normalizedData.windows[0]?.key ??
    ""

  const [activeWindowKey, setActiveWindowKey] = useState(initialWindowKey)
  const [activePlanBlock, setActivePlanBlock] = useState("all")
  const [activeModality, setActiveModality] = useState("all")
  const [activeTrendIndex, setActiveTrendIndex] = useState(0)

  const activeWindow =
    selectSessionComplianceWindow(normalizedData, activeWindowKey) ??
    normalizedData.windows[0]

  if (!activeWindow) {
    return (
      <AppShell
        title="Session Compliance"
        description="Launch dashboard for planned-vs-completed execution and move/skip audit trends."
        maxWidth="default"
      >
        <Card className="space-y-2 p-4">
          <AnalyticsMetricGlossary dashboardKey="session-compliance" />
          <p className="text-sm text-muted-foreground">
            Session compliance requires at least one data window.
          </p>
        </Card>
      </AppShell>
    )
  }

  const snapshot = buildSessionComplianceSnapshot(normalizedData, {
    windowKey: activeWindow.key,
    planBlock: activePlanBlock,
    modality: activeModality
  })
  const trend = snapshot.trend
  const activeTrendPoint = trend[activeTrendIndex] ?? trend[0]

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const xForIndex = (index: number) =>
    CHART_PADDING.left +
    (trend.length <= 1 ? 0.5 : index / (trend.length - 1)) * plotWidth

  const yForPercent = (value: number) =>
    CHART_PADDING.top + (1 - value / 100) * plotHeight

  const maxEventCount = Math.max(
    1,
    ...trend.flatMap((point) => [point.moveCount, point.skipCount])
  )
  const yForEvents = (value: number) =>
    CHART_PADDING.top + (1 - value / maxEventCount) * plotHeight

  const adherencePath = formatPath(
    trend.map((point, index) => ({
      x: xForIndex(index),
      y: yForPercent(point.adherencePercentage)
    }))
  )
  const movePath = formatPath(
    trend.map((point, index) => ({
      x: xForIndex(index),
      y: yForEvents(point.moveCount)
    }))
  )
  const skipPath = formatPath(
    trend.map((point, index) => ({
      x: xForIndex(index),
      y: yForEvents(point.skipCount)
    }))
  )

  return (
    <AppShell
      title="Session Compliance"
      description="Launch dashboard for planned-vs-completed execution and move/skip audit trends."
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
              size="sm"
              variant={window.key === activeWindow.key ? "default" : "outline"}
              aria-pressed={window.key === activeWindow.key}
              onClick={() => {
                setActiveWindowKey(window.key)
                setActivePlanBlock("all")
                setActiveModality("all")
                setActiveTrendIndex(0)
              }}
            >
              {window.label}
            </Button>
          ))}
        </div>
      }
    >
      <Card className="space-y-4 p-4">
        <AnalyticsMetricGlossary dashboardKey="session-compliance" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{activeWindow.label}</p>
          <Badge className={ADHERENCE_COLORS[snapshot.adherenceState]}>
            Adherence state: {capitalize(snapshot.adherenceState)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan block filter
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activePlanBlock === "all" ? "default" : "outline"}
                aria-label="Plan block all"
                onClick={() => {
                  setActivePlanBlock("all")
                  setActiveTrendIndex(0)
                }}
              >
                All blocks
              </Button>
              {snapshot.availablePlanBlocks.map((planBlock) => (
                <Button
                  key={planBlock}
                  type="button"
                  size="sm"
                  variant={
                    activePlanBlock.toLowerCase() === planBlock.toLowerCase()
                      ? "default"
                      : "outline"
                  }
                  aria-label={`Plan block ${planBlock}`}
                  onClick={() => {
                    setActivePlanBlock(planBlock)
                    setActiveTrendIndex(0)
                  }}
                >
                  {planBlock}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Modality filter
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={activeModality === "all" ? "default" : "outline"}
                aria-label="Modality all"
                onClick={() => {
                  setActiveModality("all")
                  setActiveTrendIndex(0)
                }}
              >
                All modalities
              </Button>
              {snapshot.availableModalities.map((modality) => (
                <Button
                  key={modality}
                  type="button"
                  size="sm"
                  variant={
                    activeModality.toLowerCase() === modality.toLowerCase()
                      ? "default"
                      : "outline"
                  }
                  aria-label={`Modality ${modality}`}
                  onClick={() => {
                    setActiveModality(modality)
                    setActiveTrendIndex(0)
                  }}
                >
                  {modality}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Planned sessions
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {snapshot.plannedCount}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Completed sessions
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {snapshot.completedCount}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Adherence
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {snapshot.adherencePercentage}%
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Move events
            </p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.moveCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Skip events
            </p>
            <p className="mt-1 text-2xl font-semibold">{snapshot.skipCount}</p>
          </div>
        </div>

        {trend.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions match the current filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-auto min-w-[840px]"
                aria-label="Session compliance trend chart"
              >
                <line
                  x1={CHART_PADDING.left}
                  y1={yForPercent(85)}
                  x2={CHART_PADDING.left + plotWidth}
                  y2={yForPercent(85)}
                  stroke="#15803d"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <line
                  x1={CHART_PADDING.left}
                  y1={yForPercent(60)}
                  x2={CHART_PADDING.left + plotWidth}
                  y2={yForPercent(60)}
                  stroke="#ca8a04"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />

                <path
                  d={adherencePath}
                  fill="none"
                  stroke="#0b5fff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  aria-label="Session compliance adherence trend"
                />
                <path
                  d={movePath}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  aria-label="Session compliance move trend"
                />
                <path
                  d={skipPath}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="2 4"
                  aria-label="Session compliance skip trend"
                />

                {trend.map((point, index) => (
                  <circle
                    key={`${point.date}-${index}`}
                    cx={xForIndex(index)}
                    cy={yForPercent(point.adherencePercentage)}
                    r={5}
                    fill={index === activeTrendIndex ? "#111827" : "#ffffff"}
                    stroke="#111827"
                    strokeWidth={1.2}
                    role="button"
                    tabIndex={0}
                    aria-label={`${point.dayLabel} compliance marker`}
                    onMouseEnter={() => {
                      setActiveTrendIndex(index)
                    }}
                    onFocus={() => {
                      setActiveTrendIndex(index)
                    }}
                  />
                ))}
              </svg>
            </div>

            <ul
              className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground"
              aria-label="Session compliance x-axis labels"
            >
              {trend.map((point) => (
                <li key={`label-${point.date}`}>{point.dayLabel}</li>
              ))}
            </ul>
          </>
        )}

        <section
          aria-label="Session compliance day details"
          role="region"
          className="space-y-3 rounded-md border p-3"
        >
          {activeTrendPoint ? (
            <>
              <div>
                <p className="text-sm font-medium">{activeTrendPoint.date}</p>
                <p className="text-xs text-muted-foreground">
                  {activeTrendPoint.plannedCount} planned ·{" "}
                  {activeTrendPoint.completedCount} completed ·{" "}
                  {activeTrendPoint.moveCount} moved ·{" "}
                  {activeTrendPoint.skipCount} skipped
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {renderSessionLinks(
                  "Completed",
                  "completed",
                  activeTrendPoint.sessions
                )}
                {renderSessionLinks(
                  "Moved",
                  "moved",
                  activeTrendPoint.sessions
                )}
                {renderSessionLinks(
                  "Skipped",
                  "skipped",
                  activeTrendPoint.sessions
                )}
                {renderSessionLinks(
                  "Still planned",
                  "planned",
                  activeTrendPoint.sessions
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No day details available for the selected filters.
            </p>
          )}
        </section>
      </Card>
    </AppShell>
  )
}
