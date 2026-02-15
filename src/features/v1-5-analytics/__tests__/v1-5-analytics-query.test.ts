import { describe, expect, it } from "vitest"

import {
  buildV15AnalyticsSnapshot,
  normalizeV15AnalyticsData,
  selectV15AnalyticsWindow
} from "@/features/v1-5-analytics/v1-5-analytics-query"
import type { V15AnalyticsData } from "@/features/v1-5-analytics/types"

const rawData: V15AnalyticsData = {
  defaultWindowKey: "28d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      strengthSessions: [
        {
          id: "sq-1",
          date: "2026-02-10",
          lift: "Back squat",
          weightKg: 150,
          reps: 5,
          sets: 3,
          rpe: 8.5
        },
        {
          id: "sq-2",
          date: "2026-02-12",
          lift: "Back squat",
          weightKg: 155,
          reps: 4,
          sets: 3,
          rpe: 9.2
        },
        {
          id: "bp-1",
          date: "2026-02-11",
          lift: "Bench press",
          weightKg: 100,
          reps: 6,
          sets: 4,
          rpe: 7.4
        },
        {
          id: "bp-2",
          date: "2026-02-13",
          lift: "Bench press",
          weightKg: 102.5,
          reps: 5,
          sets: 4,
          rpe: 8.1
        }
      ],
      interferenceSignals: [
        {
          id: "int-2",
          primaryRegion: "posterior_chain",
          secondaryRegion: "quads",
          overlapScore: 0.61,
          sessions: ["sq-2", "run-1"]
        },
        {
          id: "int-1",
          primaryRegion: "posterior_chain",
          secondaryRegion: "calves",
          overlapScore: 0.82,
          sessions: ["dl-1", "bike-1"]
        }
      ],
      recoveryDays: [
        {
          date: "2026-02-10",
          sleepHours: 8.1,
          fuelScore: 8,
          stressScore: 3,
          nextDayOutputScore: 7.8
        },
        {
          date: "2026-02-11",
          sleepHours: 6.2,
          fuelScore: 5,
          stressScore: 7,
          nextDayOutputScore: 6.1
        },
        {
          date: "2026-02-12",
          sleepHours: 7.6,
          fuelScore: 7,
          stressScore: 4,
          nextDayOutputScore: 7.2
        }
      ],
      weeklyLoads: [
        {
          weekKey: "2026-W05",
          dailyLoads: [620, 540, 700, 0, 680, 520, 400]
        },
        {
          weekKey: "2026-W06",
          dailyLoads: [720, 710, 690, 680, 650, 640, 620]
        }
      ],
      athletes: [
        {
          athleteId: "ath-3",
          athleteName: "Bri V",
          highRiskDays: 1,
          missedSessions: 1,
          lowRecoveryDays: 0
        },
        {
          athleteId: "ath-1",
          athleteName: "Alex K",
          highRiskDays: 3,
          missedSessions: 2,
          lowRecoveryDays: 1
        },
        {
          athleteId: "ath-2",
          athleteName: "Chris M",
          highRiskDays: 2,
          missedSessions: 1,
          lowRecoveryDays: 3
        }
      ]
    },
    {
      key: "28d",
      label: "28 days",
      strengthSessions: [],
      interferenceSignals: [],
      recoveryDays: [],
      weeklyLoads: [],
      athletes: []
    }
  ]
}

describe("v1-5-analytics-query", () => {
  it("normalizes and computes strength progress metrics deterministically", () => {
    const normalized = normalizeV15AnalyticsData(rawData)
    const snapshot = buildV15AnalyticsSnapshot(normalized, { windowKey: "7d" })

    expect(snapshot.strength.totalVolumeLoad).toBe(8560)
    expect(snapshot.strength.prEvents.map((entry) => entry.sessionId)).toEqual([
      "bp-1",
      "bp-2",
      "sq-1",
      "sq-2"
    ])
    expect(snapshot.strength.intensityDistribution).toEqual({
      low: 0,
      moderate: 50,
      high: 50
    })
    expect(snapshot.strength.liftSummaries.map((item) => item.lift)).toEqual([
      "Back squat",
      "Bench press"
    ])
  })

  it("classifies and sorts interference conflicts by severity then score", () => {
    const normalized = normalizeV15AnalyticsData(rawData)
    const snapshot = buildV15AnalyticsSnapshot(normalized, { windowKey: "7d" })

    expect(snapshot.interference.conflicts.map((entry) => entry.id)).toEqual([
      "int-1",
      "int-2"
    ])
    expect(snapshot.interference.conflicts[0]?.severity).toBe("high")
    expect(snapshot.interference.conflicts[1]?.severity).toBe("medium")
  })

  it("links recovery input score to output trajectory and exposes trend direction", () => {
    const normalized = normalizeV15AnalyticsData(rawData)
    const snapshot = buildV15AnalyticsSnapshot(normalized, { windowKey: "7d" })

    expect(snapshot.recovery.pairs).toHaveLength(3)
    expect(snapshot.recovery.trajectoryDirection).toBe("down")
    expect(snapshot.recovery.alignmentScore).toBeGreaterThan(60)
    expect(snapshot.recovery.alignmentScore).toBeLessThan(100)
  })

  it("computes monotony and strain risk bands for each week", () => {
    const normalized = normalizeV15AnalyticsData(rawData)
    const snapshot = buildV15AnalyticsSnapshot(normalized, { windowKey: "7d" })

    expect(snapshot.monotonyStrain.weeks).toHaveLength(2)
    expect(snapshot.monotonyStrain.weeks[0]?.weekKey).toBe("2026-W05")
    expect(snapshot.monotonyStrain.weeks[0]?.riskBand).toBe("moderate")
    expect(snapshot.monotonyStrain.weeks[1]?.riskBand).toBe("high")
  })

  it("ranks coach portfolio athletes by exception severity with stable tie-breaks", () => {
    const normalized = normalizeV15AnalyticsData(rawData)
    const snapshot = buildV15AnalyticsSnapshot(normalized, { windowKey: "7d" })

    expect(
      snapshot.coachPortfolio.athletes.map((athlete) => athlete.athleteId)
    ).toEqual(["ath-1", "ath-2", "ath-3"])
    expect(snapshot.coachPortfolio.athletes[0]?.status).toBe("critical")
    expect(snapshot.coachPortfolio.athletes[1]?.status).toBe("watch")
    expect(snapshot.coachPortfolio.athletes[2]?.status).toBe("stable")
  })

  it("selects requested, then default, then first window deterministically", () => {
    const normalized = normalizeV15AnalyticsData(rawData)

    expect(selectV15AnalyticsWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectV15AnalyticsWindow(normalized, "missing")?.key).toBe("28d")

    const withoutDefault = {
      ...normalized,
      defaultWindowKey: "unknown"
    }

    expect(selectV15AnalyticsWindow(withoutDefault, "missing")?.key).toBe("7d")
  })
})
