"use client"

import { useState } from "react"

import { Card } from "@/components/ui/card"
import type { WeeklyAuditChartData } from "@/features/audit/types"

const CHART_HEIGHT = 280
const CHART_WIDTH = 720
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

export function WeeklyAuditChart({ data }: { data: WeeklyAuditChartData }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const days = data.days

  if (days.length !== 7) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold">Weekly Audit Chart</h2>
        <p className="text-sm text-muted-foreground">
          Weekly audit requires exactly 7 days of data.
        </p>
      </Card>
    )
  }

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

  const activeDay = days[activeIndex] ?? days[0]
  const thresholdY = yForScore(RED_ZONE_THRESHOLD)

  return (
    <Card className="space-y-4 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Weekly Audit Chart</h2>
        <p className="text-sm text-muted-foreground">{data.weekLabel}</p>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-auto min-w-[660px]"
          aria-label="Weekly audit chart"
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
            strokeWidth={2.25}
            strokeLinecap="round"
            aria-label="Neural axis series"
          />
          <path
            d={chartGeometry.metabolicLine}
            fill="none"
            stroke={PRIMARY_SERIES_COLORS.metabolic}
            strokeWidth={2.25}
            strokeLinecap="round"
            aria-label="Metabolic axis series"
          />
          <path
            d={chartGeometry.mechanicalLine}
            fill="none"
            stroke={PRIMARY_SERIES_COLORS.mechanical}
            strokeWidth={2.25}
            strokeLinecap="round"
            aria-label="Mechanical axis series"
          />

          {days.map((day, index) => (
            <circle
              key={day.date}
              cx={xForIndex(index)}
              cy={chartGeometry.markerY[index]}
              r={6}
              fill={index === activeIndex ? "#111827" : "#ffffff"}
              stroke="#111827"
              strokeWidth={1.5}
              role="button"
              tabIndex={0}
              aria-label={`${day.dayLabel} day marker`}
              onMouseEnter={() => {
                setActiveIndex(index)
              }}
              onFocus={() => {
                setActiveIndex(index)
              }}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
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

        <div className="text-sm text-red-800">Red zone &gt;= 7.0</div>
      </div>

      <ul
        className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground"
        aria-label="Weekly audit x-axis labels"
      >
        {days.map((day) => (
          <li key={`label-${day.date}`}>{day.dayLabel}</li>
        ))}
      </ul>

      <section
        aria-label="Weekly audit day details"
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
