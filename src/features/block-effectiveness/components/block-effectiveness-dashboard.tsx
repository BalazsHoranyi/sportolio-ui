"use client"

import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  buildBlockEffectivenessSnapshot,
  normalizeBlockEffectivenessData,
  selectBlockEffectivenessWindow
} from "@/features/block-effectiveness/block-effectiveness-query"
import type {
  BlockDataQualityFlag,
  BlockEffectivenessData
} from "@/features/block-effectiveness/types"

const DATA_QUALITY_LABELS: Record<BlockDataQualityFlag, string> = {
  ok: "Reliable data",
  sparse: "Sparse data",
  "low-quality": "Low-quality data"
}

const DATA_QUALITY_STYLES: Record<BlockDataQualityFlag, string> = {
  ok: "bg-emerald-100 text-emerald-900 border-emerald-300",
  sparse: "bg-amber-100 text-amber-900 border-amber-300",
  "low-quality": "bg-red-100 text-red-900 border-red-300"
}

function formatSignedPercentage(value: number): string {
  const prefix = value > 0 ? "+" : ""
  return `${prefix}${value.toFixed(1)}%`
}

function formatValue(value: number, unit: string): string {
  if (unit.toLowerCase() === "w" || unit.toLowerCase() === "kg") {
    return `${Math.round(value)} ${unit}`
  }
  return `${value.toFixed(2)} ${unit}`
}

function formatConfidencePercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function BlockEffectivenessDashboard({
  data
}: {
  data: BlockEffectivenessData
}) {
  const normalizedData = useMemo(
    () => normalizeBlockEffectivenessData(data),
    [data]
  )

  const initialWindow =
    selectBlockEffectivenessWindow(
      normalizedData,
      normalizedData.defaultWindowKey ?? ""
    ) ?? normalizedData.windows[0]

  const [activeWindowKey, setActiveWindowKey] = useState(
    initialWindow?.key ?? ""
  )
  const [activeBlockKey, setActiveBlockKey] = useState(
    initialWindow?.blocks[0]?.key ?? ""
  )
  const [activeMetricKey, setActiveMetricKey] = useState(
    initialWindow?.blocks[0]?.metrics[0]?.key ?? ""
  )

  const snapshot = buildBlockEffectivenessSnapshot(normalizedData, {
    windowKey: activeWindowKey,
    blockKey: activeBlockKey,
    metricKey: activeMetricKey
  })

  const activeWindow = snapshot.window
  const activeBlockSummary = snapshot.activeBlockSummary
  const activeMetric = snapshot.activeMetric

  if (!activeWindow) {
    return (
      <AppShell
        title="Block Effectiveness"
        description="Launch dashboard for mesocycle block targets versus realized outcomes."
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Block effectiveness requires at least one data window.
          </p>
        </Card>
      </AppShell>
    )
  }

  if (!activeBlockSummary) {
    return (
      <AppShell
        title="Block Effectiveness"
        description="Launch dashboard for mesocycle block targets versus realized outcomes."
      >
        <Card className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            No block data is available for the selected window.
          </p>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Block Effectiveness"
      description="Launch dashboard for mesocycle block targets versus realized outcomes."
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
                setActiveBlockKey(window.blocks[0]?.key ?? "")
                setActiveMetricKey(window.blocks[0]?.metrics[0]?.key ?? "")
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
          <Badge
            className={DATA_QUALITY_STYLES[activeBlockSummary.dataQualityFlag]}
          >
            {DATA_QUALITY_LABELS[activeBlockSummary.dataQualityFlag]}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Block selector
          </p>
          <div className="flex flex-wrap gap-2">
            {snapshot.blockSummaries.map((summary) => (
              <Button
                key={summary.block.key}
                type="button"
                size="sm"
                variant={
                  summary.block.key === activeBlockSummary.block.key
                    ? "default"
                    : "outline"
                }
                aria-label={`Block ${summary.block.label}`}
                onClick={() => {
                  setActiveBlockKey(summary.block.key)
                  setActiveMetricKey(summary.block.metrics[0]?.key ?? "")
                }}
              >
                {summary.block.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Block effectiveness index
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {activeBlockSummary.effectivenessIndex.toFixed(1)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Average delta
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {formatSignedPercentage(
                activeBlockSummary.averageDeltaPercentage
              )}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Data confidence
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {DATA_QUALITY_LABELS[activeBlockSummary.dataQualityFlag]}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatConfidencePercent(activeBlockSummary.averageConfidence)}{" "}
              avg confidence
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[720px] text-sm"
            aria-label="Block effectiveness metrics"
          >
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Metric</th>
                <th className="py-2 pr-3">Objective type</th>
                <th className="py-2 pr-3">Target</th>
                <th className="py-2 pr-3">Realized</th>
                <th className="py-2 pr-3">Delta</th>
                <th className="py-2 pr-3">Confidence</th>
                <th className="py-2">Drill-down</th>
              </tr>
            </thead>
            <tbody>
              {activeBlockSummary.block.metrics.map((metric) => (
                <tr key={metric.key} className="border-b align-top">
                  <td className="py-3 pr-3 font-medium">{metric.label}</td>
                  <td className="py-3 pr-3 capitalize">
                    {metric.objectiveType}
                  </td>
                  <td className="py-3 pr-3">
                    {formatValue(metric.targetValue, metric.unit)}
                  </td>
                  <td className="py-3 pr-3">
                    {formatValue(metric.realizedValue, metric.unit)}
                  </td>
                  <td className="py-3 pr-3">
                    {formatSignedPercentage(metric.deltaPercentage)}
                  </td>
                  <td className="py-3 pr-3">
                    {formatConfidencePercent(metric.confidence)}
                  </td>
                  <td className="py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        activeMetric?.key === metric.key ? "default" : "outline"
                      }
                      aria-label={`View contributors for ${metric.label}`}
                      onClick={() => {
                        setActiveMetricKey(metric.key)
                      }}
                    >
                      View contributors
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card
          role="region"
          aria-label="Block delta contributors"
          className="space-y-3 border-dashed p-3"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {activeMetric?.label ?? "No metric selected"}
            </p>
            <p className="text-xs text-muted-foreground">
              Sessions driving delta outcomes for the selected objective.
            </p>
          </div>

          {!activeMetric || activeMetric.contributors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contributing sessions for this metric.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {activeMetric.contributors.map((session) => (
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
        </Card>
      </Card>
    </AppShell>
  )
}
