export type SessionComplianceState =
  | "planned"
  | "completed"
  | "moved"
  | "skipped"

export type SessionComplianceAdherenceState = "green" | "yellow" | "red"

export type SessionComplianceSession = {
  id: string
  label: string
  href: string
  date: string
  dayLabel?: string
  planBlock: string
  modality: string
  state: string
}

export type SessionComplianceWindow = {
  key: string
  label: string
  sessions: SessionComplianceSession[]
}

export type SessionComplianceData = {
  defaultWindowKey?: string
  windows: SessionComplianceWindow[]
}

export type NormalizedSessionComplianceSession = Omit<
  SessionComplianceSession,
  "dayLabel" | "planBlock" | "modality" | "state"
> & {
  dayLabel: string
  planBlock: string
  modality: string
  state: SessionComplianceState
}

export type NormalizedSessionComplianceWindow = Omit<
  SessionComplianceWindow,
  "sessions"
> & {
  sessions: NormalizedSessionComplianceSession[]
}

export type NormalizedSessionComplianceData = Omit<
  SessionComplianceData,
  "windows"
> & {
  windows: NormalizedSessionComplianceWindow[]
}

export type SessionComplianceTrendPoint = {
  date: string
  dayLabel: string
  plannedCount: number
  completedCount: number
  moveCount: number
  skipCount: number
  adherencePercentage: number
  sessions: NormalizedSessionComplianceSession[]
}

export type SessionComplianceSnapshot = {
  window: NormalizedSessionComplianceWindow | undefined
  plannedCount: number
  completedCount: number
  adherencePercentage: number
  adherenceState: SessionComplianceAdherenceState
  moveCount: number
  skipCount: number
  availablePlanBlocks: string[]
  availableModalities: string[]
  trend: SessionComplianceTrendPoint[]
}
