import type {
  AdaptationRiskPoint,
  AdaptationRiskTimelineData,
  AdaptationRiskWindow,
  AdaptationRiskZone
} from "@/features/adaptation-risk-timeline/types"

const MIN_SCORE = 0
const MAX_SCORE = 10
const YELLOW_THRESHOLD = 5
const RED_THRESHOLD = 7

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_SCORE
  }
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, value))
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

function normalizePoint(point: AdaptationRiskPoint): AdaptationRiskPoint {
  const combinedFatigueScore = clampScore(point.combinedFatigueScore)
  const systemCapacityGate = Number.isFinite(point.systemCapacityGate)
    ? point.systemCapacityGate
    : 1

  return {
    ...point,
    dayLabel: deriveDayLabel(point.date, point.dayLabel),
    combinedFatigueScore,
    systemCapacityGate,
    gatedRiskScore: clampScore(combinedFatigueScore * systemCapacityGate)
  }
}

function normalizeWindow(window: AdaptationRiskWindow): AdaptationRiskWindow {
  return {
    ...window,
    points: window.points
      .map(normalizePoint)
      .sort((left, right) => left.date.localeCompare(right.date))
  }
}

export function normalizeAdaptationRiskTimelineData(
  data: AdaptationRiskTimelineData
): AdaptationRiskTimelineData {
  return {
    ...data,
    windows: data.windows.map(normalizeWindow)
  }
}

export function selectAdaptationRiskWindow(
  data: AdaptationRiskTimelineData,
  requestedKey: string
): AdaptationRiskWindow | undefined {
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

export function resolveRiskZone(score: number): AdaptationRiskZone {
  if (score >= RED_THRESHOLD) {
    return "red"
  }
  if (score >= YELLOW_THRESHOLD) {
    return "yellow"
  }
  return "green"
}
