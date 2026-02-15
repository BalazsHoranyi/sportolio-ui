export type TodayAxisSnapshot = {
  neural: number
  metabolic: number
  mechanical: number
  recruitment: number
}

export type TodayCombinedScore = {
  score: number
  interpretation: string
}

export type TodaySystemCapacity = {
  sleepQuality?: number | null
  fuelQuality?: number | null
  stressLevel?: number | null
  gateMultiplier?: number | null
}

export type TodayAccumulationWindow = {
  boundaryStart: string
  boundaryEnd: string
  includedSessionIds: string[]
}

export type TodayContributorSession = {
  id: string
  label: string
  href: string
}

export type TodayDashboardData = {
  snapshot: TodayAxisSnapshot
  combinedScore: TodayCombinedScore
  systemCapacity: TodaySystemCapacity
  accumulation: TodayAccumulationWindow
  contributors: TodayContributorSession[]
}
