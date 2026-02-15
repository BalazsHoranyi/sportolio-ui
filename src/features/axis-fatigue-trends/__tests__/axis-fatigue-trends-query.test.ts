import { describe, expect, it } from "vitest"

import {
  normalizeAxisFatigueTrendsData,
  selectAxisFatigueWindow
} from "@/features/axis-fatigue-trends/axis-fatigue-trends-query"
import type { AxisFatigueTrendsData } from "@/features/axis-fatigue-trends/types"

const rawData: AxisFatigueTrendsData = {
  defaultWindowKey: "30d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      days: [
        {
          date: "2026-02-12",
          dayLabel: "Thu",
          planned: {
            neural: 12.4,
            metabolic: -2,
            mechanical: 6.3,
            recruitment: 11
          },
          completed: {
            neural: 7.3,
            metabolic: 6.1,
            mechanical: 6.2,
            recruitment: 6.6
          },
          plannedSessions: [],
          completedSessions: []
        },
        {
          date: "2026-02-10",
          planned: {
            neural: 6.2,
            metabolic: 5.4,
            mechanical: 5.8,
            recruitment: 5.1
          },
          completed: {
            neural: 6.1,
            metabolic: 5.1,
            mechanical: 5.7,
            recruitment: 5
          },
          plannedSessions: [],
          completedSessions: []
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      days: []
    }
  ]
}

describe("axis-fatigue-trends-query", () => {
  it("normalizes days into ascending date order with score clamping", () => {
    const normalized = normalizeAxisFatigueTrendsData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.days.map((day) => day.date)).toEqual([
      "2026-02-10",
      "2026-02-12"
    ])

    const clampedDay = sevenDayWindow?.days[1]
    expect(clampedDay?.planned).toEqual({
      neural: 10,
      metabolic: 0,
      mechanical: 6.3,
      recruitment: 10
    })
  })

  it("derives deterministic day labels when missing", () => {
    const normalized = normalizeAxisFatigueTrendsData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.days[0]?.dayLabel).toBe("Tue")
  })

  it("selects explicit window, then default window, then first window", () => {
    const normalized = normalizeAxisFatigueTrendsData(rawData)

    expect(selectAxisFatigueWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectAxisFatigueWindow(normalized, "missing")?.key).toBe("30d")

    const withoutDefault: AxisFatigueTrendsData = {
      windows: normalized.windows,
      defaultWindowKey: "unknown"
    }
    expect(selectAxisFatigueWindow(withoutDefault, "missing")?.key).toBe("7d")
  })
})
