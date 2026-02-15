import { describe, expect, it } from "vitest"

import {
  buildBlockEffectivenessSnapshot,
  classifyBlockConfidenceBand,
  normalizeBlockEffectivenessData,
  selectBlockEffectivenessWindow
} from "@/features/block-effectiveness/block-effectiveness-query"
import type { BlockEffectivenessData } from "@/features/block-effectiveness/types"

const rawData: BlockEffectivenessData = {
  defaultWindowKey: "30d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      blocks: [
        {
          key: "build",
          label: "Build",
          startDate: "2026-02-10",
          metrics: [
            {
              key: "squat_1rm",
              label: "Back squat estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 170,
              realizedValue: 173.4,
              direction: "higher",
              confidence: 0.81,
              sampleSize: 4,
              contributors: [
                {
                  id: "s-1",
                  label: "Back squat top set",
                  href: "/sessions/s-1"
                }
              ]
            },
            {
              key: "threshold_pace",
              label: "Threshold pace",
              objectiveType: "endurance",
              unit: "min/km",
              targetValue: 4.2,
              realizedValue: 4.1,
              direction: "lower",
              confidence: 0.66,
              sampleSize: 3,
              contributors: [
                {
                  id: "s-2",
                  label: "Tempo run 3x10",
                  href: "/sessions/s-2"
                }
              ]
            }
          ]
        },
        {
          key: "base",
          label: "Base",
          startDate: "2026-02-03",
          metrics: [
            {
              key: "threshold_power",
              label: "Threshold power",
              objectiveType: "endurance",
              unit: "W",
              targetValue: 280,
              realizedValue: 272,
              direction: "higher",
              confidence: 0.4,
              sampleSize: 1,
              contributors: []
            },
            {
              key: "deadlift_1rm",
              label: "Deadlift estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 0,
              realizedValue: 185,
              direction: "higher",
              confidence: 0.49,
              sampleSize: 2,
              contributors: []
            }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      blocks: []
    }
  ]
}

describe("block-effectiveness-query", () => {
  it("normalizes deterministic ordering and metric delta contracts", () => {
    const normalized = normalizeBlockEffectivenessData(rawData)
    const sevenDay = normalized.windows.find((window) => window.key === "7d")

    expect(sevenDay?.blocks.map((block) => block.key)).toEqual([
      "base",
      "build"
    ])

    const buildBlock = sevenDay?.blocks.find((block) => block.key === "build")
    expect(buildBlock?.metrics[0]).toMatchObject({
      key: "squat_1rm",
      deltaValue: 3.4,
      deltaPercentage: 2,
      effectivenessIndex: 98,
      confidence: 0.81
    })
    expect(buildBlock?.metrics[1]).toMatchObject({
      key: "threshold_pace",
      deltaValue: 0.1,
      deltaPercentage: 2.4,
      effectivenessIndex: 97.6
    })

    const baseBlock = sevenDay?.blocks.find((block) => block.key === "base")
    expect(baseBlock?.metrics[1]).toMatchObject({
      key: "deadlift_1rm",
      deltaPercentage: 0,
      effectivenessIndex: 0
    })
  })

  it("selects requested window, then default window, then first window", () => {
    const normalized = normalizeBlockEffectivenessData(rawData)

    expect(selectBlockEffectivenessWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectBlockEffectivenessWindow(normalized, "missing")?.key).toBe(
      "30d"
    )

    const withoutDefault = {
      windows: normalized.windows,
      defaultWindowKey: "unknown"
    }
    expect(selectBlockEffectivenessWindow(withoutDefault, "missing")?.key).toBe(
      "7d"
    )
  })

  it("builds block summaries with mixed objective deltas and quality flags", () => {
    const normalized = normalizeBlockEffectivenessData(rawData)

    const snapshot = buildBlockEffectivenessSnapshot(normalized, {
      windowKey: "7d",
      blockKey: "build"
    })

    expect(snapshot.activeBlockSummary?.block.key).toBe("build")
    expect(snapshot.activeBlockSummary?.objectiveTypes).toEqual([
      "endurance",
      "strength"
    ])
    expect(snapshot.activeBlockSummary?.averageDeltaPercentage).toBe(2.2)
    expect(snapshot.activeBlockSummary?.effectivenessIndex).toBe(97.8)
    expect(snapshot.activeBlockSummary?.dataQualityFlag).toBe("ok")

    const sparseBlock = snapshot.blockSummaries.find(
      (summary) => summary.block.key === "base"
    )
    expect(sparseBlock).toMatchObject({
      dataQualityFlag: "sparse",
      confidenceBand: "low"
    })
  })

  it("classifies confidence thresholds deterministically", () => {
    expect(classifyBlockConfidenceBand(0.49)).toBe("low")
    expect(classifyBlockConfidenceBand(0.5)).toBe("medium")
    expect(classifyBlockConfidenceBand(0.79)).toBe("medium")
    expect(classifyBlockConfidenceBand(0.8)).toBe("high")
  })
})
