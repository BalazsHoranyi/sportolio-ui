export type AdaptationRiskZone = "green" | "yellow" | "red"

export type AdaptationRiskContributor = {
  id: string
  label: string
  href: string
}

export type AdaptationRiskPoint = {
  date: string
  dayLabel?: string
  combinedFatigueScore: number
  systemCapacityGate: number
  gatedRiskScore?: number
  contributors: AdaptationRiskContributor[]
}

export type AdaptationRiskWindow = {
  key: string
  label: string
  points: AdaptationRiskPoint[]
}

export type AdaptationRiskTimelineData = {
  defaultWindowKey?: string
  windows: AdaptationRiskWindow[]
}
