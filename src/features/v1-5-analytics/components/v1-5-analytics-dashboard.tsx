"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  buildV15AnalyticsSnapshot,
  normalizeV15AnalyticsData,
  selectV15AnalyticsWindow
} from "@/features/v1-5-analytics/v1-5-analytics-query"
import type {
  CoachPortfolioStatus,
  InterferenceSeverity,
  MonotonyRiskBand,
  RecoveryTrajectoryDirection,
  V15AnalyticsData
} from "@/features/v1-5-analytics/types"

const STATUS_STYLES: Record<CoachPortfolioStatus, string> = {
  stable: "bg-emerald-100 text-emerald-900 border-emerald-300",
  watch: "bg-amber-100 text-amber-900 border-amber-300",
  critical: "bg-red-100 text-red-900 border-red-300"
}

const STATUS_LABELS: Record<CoachPortfolioStatus, string> = {
  stable: "Stable",
  watch: "Watch",
  critical: "Critical"
}

const CONFLICT_LABELS: Record<InterferenceSeverity, string> = {
  low: "Low conflict",
  medium: "Medium conflict",
  high: "High conflict"
}

const RISK_LABELS: Record<MonotonyRiskBand, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High"
}

const TRAJECTORY_LABELS: Record<RecoveryTrajectoryDirection, string> = {
  up: "Upward",
  flat: "Flat",
  down: "Downward"
}

function formatMass(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} kg`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatSigned(value: number): string {
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${value.toFixed(1)}`
}

function formatScore(value: number): string {
  return `${Math.round(value)}`
}

export function V15AnalyticsDashboard({ data }: { data: V15AnalyticsData }) {
  const normalizedData = useMemo(() => normalizeV15AnalyticsData(data), [data])

  const initialWindow =
    selectV15AnalyticsWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    ) ?? normalizedData.windows[0]

  const [activeWindowKey, setActiveWindowKey] = useState(
    initialWindow?.key ?? ""
  )

  const snapshot = buildV15AnalyticsSnapshot(normalizedData, {
    windowKey: activeWindowKey
  })

  return (
    <AppShell
      title="v1.5 Analytics Pack"
      description="Advanced analytics for performance optimization and risk management."
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
              variant={
                window.key === snapshot.window?.key ? "default" : "outline"
              }
              aria-pressed={window.key === snapshot.window?.key}
              onClick={() => {
                setActiveWindowKey(window.key)
              }}
            >
              {window.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="text-xl font-semibold">Strength Progress</h2>
          {snapshot.strength.liftSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No strength sessions in this window.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total volume load
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatMass(snapshot.strength.totalVolumeLoad)}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    PR events
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {snapshot.strength.prEvents.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Low intensity</p>
                  <p className="text-lg font-semibold">
                    {formatPercent(snapshot.strength.intensityDistribution.low)}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">
                    Moderate intensity
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPercent(
                      snapshot.strength.intensityDistribution.moderate
                    )}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">
                    High intensity
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPercent(
                      snapshot.strength.intensityDistribution.high
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {snapshot.strength.liftSummaries.map((lift) => (
                  <div
                    key={lift.lift}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{lift.lift}</span>
                    <span className="text-muted-foreground">
                      e1RM {lift.latestE1rm.toFixed(1)} kg (
                      {formatSigned(lift.trendDelta)})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-xl font-semibold">Interference Audit</h2>
          {snapshot.interference.conflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No overlap conflicts detected.
            </p>
          ) : (
            <div className="space-y-2">
              {snapshot.interference.conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="space-y-1 rounded-md border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{conflict.regionPair}</p>
                    <Badge>{CONFLICT_LABELS[conflict.severity]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overlap score: {formatPercent(conflict.overlapScore * 100)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-xl font-semibold">Recovery IO</h2>
          {snapshot.recovery.pairs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recovery data in this window.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Alignment score
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatScore(snapshot.recovery.alignmentScore)}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Trajectory
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {TRAJECTORY_LABELS[snapshot.recovery.trajectoryDirection]}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                {snapshot.recovery.pairs.map((pair) => (
                  <div
                    key={pair.date}
                    className="grid grid-cols-3 rounded-md border px-3 py-2"
                  >
                    <span>{pair.date}</span>
                    <span className="text-muted-foreground">
                      Input {pair.inputScore.toFixed(2)}
                    </span>
                    <span className="text-right">
                      Output {pair.nextDayOutputScore.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-xl font-semibold">Monotony / Strain</h2>
          {snapshot.monotonyStrain.weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No weekly load history available.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {snapshot.monotonyStrain.weeks.map((week) => (
                <div
                  key={week.weekKey}
                  className="grid grid-cols-4 items-center rounded-md border px-3 py-2"
                >
                  <span className="font-medium">{week.weekKey}</span>
                  <span>Monotony {week.monotony.toFixed(2)}</span>
                  <span>Strain {week.strain.toFixed(1)}</span>
                  <span className="text-right">
                    {RISK_LABELS[week.riskBand]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">Coach Portfolio</h2>
          {snapshot.coachPortfolio.athletes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No athlete exceptions in scope.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {snapshot.coachPortfolio.athletes.map((athlete) => (
                <div
                  key={athlete.athleteId}
                  className="grid grid-cols-5 items-center gap-2 rounded-md border px-3 py-2"
                >
                  <span className="col-span-2 font-medium">
                    {athlete.athleteName}
                  </span>
                  <span className="text-muted-foreground">
                    Exceptions {athlete.exceptionScore}
                  </span>
                  <span className="text-muted-foreground">
                    High-risk {athlete.highRiskDays}
                  </span>
                  <div className="flex justify-end">
                    <Badge className={STATUS_STYLES[athlete.status]}>
                      {STATUS_LABELS[athlete.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
