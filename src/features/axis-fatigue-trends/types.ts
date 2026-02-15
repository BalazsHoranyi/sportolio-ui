export type AxisFatigueSeriesPoint = {
  neural: number
  metabolic: number
  mechanical: number
  recruitment: number
}

export type AxisFatigueSessionLink = {
  id: string
  label: string
  href: string
}

export type AxisFatigueTrendDay = {
  date: string
  dayLabel?: string
  planned: AxisFatigueSeriesPoint
  completed: AxisFatigueSeriesPoint
  plannedSessions: AxisFatigueSessionLink[]
  completedSessions: AxisFatigueSessionLink[]
}

export type AxisFatigueWindow = {
  key: string
  label: string
  days: AxisFatigueTrendDay[]
}

export type AxisFatigueTrendsData = {
  defaultWindowKey?: string
  windows: AxisFatigueWindow[]
}
