import { describe, expect, it } from "vitest"

import {
  buildEnduranceProgressSnapshot,
  classifyConfidenceBand,
  normalizeEnduranceProgressData,
  selectEnduranceProgressWindow
} from "@/features/endurance-progress/endurance-progress-query"
import type { EnduranceProgressData } from "@/features/endurance-progress/types"

const rawData: EnduranceProgressData = {
  defaultWindowKey: "30d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      zoneDistribution: [
        { zone: "z3", minutes: 50 },
        { zone: "z2", minutes: 30 },
        { zone: "z5", minutes: -12 }
      ],
      thresholdMetrics: [
        {
          key: "pace",
          label: "Threshold pace",
          unit: "min/km",
          points: [
            {
              date: "2026-02-12",
              value: 4.2,
              confidence: 1.2,
              inferred: true,
              contributors: []
            },
            {
              date: "2026-02-10",
              value: 4.35,
              confidence: -0.2,
              inferred: false,
              contributors: []
            }
          ]
        },
        {
          key: "power",
          label: "Threshold power",
          unit: "W",
          points: [
            {
              date: "2026-02-11",
              value: 285,
              confidence: 0.74,
              inferred: true,
              contributors: []
            }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      zoneDistribution: [],
      thresholdMetrics: []
    }
  ]
}

describe("endurance-progress-query", () => {
  it("normalizes zones and threshold points into deterministic contracts", () => {
    const normalized = normalizeEnduranceProgressData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.zoneDistribution).toEqual([
      { zone: "z1", minutes: 0 },
      { zone: "z2", minutes: 30 },
      { zone: "z3", minutes: 50 },
      { zone: "z4", minutes: 0 },
      { zone: "z5", minutes: 0 }
    ])

    const paceMetric = sevenDayWindow?.thresholdMetrics.find(
      (metric) => metric.key === "pace"
    )
    expect(paceMetric?.points.map((point) => point.date)).toEqual([
      "2026-02-10",
      "2026-02-12"
    ])
    expect(paceMetric?.points[0]?.confidence).toBe(0)
    expect(paceMetric?.points[1]?.confidence).toBe(1)
  })

  it("selects explicit window, then default, then first available window", () => {
    const normalized = normalizeEnduranceProgressData(rawData)

    expect(selectEnduranceProgressWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectEnduranceProgressWindow(normalized, "missing")?.key).toBe(
      "30d"
    )

    const withoutDefault = {
      windows: normalized.windows,
      defaultWindowKey: "unknown"
    }
    expect(selectEnduranceProgressWindow(withoutDefault, "missing")?.key).toBe(
      "7d"
    )
  })

  it("builds a snapshot with metric-accurate distribution percentages", () => {
    const normalized = normalizeEnduranceProgressData(rawData)
    const snapshot = buildEnduranceProgressSnapshot(normalized, {
      windowKey: "7d",
      metricKey: "pace"
    })

    expect(snapshot.totalZoneMinutes).toBe(80)
    expect(snapshot.zoneDistribution).toEqual([
      { zone: "z1", minutes: 0, percentage: 0 },
      { zone: "z2", minutes: 30, percentage: 37.5 },
      { zone: "z3", minutes: 50, percentage: 62.5 },
      { zone: "z4", minutes: 0, percentage: 0 },
      { zone: "z5", minutes: 0, percentage: 0 }
    ])
    expect(snapshot.metric?.key).toBe("pace")
  })

  it("classifies confidence thresholds at deterministic boundaries", () => {
    expect(classifyConfidenceBand(0.49)).toBe("low")
    expect(classifyConfidenceBand(0.5)).toBe("medium")
    expect(classifyConfidenceBand(0.79)).toBe("medium")
    expect(classifyConfidenceBand(0.8)).toBe("high")
  })
})
