import type {
  MonthlyAuditChartData,
  WeeklyAuditChartData,
  WeeklyAuditDay,
  WeeklyAuditSessionLink
} from "@/features/audit/types"

export type PlannedAuditInputWorkout = {
  id: string
  title: string
  start: string
  end: string
}

type AxisScores = {
  neural: number
  metabolic: number
  mechanical: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DEFAULT_ANCHOR_ISO = "2026-02-16T00:00:00.000Z"

const strengthKeywords = [
  "squat",
  "deadlift",
  "bench",
  "press",
  "row",
  "pull",
  "lift",
  "lunge"
]

const enduranceKeywords = [
  "run",
  "ride",
  "bike",
  "swim",
  "tempo",
  "interval",
  "threshold",
  "erg"
]

const recoveryKeywords = ["recovery", "easy", "mobility", "walk", "rest"]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatDateKey(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function addDaysUtc(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS)
}

function parseIso(iso: string): Date {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid workout timestamp \`${iso}\`.`)
  }
  return parsed
}

function startOfWeekUtc(value: Date): Date {
  const day = value.getUTCDay()
  const offsetToMonday = day === 0 ? -6 : 1 - day
  return addDaysUtc(
    new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    ),
    offsetToMonday
  )
}

function startOfMonthUtc(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1))
}

function getAnchorDate(workouts: PlannedAuditInputWorkout[]): Date {
  if (workouts.length === 0) {
    return new Date(DEFAULT_ANCHOR_ISO)
  }

  return [...workouts]
    .sort((left, right) => {
      const delta =
        parseIso(left.start).getTime() - parseIso(right.start).getTime()
      if (delta !== 0) {
        return delta
      }
      return left.id.localeCompare(right.id)
    })
    .map((workout) => parseIso(workout.start))[0]
}

function buildSessionByDate(
  workouts: PlannedAuditInputWorkout[]
): Map<string, WeeklyAuditSessionLink[]> {
  const sorted = [...workouts].sort((left, right) => {
    const delta =
      parseIso(left.start).getTime() - parseIso(right.start).getTime()
    if (delta !== 0) {
      return delta
    }
    return left.id.localeCompare(right.id)
  })

  const byDate = new Map<string, WeeklyAuditSessionLink[]>()

  sorted.forEach((workout) => {
    const key = formatDateKey(parseIso(workout.start))
    const existing = byDate.get(key) ?? []
    existing.push({
      id: workout.id,
      label: workout.title,
      href: `/sessions/${workout.id}`
    })
    byDate.set(key, existing)
  })

  return byDate
}

function inferContribution(title: string): AxisScores {
  const normalized = title.toLowerCase()

  const isRecovery = recoveryKeywords.some((keyword) =>
    normalized.includes(keyword)
  )
  if (isRecovery) {
    return {
      neural: 0.3,
      metabolic: 0.4,
      mechanical: 0.3
    }
  }

  const isStrength = strengthKeywords.some((keyword) =>
    normalized.includes(keyword)
  )
  const isEndurance = enduranceKeywords.some((keyword) =>
    normalized.includes(keyword)
  )

  if (isStrength && isEndurance) {
    return {
      neural: 1.2,
      metabolic: 1.3,
      mechanical: 1.2
    }
  }

  if (isStrength) {
    return {
      neural: 1.5,
      metabolic: 0.7,
      mechanical: 1.4
    }
  }

  if (isEndurance) {
    return {
      neural: 0.7,
      metabolic: 1.6,
      mechanical: 0.8
    }
  }

  return {
    neural: 1,
    metabolic: 1,
    mechanical: 1
  }
}

function buildDayScores(
  sessions: WeeklyAuditSessionLink[]
): AxisScores & { recruitment: number } {
  const base = {
    neural: 3.5,
    metabolic: 3.5,
    mechanical: 3.5
  }

  const totals = sessions.reduce((accumulator, session) => {
    const contribution = inferContribution(session.label)
    return {
      neural: accumulator.neural + contribution.neural,
      metabolic: accumulator.metabolic + contribution.metabolic,
      mechanical: accumulator.mechanical + contribution.mechanical
    }
  }, base)

  const neural = clamp(Number(totals.neural.toFixed(1)), 0, 10)
  const metabolic = clamp(Number(totals.metabolic.toFixed(1)), 0, 10)
  const mechanical = clamp(Number(totals.mechanical.toFixed(1)), 0, 10)
  const recruitment = clamp(
    Number((((neural + metabolic + mechanical) / 3) * 0.95).toFixed(1)),
    0,
    10
  )

  return {
    neural,
    metabolic,
    mechanical,
    recruitment
  }
}

function buildWeeklyDays(
  weekStart: Date,
  sessionsByDate: Map<string, WeeklyAuditSessionLink[]>
): WeeklyAuditDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDaysUtc(weekStart, index)
    const dateKey = formatDateKey(date)
    const sessions = sessionsByDate.get(dateKey) ?? []
    const scores = buildDayScores(sessions)

    return {
      dayLabel: WEEKDAY_LABELS[index] ?? String(index + 1),
      date: dateKey,
      ...scores,
      sessions
    }
  })
}

function buildMonthlyDays(
  monthStart: Date,
  sessionsByDate: Map<string, WeeklyAuditSessionLink[]>
): WeeklyAuditDay[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = addDaysUtc(monthStart, index)
    const dateKey = formatDateKey(date)
    const sessions = sessionsByDate.get(dateKey) ?? []
    const scores = buildDayScores(sessions)

    return {
      dayLabel: String(index + 1),
      date: dateKey,
      ...scores,
      sessions
    }
  })
}

const weekLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
})

const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC"
})

export function buildPlannedAuditReflow(workouts: PlannedAuditInputWorkout[]): {
  weekly: WeeklyAuditChartData
  monthly: MonthlyAuditChartData
} {
  const anchor = getAnchorDate(workouts)
  const weekStart = startOfWeekUtc(anchor)
  const monthStart = startOfMonthUtc(anchor)
  const sessionsByDate = buildSessionByDate(workouts)

  const weekly: WeeklyAuditChartData = {
    weekLabel: `Week of ${weekLabelFormatter.format(weekStart)}`,
    seriesState: "planned",
    days: buildWeeklyDays(weekStart, sessionsByDate)
  }

  const monthly: MonthlyAuditChartData = {
    windows: [
      {
        monthLabel: monthLabelFormatter.format(monthStart),
        seriesState: "planned",
        days: buildMonthlyDays(monthStart, sessionsByDate)
      }
    ]
  }

  return {
    weekly,
    monthly
  }
}
