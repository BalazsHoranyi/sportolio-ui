import type {
  AxisFatigueSeriesPoint,
  AxisFatigueTrendDay,
  AxisFatigueTrendsData,
  AxisFatigueWindow
} from "@/features/axis-fatigue-trends/types"

const MIN_SCORE = 0
const MAX_SCORE = 10

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_SCORE
  }
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, value))
}

function normalizeSeriesPoint(
  point: AxisFatigueSeriesPoint
): AxisFatigueSeriesPoint {
  return {
    neural: clampScore(point.neural),
    metabolic: clampScore(point.metabolic),
    mechanical: clampScore(point.mechanical),
    recruitment: clampScore(point.recruitment)
  }
}

function deriveDayLabel(date: string, dayLabel: string | undefined): string {
  if (dayLabel && dayLabel.trim().length > 0) {
    return dayLabel.trim()
  }

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }

  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC"
  })
}

function normalizeDay(day: AxisFatigueTrendDay): AxisFatigueTrendDay {
  return {
    ...day,
    dayLabel: deriveDayLabel(day.date, day.dayLabel),
    planned: normalizeSeriesPoint(day.planned),
    completed: normalizeSeriesPoint(day.completed)
  }
}

function normalizeWindow(window: AxisFatigueWindow): AxisFatigueWindow {
  return {
    ...window,
    days: window.days
      .map(normalizeDay)
      .sort((left, right) => left.date.localeCompare(right.date))
  }
}

export function normalizeAxisFatigueTrendsData(
  data: AxisFatigueTrendsData
): AxisFatigueTrendsData {
  return {
    ...data,
    windows: data.windows.map(normalizeWindow)
  }
}

export function selectAxisFatigueWindow(
  data: AxisFatigueTrendsData,
  requestedKey: string
): AxisFatigueWindow | undefined {
  const requested = data.windows.find((window) => window.key === requestedKey)
  if (requested) {
    return requested
  }

  if (data.defaultWindowKey) {
    const fallback = data.windows.find(
      (window) => window.key === data.defaultWindowKey
    )
    if (fallback) {
      return fallback
    }
  }

  return data.windows[0]
}
