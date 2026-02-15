export type StrengthSession = {
  id: string
  date: string
  lift: string
  weightKg: number
  reps: number
  sets: number
  rpe: number
}

export type InterferenceSignal = {
  id: string
  primaryRegion: string
  secondaryRegion: string
  overlapScore: number
  sessions: string[]
}

export type RecoveryDay = {
  date: string
  sleepHours: number
  fuelScore: number
  stressScore: number
  nextDayOutputScore: number
}

export type WeeklyLoad = {
  weekKey: string
  dailyLoads: number[]
}

export type CoachAthleteException = {
  athleteId: string
  athleteName: string
  highRiskDays: number
  missedSessions: number
  lowRecoveryDays: number
}

export type V15AnalyticsWindow = {
  key: string
  label: string
  strengthSessions: StrengthSession[]
  interferenceSignals: InterferenceSignal[]
  recoveryDays: RecoveryDay[]
  weeklyLoads: WeeklyLoad[]
  athletes: CoachAthleteException[]
}

export type V15AnalyticsData = {
  defaultWindowKey?: string
  windows: V15AnalyticsWindow[]
}

export type StrengthIntensityDistribution = {
  low: number
  moderate: number
  high: number
}

export type LiftTrendPoint = {
  sessionId: string
  date: string
  e1rm: number
  isPr: boolean
}

export type LiftSummary = {
  lift: string
  latestE1rm: number
  trendDelta: number
  points: LiftTrendPoint[]
}

export type StrengthPrEvent = {
  sessionId: string
  date: string
  lift: string
  e1rm: number
}

export type StrengthProgressSnapshot = {
  totalVolumeLoad: number
  intensityDistribution: StrengthIntensityDistribution
  liftSummaries: LiftSummary[]
  prEvents: StrengthPrEvent[]
}

export type InterferenceSeverity = "low" | "medium" | "high"

export type InterferenceConflict = {
  id: string
  regionPair: string
  overlapScore: number
  severity: InterferenceSeverity
  sessions: string[]
}

export type InterferenceAuditSnapshot = {
  conflicts: InterferenceConflict[]
}

export type RecoveryPair = {
  date: string
  inputScore: number
  nextDayOutputScore: number
}

export type RecoveryTrajectoryDirection = "up" | "flat" | "down"

export type RecoveryIOSnapshot = {
  pairs: RecoveryPair[]
  alignmentScore: number
  trajectoryDirection: RecoveryTrajectoryDirection
}

export type MonotonyRiskBand = "low" | "moderate" | "high"

export type MonotonyStrainWeek = {
  weekKey: string
  monotony: number
  strain: number
  totalLoad: number
  riskBand: MonotonyRiskBand
}

export type MonotonyStrainSnapshot = {
  weeks: MonotonyStrainWeek[]
}

export type CoachPortfolioStatus = "stable" | "watch" | "critical"

export type CoachPortfolioAthlete = {
  athleteId: string
  athleteName: string
  highRiskDays: number
  missedSessions: number
  lowRecoveryDays: number
  exceptionScore: number
  status: CoachPortfolioStatus
}

export type CoachPortfolioSnapshot = {
  athletes: CoachPortfolioAthlete[]
}

export type V15AnalyticsSnapshot = {
  window: V15AnalyticsWindow | undefined
  strength: StrengthProgressSnapshot
  interference: InterferenceAuditSnapshot
  recovery: RecoveryIOSnapshot
  monotonyStrain: MonotonyStrainSnapshot
  coachPortfolio: CoachPortfolioSnapshot
}
