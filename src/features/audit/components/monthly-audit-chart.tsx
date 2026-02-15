"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AUDIT_SERIES_STATE_LEGEND,
  getAuditSeriesStyle,
  normalizeAuditSeriesState
} from "@/features/audit/chart-style-contract"
import type { MonthlyAuditChartData } from "@/features/audit/types"

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

const PRIMARY_SERIES_COLORS = {
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

export function MonthlyAuditChart({ data }: { data: MonthlyAuditChartData }) {
  const [activeWindowIndex, setActiveWindowIndex] = useState(0)
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const hasInvalidWindowSize = data.windows.some(
    (window) => window.days.length !== 30
  )
  if (hasInvalidWindowSize) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold">Month Audit View</h2>
        <p className="text-sm text-muted-foreground">
          Month audit requires exactly 30 days of data per window.
        </p>
      </Card>
    )
  }

  const activeWindow = data.windows[activeWindowIndex]
  if (!activeWindow) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold">Month Audit View</h2>
        <p className="text-sm text-muted-foreground">
          Month audit requires at least one available month window.
        </p>
      </Card>
    )
  }

  const days = activeWindow.days
  const seriesState = normalizeAuditSeriesState(activeWindow.seriesState)
  const seriesStyle = getAuditSeriesStyle(seriesState)

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

  const xForIndex = (index: number) =>
    CHART_PADDING.left + (index / (days.length - 1)) * plotWidth
  const yForScore = (score: number) => {
    const normalized =
      (clamp(score, MIN_SCORE, MAX_SCORE) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)
    return CHART_PADDING.top + (1 - normalized) * plotHeight
  }

  const neuralPoints = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.neural)
  }))
  const metabolicPoints = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.metabolic)
  }))
  const mechanicalPoints = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.mechanical)
  }))
  const recruitmentUpper = days.map((day, index) => ({
    x: xForIndex(index),
    y: yForScore(day.recruitment + RECRUITMENT_BAND_WIDTH)
  }))
  const recruitmentLower = [...days].reverse().map((day, reverseIndex) => {
    const index = days.length - 1 - reverseIndex
    return {
      x: xForIndex(index),
      y: yForScore(day.recruitment - RECRUITMENT_BAND_WIDTH)
    }
  })
  const chartGeometry = {
    neuralLine: formatPath(neuralPoints),
    metabolicLine: formatPath(metabolicPoints),
    mechanicalLine: formatPath(mechanicalPoints),
    recruitmentArea: `${formatPath(recruitmentUpper)} ${formatPath(
      recruitmentLower
    )} Z`,
    markerY: neuralPoints.map((point) => point.y)
  }

  const activeDay = days[activeDayIndex] ?? days[0]
  const thresholdY = yForScore(RED_ZONE_THRESHOLD)

  const onPreviousWindow = () => {
    setActiveWindowIndex((current) => Math.max(0, current - 1))
    setActiveDayIndex(0)
  }

  const onNextWindow = () => {
    setActiveWindowIndex((current) =>
      Math.min(data.windows.length - 1, current + 1)
    )
    setActiveDayIndex(0)
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Month Audit View</h2>
          <p className="text-sm text-muted-foreground">
            {activeWindow.monthLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous month window"
            onClick={onPreviousWindow}
            disabled={activeWindowIndex === 0}
          >
            Previous month window
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next month window"
            onClick={onNextWindow}
            disabled={activeWindowIndex === data.windows.length - 1}
          >
            Next month window
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto min-w-[840px]"
          aria-label="Monthly audit chart"
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
            d={chartGeometry.recruitmentArea}
            fill="#14b8a6"
            fillOpacity={0.22}
            stroke="#0f766e"
            strokeWidth={1}
            aria-label="Recruitment overlay band"
          />

          <path
            d={chartGeometry.neuralLine}
            fill="none"
            stroke={PRIMARY_SERIES_COLORS.neural}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={seriesStyle.strokeDasharray}
            aria-label="Neural axis series"
          />
          <path
            d={chartGeometry.metabolicLine}
            fill="none"
            stroke={PRIMARY_SERIES_COLORS.metabolic}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={seriesStyle.strokeDasharray}
            aria-label="Metabolic axis series"
          />
          <path
            d={chartGeometry.mechanicalLine}
            fill="none"
            stroke={PRIMARY_SERIES_COLORS.mechanical}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={seriesStyle.strokeDasharray}
            aria-label="Mechanical axis series"
          />

          {days.map((day, index) => (
            <circle
              key={day.date}
              cx={xForIndex(index)}
              cy={chartGeometry.markerY[index]}
              r={4}
              fill={index === activeDayIndex ? "#111827" : "#ffffff"}
              stroke="#111827"
              strokeWidth={1.2}
              role="button"
              tabIndex={0}
              aria-label={`${day.dayLabel} day marker`}
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

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <ul
            className="flex flex-wrap gap-3 text-sm"
            aria-label="Primary axis legend"
          >
            <li className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PRIMARY_SERIES_COLORS.neural }}
              />
              Neural
            </li>
            <li className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PRIMARY_SERIES_COLORS.metabolic }}
              />
              Metabolic
            </li>
            <li className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PRIMARY_SERIES_COLORS.mechanical }}
              />
              Mechanical
            </li>
          </ul>

          <ul
            className="flex flex-wrap gap-3 text-sm text-muted-foreground"
            aria-label="Series state legend"
          >
            {AUDIT_SERIES_STATE_LEGEND.map((item) => {
              const style = getAuditSeriesStyle(item.state)
              return (
                <li key={item.state} className="inline-flex items-center gap-2">
                  <svg
                    viewBox="0 0 24 8"
                    className="h-2 w-6"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <line
                      x1={0}
                      y1={4}
                      x2={24}
                      y2={4}
                      stroke="#111827"
                      strokeWidth={2}
                      strokeDasharray={style.strokeDasharray}
                      strokeLinecap="round"
                    />
                  </svg>
                  {item.label}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-1 text-right text-sm text-red-800">
          <p>Red zone &gt;= 7.0</p>
          <p className="text-xs text-muted-foreground">
            Viewing {seriesState} series
          </p>
        </div>
      </div>

      <ul
        className="grid grid-cols-10 gap-2 text-center text-xs text-muted-foreground"
        aria-label="Monthly audit x-axis labels"
      >
        {days.map((day) => (
          <li key={`label-${day.date}`}>{day.dayLabel}</li>
        ))}
      </ul>

      <section
        aria-label="Monthly audit day details"
        role="region"
        className="rounded-md border p-3"
      >
        <p className="text-sm font-medium">{activeDay.date}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Explainability links
        </p>

        {activeDay.sessions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No contributing sessions for this day.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {activeDay.sessions.map((session) => (
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
  )
}
