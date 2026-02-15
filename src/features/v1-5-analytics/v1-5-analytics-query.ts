import type {
  CoachAthleteException,
  CoachPortfolioAthlete,
  CoachPortfolioSnapshot,
  CoachPortfolioStatus,
  InterferenceAuditSnapshot,
  InterferenceConflict,
  InterferenceSeverity,
  LiftSummary,
  MonotonyRiskBand,
  MonotonyStrainSnapshot,
  MonotonyStrainWeek,
  RecoveryIOSnapshot,
  RecoveryPair,
  RecoveryTrajectoryDirection,
  StrengthProgressSnapshot,
  StrengthSession,
  V15AnalyticsData,
  V15AnalyticsSnapshot,
  V15AnalyticsWindow,
  WeeklyLoad
} from "@/features/v1-5-analytics/types"

const EPSILON = 0.25

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

function sanitizeNonNegative(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value)
}

function sanitizeBounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(max, Math.max(min, value))
}

function normalizeStrengthSession(session: StrengthSession): StrengthSession {
  return {
    ...session,
    weightKg: sanitizeNonNegative(session.weightKg),
    reps: sanitizeNonNegative(session.reps),
    sets: sanitizeNonNegative(session.sets),
    rpe: sanitizeBounded(session.rpe, 0, 10)
  }
}

function estimatedOneRepMax(session: StrengthSession): number {
  return round(session.weightKg * (1 + session.reps / 40), 1)
}

function buildStrengthSnapshot(
  strengthSessions: StrengthSession[]
): StrengthProgressSnapshot {
  if (strengthSessions.length === 0) {
    return {
      totalVolumeLoad: 0,
      intensityDistribution: {
        low: 0,
        moderate: 0,
        high: 0
      },
      liftSummaries: [],
      prEvents: []
    }
  }

  const normalizedSessions = strengthSessions
    .map(normalizeStrengthSession)
    .sort((left, right) => {
      const byLift = right.lift.localeCompare(left.lift)
      if (byLift !== 0) {
        return byLift
      }

      const byDate = left.date.localeCompare(right.date)
      if (byDate !== 0) {
        return byDate
      }

      return left.id.localeCompare(right.id)
    })

  const totalVolumeLoad = round(
    normalizedSessions.reduce(
      (total, session) =>
        total + session.weightKg * session.reps * session.sets,
      0
    ),
    0
  )

  const lowCount = normalizedSessions.filter(
    (session) => session.rpe < 7
  ).length
  const moderateCount = normalizedSessions.filter(
    (session) => session.rpe >= 7 && session.rpe < 8.5
  ).length
  const highCount = normalizedSessions.filter(
    (session) => session.rpe >= 8.5
  ).length
  const sessionCount = normalizedSessions.length

  const intensityDistribution = {
    low: round((lowCount / sessionCount) * 100, 1),
    moderate: round((moderateCount / sessionCount) * 100, 1),
    high: round((highCount / sessionCount) * 100, 1)
  }

  const byLift = new Map<string, StrengthSession[]>()
  for (const session of normalizedSessions) {
    const sessions = byLift.get(session.lift) ?? []
    sessions.push(session)
    byLift.set(session.lift, sessions)
  }

  const liftSummaries: LiftSummary[] = []
  const prEvents: StrengthProgressSnapshot["prEvents"] = []

  for (const [lift, sessions] of byLift.entries()) {
    let bestE1rm = 0
    const points: LiftSummary["points"] = sessions.map((session) => {
      const e1rm = estimatedOneRepMax(session)
      const isPr = e1rm > bestE1rm

      if (isPr) {
        bestE1rm = e1rm
        prEvents.push({
          sessionId: session.id,
          date: session.date,
          lift,
          e1rm
        })
      }

      return {
        sessionId: session.id,
        date: session.date,
        e1rm,
        isPr
      }
    })

    const latestE1rm = points.at(-1)?.e1rm ?? 0
    const earliestE1rm = points[0]?.e1rm ?? 0

    liftSummaries.push({
      lift,
      latestE1rm,
      trendDelta: round(latestE1rm - earliestE1rm, 1),
      points
    })
  }

  return {
    totalVolumeLoad,
    intensityDistribution,
    liftSummaries: liftSummaries.sort((left, right) =>
      left.lift.localeCompare(right.lift)
    ),
    prEvents
  }
}

function classifyInterferenceSeverity(
  overlapScore: number
): InterferenceSeverity {
  if (overlapScore >= 0.75) {
    return "high"
  }

  if (overlapScore >= 0.5) {
    return "medium"
  }

  return "low"
}

const INTERFERENCE_SEVERITY_ORDER: Record<InterferenceSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2
}

function buildInterferenceSnapshot(
  signals: V15AnalyticsWindow["interferenceSignals"]
): InterferenceAuditSnapshot {
  const conflicts: InterferenceConflict[] = signals
    .map((signal) => {
      const overlapScore = sanitizeBounded(signal.overlapScore, 0, 1)
      const primary = signal.primaryRegion.trim().replace(/_/g, " ")
      const secondary = signal.secondaryRegion.trim().replace(/_/g, " ")
      return {
        id: signal.id,
        regionPair: `${primary} x ${secondary}`,
        overlapScore: round(overlapScore, 2),
        severity: classifyInterferenceSeverity(overlapScore),
        sessions: [...signal.sessions].sort((left, right) =>
          left.localeCompare(right)
        )
      }
    })
    .sort((left, right) => {
      const bySeverity =
        INTERFERENCE_SEVERITY_ORDER[left.severity] -
        INTERFERENCE_SEVERITY_ORDER[right.severity]

      if (bySeverity !== 0) {
        return bySeverity
      }

      const byScore = right.overlapScore - left.overlapScore
      if (byScore !== 0) {
        return byScore
      }

      return left.id.localeCompare(right.id)
    })

  return {
    conflicts
  }
}

function toRecoveryInputScore(
  day: V15AnalyticsWindow["recoveryDays"][number]
): number {
  const sleepFactor = sanitizeBounded(day.sleepHours / 9, 0, 1)
  const fuelFactor = sanitizeBounded(day.fuelScore / 10, 0, 1)
  const stressFactor = 1 - sanitizeBounded(day.stressScore / 10, 0, 1)

  return round(sleepFactor * 0.4 + fuelFactor * 0.35 + stressFactor * 0.25, 2)
}

function classifyTrajectoryDirection(
  pairs: RecoveryPair[]
): RecoveryTrajectoryDirection {
  if (pairs.length < 2) {
    return "flat"
  }

  const first = pairs[0]?.nextDayOutputScore ?? 0
  const last = pairs.at(-1)?.nextDayOutputScore ?? 0
  const delta = last - first

  if (delta > EPSILON) {
    return "up"
  }

  if (delta < -EPSILON) {
    return "down"
  }

  return "flat"
}

function buildRecoverySnapshot(
  recoveryDays: V15AnalyticsWindow["recoveryDays"]
): RecoveryIOSnapshot {
  const pairs = recoveryDays
    .map((day) => ({
      date: day.date,
      inputScore: toRecoveryInputScore(day),
      nextDayOutputScore: round(
        sanitizeBounded(day.nextDayOutputScore, 0, 10),
        1
      )
    }))
    .sort((left, right) => left.date.localeCompare(right.date))

  if (pairs.length === 0) {
    return {
      pairs,
      alignmentScore: 0,
      trajectoryDirection: "flat"
    }
  }

  const alignmentScore = round(
    (pairs.reduce((total, pair) => {
      const input = pair.inputScore
      const output = pair.nextDayOutputScore / 10
      return total + (1 - Math.abs(output - input))
    }, 0) /
      pairs.length) *
      100,
    1
  )

  return {
    pairs,
    alignmentScore,
    trajectoryDirection: classifyTrajectoryDirection(pairs)
  }
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  const average = mean(values)
  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
    values.length

  return Math.sqrt(variance)
}

function classifyMonotonyRisk(
  monotony: number,
  strain: number
): MonotonyRiskBand {
  if (monotony >= 3 || strain >= 10000) {
    return "high"
  }

  if (monotony >= 1.5 || strain >= 5000) {
    return "moderate"
  }

  return "low"
}

function buildMonotonyWeek(load: WeeklyLoad): MonotonyStrainWeek {
  const values = load.dailyLoads.map((entry) => sanitizeNonNegative(entry))
  const average = mean(values)
  const deviation = standardDeviation(values)
  const monotony = deviation <= 0 ? 0 : round(average / deviation, 2)
  const totalLoad = round(
    values.reduce((total, value) => total + value, 0),
    0
  )
  const strain = round(monotony * totalLoad, 1)

  return {
    weekKey: load.weekKey,
    monotony,
    totalLoad,
    strain,
    riskBand: classifyMonotonyRisk(monotony, strain)
  }
}

function buildMonotonySnapshot(
  weeklyLoads: V15AnalyticsWindow["weeklyLoads"]
): MonotonyStrainSnapshot {
  return {
    weeks: weeklyLoads
      .map((weeklyLoad) => buildMonotonyWeek(weeklyLoad))
      .sort((left, right) => left.weekKey.localeCompare(right.weekKey))
  }
}

function toAthleteStatus(athlete: CoachAthleteException): CoachPortfolioStatus {
  const score =
    athlete.highRiskDays * 3 +
    athlete.missedSessions * 2 +
    athlete.lowRecoveryDays

  if (athlete.highRiskDays >= 3 || score >= 12) {
    return "critical"
  }

  if (score >= 6) {
    return "watch"
  }

  return "stable"
}

const COACH_STATUS_ORDER: Record<CoachPortfolioStatus, number> = {
  critical: 0,
  watch: 1,
  stable: 2
}

function buildCoachPortfolioSnapshot(
  athletes: V15AnalyticsWindow["athletes"]
): CoachPortfolioSnapshot {
  const normalized: CoachPortfolioAthlete[] = athletes
    .map((athlete) => {
      const highRiskDays = sanitizeNonNegative(athlete.highRiskDays)
      const missedSessions = sanitizeNonNegative(athlete.missedSessions)
      const lowRecoveryDays = sanitizeNonNegative(athlete.lowRecoveryDays)
      const exceptionScore =
        highRiskDays * 3 + missedSessions * 2 + lowRecoveryDays

      return {
        athleteId: athlete.athleteId,
        athleteName: athlete.athleteName,
        highRiskDays,
        missedSessions,
        lowRecoveryDays,
        exceptionScore,
        status: toAthleteStatus({
          ...athlete,
          highRiskDays,
          missedSessions,
          lowRecoveryDays
        })
      }
    })
    .sort((left, right) => {
      const byStatus =
        COACH_STATUS_ORDER[left.status] - COACH_STATUS_ORDER[right.status]
      if (byStatus !== 0) {
        return byStatus
      }

      const byScore = right.exceptionScore - left.exceptionScore
      if (byScore !== 0) {
        return byScore
      }

      const byName = left.athleteName.localeCompare(right.athleteName)
      if (byName !== 0) {
        return byName
      }

      return left.athleteId.localeCompare(right.athleteId)
    })

  return {
    athletes: normalized
  }
}

function normalizeWindow(window: V15AnalyticsWindow): V15AnalyticsWindow {
  return {
    ...window,
    strengthSessions: window.strengthSessions.map((session) =>
      normalizeStrengthSession(session)
    ),
    interferenceSignals: window.interferenceSignals.map((signal) => ({
      ...signal,
      overlapScore: sanitizeBounded(signal.overlapScore, 0, 1)
    })),
    recoveryDays: window.recoveryDays.map((day) => ({
      ...day,
      sleepHours: sanitizeNonNegative(day.sleepHours),
      fuelScore: sanitizeBounded(day.fuelScore, 0, 10),
      stressScore: sanitizeBounded(day.stressScore, 0, 10),
      nextDayOutputScore: sanitizeBounded(day.nextDayOutputScore, 0, 10)
    })),
    weeklyLoads: window.weeklyLoads.map((week) => ({
      ...week,
      dailyLoads: week.dailyLoads.map((value) => sanitizeNonNegative(value))
    })),
    athletes: window.athletes.map((athlete) => ({
      ...athlete,
      highRiskDays: sanitizeNonNegative(athlete.highRiskDays),
      missedSessions: sanitizeNonNegative(athlete.missedSessions),
      lowRecoveryDays: sanitizeNonNegative(athlete.lowRecoveryDays)
    }))
  }
}

export function normalizeV15AnalyticsData(
  data: V15AnalyticsData
): V15AnalyticsData {
  return {
    ...data,
    windows: data.windows.map((window) => normalizeWindow(window))
  }
}

export function selectV15AnalyticsWindow(
  data: V15AnalyticsData,
  requestedKey: string
): V15AnalyticsWindow | undefined {
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

const EMPTY_STRENGTH: StrengthProgressSnapshot = {
  totalVolumeLoad: 0,
  intensityDistribution: {
    low: 0,
    moderate: 0,
    high: 0
  },
  liftSummaries: [],
  prEvents: []
}

const EMPTY_INTERFERENCE: InterferenceAuditSnapshot = {
  conflicts: []
}

const EMPTY_RECOVERY: RecoveryIOSnapshot = {
  pairs: [],
  alignmentScore: 0,
  trajectoryDirection: "flat"
}

const EMPTY_MONOTONY: MonotonyStrainSnapshot = {
  weeks: []
}

const EMPTY_COACH: CoachPortfolioSnapshot = {
  athletes: []
}

export function buildV15AnalyticsSnapshot(
  data: V15AnalyticsData,
  options: {
    windowKey: string
  }
): V15AnalyticsSnapshot {
  const window = selectV15AnalyticsWindow(data, options.windowKey)

  if (!window) {
    return {
      window: undefined,
      strength: EMPTY_STRENGTH,
      interference: EMPTY_INTERFERENCE,
      recovery: EMPTY_RECOVERY,
      monotonyStrain: EMPTY_MONOTONY,
      coachPortfolio: EMPTY_COACH
    }
  }

  return {
    window,
    strength: buildStrengthSnapshot(window.strengthSessions),
    interference: buildInterferenceSnapshot(window.interferenceSignals),
    recovery: buildRecoverySnapshot(window.recoveryDays),
    monotonyStrain: buildMonotonySnapshot(window.weeklyLoads),
    coachPortfolio: buildCoachPortfolioSnapshot(window.athletes)
  }
}
