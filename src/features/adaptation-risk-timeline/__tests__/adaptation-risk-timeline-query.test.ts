import { describe, expect, it } from "vitest"

import {
  normalizeAdaptationRiskTimelineData,
  resolveRiskZone,
  selectAdaptationRiskWindow
} from "@/features/adaptation-risk-timeline/adaptation-risk-timeline-query"
import type { AdaptationRiskTimelineData } from "@/features/adaptation-risk-timeline/types"

const rawData: AdaptationRiskTimelineData = {
  defaultWindowKey: "30d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      points: [
        {
          date: "2026-02-12",
          dayLabel: "Thu",
          combinedFatigueScore: 12.8,
          systemCapacityGate: 1.25,
          contributors: []
        },
        {
          date: "2026-02-10",
          combinedFatigueScore: 4.6,
          systemCapacityGate: -0.6,
          contributors: []
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      points: []
    }
  ]
}

describe("adaptation-risk-timeline-query", () => {
  it("normalizes points into ascending order and clamps gated scores", () => {
    const normalized = normalizeAdaptationRiskTimelineData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.points.map((point) => point.date)).toEqual([
      "2026-02-10",
      "2026-02-12"
    ])
    expect(sevenDayWindow?.points.map((point) => point.gatedRiskScore)).toEqual(
      [0, 10]
    )
  })

  it("derives deterministic day labels when missing", () => {
    const normalized = normalizeAdaptationRiskTimelineData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.points[0]?.dayLabel).toBe("Tue")
  })

  it("selects explicit window, then default window, then first window", () => {
    const normalized = normalizeAdaptationRiskTimelineData(rawData)

    expect(selectAdaptationRiskWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectAdaptationRiskWindow(normalized, "missing")?.key).toBe("30d")

    const withoutDefault: AdaptationRiskTimelineData = {
      windows: normalized.windows,
      defaultWindowKey: "unknown"
    }
    expect(selectAdaptationRiskWindow(withoutDefault, "missing")?.key).toBe(
      "7d"
    )
  })

  it("classifies risk zones at threshold boundaries", () => {
    expect(resolveRiskZone(4.99)).toBe("green")
    expect(resolveRiskZone(5)).toBe("yellow")
    expect(resolveRiskZone(6.99)).toBe("yellow")
    expect(resolveRiskZone(7)).toBe("red")
  })
})
