import type {
  NormalizedSessionComplianceData,
  NormalizedSessionComplianceSession,
  NormalizedSessionComplianceWindow,
  SessionComplianceAdherenceState,
  SessionComplianceData,
  SessionComplianceSession,
  SessionComplianceSnapshot,
  SessionComplianceState,
  SessionComplianceTrendPoint
} from "@/features/session-compliance/types"

const COMPLETED_STATE_ALIASES = new Set([
  "completed",
  "done",
  "executed",
  "logged"
])
const MOVED_STATE_ALIASES = new Set(["moved", "rescheduled", "swapped"])
const SKIPPED_STATE_ALIASES = new Set(["skipped", "missed"])
const PLANNED_STATE_ALIASES = new Set(["planned", "pending", "scheduled"])

const GREEN_ADHERENCE_THRESHOLD = 85
const YELLOW_ADHERENCE_THRESHOLD = 60

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter((entry) => entry.length > 0)
    .map((entry) => entry[0]?.toUpperCase() + entry.slice(1).toLowerCase())
    .join(" ")
}

function normalizeCategory(
  value: string | undefined,
  fallback: string
): string {
  const normalized = value?.trim()
  if (!normalized) {
    return fallback
  }
  return toTitleCase(normalized.replace(/\s+/g, " "))
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

function normalizeSession(
  session: SessionComplianceSession
): NormalizedSessionComplianceSession {
  return {
    ...session,
    state: normalizeSessionComplianceState(session.state),
    dayLabel: deriveDayLabel(session.date, session.dayLabel),
    planBlock: normalizeCategory(session.planBlock, "Unassigned"),
    modality: normalizeCategory(session.modality, "Unspecified")
  }
}

function toPercent(completedCount: number, plannedCount: number): number {
  if (plannedCount <= 0) {
    return 0
  }
  return Math.round((completedCount / plannedCount) * 100)
}

function normalizeFilterValue(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized || normalized === "all") {
    return undefined
  }
  return normalized
}

export function normalizeSessionComplianceState(
  state: string | undefined | null
): SessionComplianceState {
  const normalized = state?.trim().toLowerCase()
  if (!normalized) {
    return "planned"
  }

  if (COMPLETED_STATE_ALIASES.has(normalized)) {
    return "completed"
  }
  if (MOVED_STATE_ALIASES.has(normalized)) {
    return "moved"
  }
  if (SKIPPED_STATE_ALIASES.has(normalized)) {
    return "skipped"
  }
  if (PLANNED_STATE_ALIASES.has(normalized)) {
    return "planned"
  }
  return "planned"
}

export function normalizeSessionComplianceData(
  data: SessionComplianceData
): NormalizedSessionComplianceData {
  return {
    ...data,
    windows: data.windows.map((window) => ({
      ...window,
      sessions: window.sessions.map(normalizeSession).sort((left, right) => {
        const byDate = left.date.localeCompare(right.date)
        if (byDate !== 0) {
          return byDate
        }
        return left.id.localeCompare(right.id)
      })
    }))
  }
}

export function selectSessionComplianceWindow(
  data: NormalizedSessionComplianceData,
  requestedKey: string
): NormalizedSessionComplianceWindow | undefined {
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

export function classifyAdherenceState(
  adherencePercentage: number
): SessionComplianceAdherenceState {
  if (adherencePercentage >= GREEN_ADHERENCE_THRESHOLD) {
    return "green"
  }
  if (adherencePercentage >= YELLOW_ADHERENCE_THRESHOLD) {
    return "yellow"
  }
  return "red"
}

function buildTrend(
  sessions: NormalizedSessionComplianceSession[]
): SessionComplianceTrendPoint[] {
  const entries = new Map<string, SessionComplianceTrendPoint>()

  for (const session of sessions) {
    const existing = entries.get(session.date)
    if (!existing) {
      entries.set(session.date, {
        date: session.date,
        dayLabel: session.dayLabel,
        plannedCount: 0,
        completedCount: 0,
        moveCount: 0,
        skipCount: 0,
        adherencePercentage: 0,
        sessions: [session]
      })
      continue
    }

    existing.sessions.push(session)
  }

  const trend = Array.from(entries.values()).sort((left, right) =>
    left.date.localeCompare(right.date)
  )

  for (const point of trend) {
    point.plannedCount = point.sessions.length
    point.completedCount = point.sessions.filter(
      (session) => session.state === "completed"
    ).length
    point.moveCount = point.sessions.filter(
      (session) => session.state === "moved"
    ).length
    point.skipCount = point.sessions.filter(
      (session) => session.state === "skipped"
    ).length
    point.adherencePercentage = toPercent(
      point.completedCount,
      point.plannedCount
    )
  }

  return trend
}

type BuildSnapshotOptions = {
  windowKey: string
  planBlock?: string
  modality?: string
}

export function buildSessionComplianceSnapshot(
  data: NormalizedSessionComplianceData,
  options: BuildSnapshotOptions
): SessionComplianceSnapshot {
  const window = selectSessionComplianceWindow(data, options.windowKey)

  if (!window) {
    return {
      window: undefined,
      plannedCount: 0,
      completedCount: 0,
      adherencePercentage: 0,
      adherenceState: "red",
      moveCount: 0,
      skipCount: 0,
      availablePlanBlocks: [],
      availableModalities: [],
      trend: []
    }
  }

  const availablePlanBlocks = Array.from(
    new Set(window.sessions.map((session) => session.planBlock))
  ).sort((left, right) => left.localeCompare(right))

  const availableModalities = Array.from(
    new Set(window.sessions.map((session) => session.modality))
  ).sort((left, right) => left.localeCompare(right))

  const planBlockFilter = normalizeFilterValue(options.planBlock)
  const modalityFilter = normalizeFilterValue(options.modality)

  const filteredSessions = window.sessions.filter((session) => {
    if (
      planBlockFilter &&
      session.planBlock.trim().toLowerCase() !== planBlockFilter
    ) {
      return false
    }
    if (
      modalityFilter &&
      session.modality.trim().toLowerCase() !== modalityFilter
    ) {
      return false
    }
    return true
  })

  const plannedCount = filteredSessions.length
  const completedCount = filteredSessions.filter(
    (session) => session.state === "completed"
  ).length
  const moveCount = filteredSessions.filter(
    (session) => session.state === "moved"
  ).length
  const skipCount = filteredSessions.filter(
    (session) => session.state === "skipped"
  ).length
  const adherencePercentage = toPercent(completedCount, plannedCount)

  return {
    window,
    plannedCount,
    completedCount,
    adherencePercentage,
    adherenceState: classifyAdherenceState(adherencePercentage),
    moveCount,
    skipCount,
    availablePlanBlocks,
    availableModalities,
    trend: buildTrend(filteredSessions)
  }
}
