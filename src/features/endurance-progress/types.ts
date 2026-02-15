export type EnduranceZone = "z1" | "z2" | "z3" | "z4" | "z5"

export type EnduranceThresholdContributor = {
  id: string
  label: string
  href: string
}

export type EnduranceThresholdPoint = {
  date: string
  dayLabel?: string
  value: number
  confidence: number
  inferred: boolean
  contributors: EnduranceThresholdContributor[]
}

export type EnduranceThresholdMetric = {
  key: string
  label: string
  unit: string
  points: EnduranceThresholdPoint[]
}

export type EnduranceZoneMinutes = {
  zone: EnduranceZone
  minutes: number
}

export type EnduranceProgressWindow = {
  key: string
  label: string
  zoneDistribution: EnduranceZoneMinutes[]
  thresholdMetrics: EnduranceThresholdMetric[]
}

export type EnduranceProgressData = {
  defaultWindowKey?: string
  windows: EnduranceProgressWindow[]
}

export type NormalizedEnduranceThresholdPoint = Omit<
  EnduranceThresholdPoint,
  "dayLabel" | "confidence" | "value"
> & {
  dayLabel: string
  value: number
  confidence: number
}

export type NormalizedEnduranceThresholdMetric = Omit<
  EnduranceThresholdMetric,
  "points"
> & {
  points: NormalizedEnduranceThresholdPoint[]
}

export type NormalizedEnduranceProgressWindow = Omit<
  EnduranceProgressWindow,
  "zoneDistribution" | "thresholdMetrics"
> & {
  zoneDistribution: EnduranceZoneMinutes[]
  thresholdMetrics: NormalizedEnduranceThresholdMetric[]
}

export type NormalizedEnduranceProgressData = Omit<
  EnduranceProgressData,
  "windows"
> & {
  windows: NormalizedEnduranceProgressWindow[]
}

export type EnduranceProgressDistributionEntry = EnduranceZoneMinutes & {
  percentage: number
}

export type EnduranceProgressSnapshot = {
  window: NormalizedEnduranceProgressWindow | undefined
  metric: NormalizedEnduranceThresholdMetric | undefined
  totalZoneMinutes: number
  zoneDistribution: EnduranceProgressDistributionEntry[]
}

export type ThresholdConfidenceBand = "low" | "medium" | "high"
