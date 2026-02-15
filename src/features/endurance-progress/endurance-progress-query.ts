import type {
  EnduranceProgressData,
  EnduranceProgressSnapshot,
  EnduranceProgressWindow,
  EnduranceThresholdMetric,
  EnduranceThresholdPoint,
  EnduranceZone,
  EnduranceZoneMinutes,
  NormalizedEnduranceProgressData,
  NormalizedEnduranceProgressWindow,
  NormalizedEnduranceThresholdMetric,
  NormalizedEnduranceThresholdPoint,
  ThresholdConfidenceBand
} from "@/features/endurance-progress/types"

const ZONE_ORDER: EnduranceZone[] = ["z1", "z2", "z3", "z4", "z5"]
const MIN_CONFIDENCE = 0
const MAX_CONFIDENCE = 1
const LOW_CONFIDENCE_THRESHOLD = 0.5
const HIGH_CONFIDENCE_THRESHOLD = 0.8

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, value)
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

function normalizeZoneDistribution(
  distribution: EnduranceZoneMinutes[]
): EnduranceZoneMinutes[] {
  const totals = new Map<EnduranceZone, number>(
    ZONE_ORDER.map((zone) => [zone, 0])
  )

  for (const entry of distribution) {
    if (!ZONE_ORDER.includes(entry.zone)) {
      continue
    }
    const current = totals.get(entry.zone) ?? 0
    totals.set(entry.zone, current + normalizeNonNegative(entry.minutes))
  }

  return ZONE_ORDER.map((zone) => ({
    zone,
    minutes: totals.get(zone) ?? 0
  }))
}

function normalizeThresholdPoint(
  point: EnduranceThresholdPoint
): NormalizedEnduranceThresholdPoint {
  return {
    ...point,
    dayLabel: deriveDayLabel(point.date, point.dayLabel),
    value: Number.isFinite(point.value) ? point.value : 0,
    confidence: clamp(point.confidence, MIN_CONFIDENCE, MAX_CONFIDENCE)
  }
}

function normalizeThresholdMetric(
  metric: EnduranceThresholdMetric
): NormalizedEnduranceThresholdMetric {
  return {
    ...metric,
    points: metric.points
      .map(normalizeThresholdPoint)
      .sort((left, right) => left.date.localeCompare(right.date))
  }
}

function normalizeWindow(
  window: EnduranceProgressWindow
): NormalizedEnduranceProgressWindow {
  return {
    key: window.key,
    label: window.label,
    zoneDistribution: normalizeZoneDistribution(window.zoneDistribution),
    thresholdMetrics: window.thresholdMetrics.map(normalizeThresholdMetric)
  }
}

export function normalizeEnduranceProgressData(
  data: EnduranceProgressData
): NormalizedEnduranceProgressData {
  return {
    ...data,
    windows: data.windows.map((window) => normalizeWindow(window))
  }
}

export function selectEnduranceProgressWindow(
  data: NormalizedEnduranceProgressData,
  requestedKey: string
): NormalizedEnduranceProgressWindow | undefined {
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

function selectThresholdMetric(
  window: NormalizedEnduranceProgressWindow,
  requestedKey: string
): NormalizedEnduranceThresholdMetric | undefined {
  const requested = window.thresholdMetrics.find(
    (metric) => metric.key === requestedKey
  )
  if (requested) {
    return requested
  }
  return window.thresholdMetrics[0]
}

function toPercentage(value: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return Number(((value / total) * 100).toFixed(1))
}

export function buildEnduranceProgressSnapshot(
  data: NormalizedEnduranceProgressData,
  options: {
    windowKey: string
    metricKey: string
  }
): EnduranceProgressSnapshot {
  const window = selectEnduranceProgressWindow(data, options.windowKey)

  if (!window) {
    return {
      window: undefined,
      metric: undefined,
      totalZoneMinutes: 0,
      zoneDistribution: []
    }
  }

  const totalZoneMinutes = window.zoneDistribution.reduce(
    (total, entry) => total + entry.minutes,
    0
  )

  return {
    window,
    metric: selectThresholdMetric(window, options.metricKey),
    totalZoneMinutes,
    zoneDistribution: window.zoneDistribution.map((entry) => ({
      ...entry,
      percentage: toPercentage(entry.minutes, totalZoneMinutes)
    }))
  }
}

export function classifyConfidenceBand(
  confidence: number
): ThresholdConfidenceBand {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return "high"
  }
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) {
    return "medium"
  }
  return "low"
}
