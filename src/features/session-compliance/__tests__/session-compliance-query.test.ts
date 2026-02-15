import { describe, expect, it } from "vitest"

import {
  buildSessionComplianceSnapshot,
  classifyAdherenceState,
  normalizeSessionComplianceData,
  normalizeSessionComplianceState,
  selectSessionComplianceWindow
} from "@/features/session-compliance/session-compliance-query"
import type {
  NormalizedSessionComplianceData,
  SessionComplianceData
} from "@/features/session-compliance/types"

const rawData: SessionComplianceData = {
  defaultWindowKey: "30d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      sessions: [
        {
          id: "s-3",
          label: "Tempo Bike",
          href: "/calendar?sessionId=s-3",
          date: "2026-02-11",
          planBlock: " Build ",
          modality: " Endurance ",
          state: "moved"
        },
        {
          id: "s-1",
          label: "Back Squat",
          href: "/calendar?sessionId=s-1",
          date: "2026-02-10",
          planBlock: "Base",
          modality: "Strength",
          state: "completed"
        },
        {
          id: "s-2",
          label: "Accessory Circuit",
          href: "/calendar?sessionId=s-2",
          date: "2026-02-10",
          planBlock: "Base",
          modality: "strength",
          state: "unknown"
        },
        {
          id: "s-4",
          label: "Long Run",
          href: "/calendar?sessionId=s-4",
          date: "2026-02-12",
          planBlock: "Build",
          modality: "Endurance",
          state: "skipped"
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      sessions: []
    }
  ]
}

describe("session-compliance-query", () => {
  it("normalizes session order and deterministic state/category values", () => {
    const normalized = normalizeSessionComplianceData(rawData)
    const sevenDayWindow = normalized.windows.find(
      (window) => window.key === "7d"
    )

    expect(sevenDayWindow?.sessions.map((session) => session.date)).toEqual([
      "2026-02-10",
      "2026-02-10",
      "2026-02-11",
      "2026-02-12"
    ])

    expect(sevenDayWindow?.sessions[1]).toMatchObject({
      state: "planned",
      modality: "Strength",
      planBlock: "Base",
      dayLabel: "Tue"
    })
  })

  it("selects explicit window, then default window, then first window", () => {
    const normalized = normalizeSessionComplianceData(rawData)

    expect(selectSessionComplianceWindow(normalized, "7d")?.key).toBe("7d")
    expect(selectSessionComplianceWindow(normalized, "missing")?.key).toBe(
      "30d"
    )

    const withoutDefault: NormalizedSessionComplianceData = {
      windows: normalized.windows,
      defaultWindowKey: "unknown"
    }
    expect(selectSessionComplianceWindow(withoutDefault, "missing")?.key).toBe(
      "7d"
    )
  })

  it("builds aggregate metrics and trends with optional plan block/modality filters", () => {
    const normalized = normalizeSessionComplianceData(rawData)

    const allSnapshot = buildSessionComplianceSnapshot(normalized, {
      windowKey: "7d"
    })
    expect(allSnapshot).toMatchObject({
      plannedCount: 4,
      completedCount: 1,
      moveCount: 1,
      skipCount: 1,
      adherencePercentage: 25,
      adherenceState: "red"
    })
    expect(allSnapshot.availablePlanBlocks).toEqual(["Base", "Build"])
    expect(allSnapshot.availableModalities).toEqual(["Endurance", "Strength"])

    const baseOnly = buildSessionComplianceSnapshot(normalized, {
      windowKey: "7d",
      planBlock: "base"
    })
    expect(baseOnly).toMatchObject({
      plannedCount: 2,
      completedCount: 1,
      moveCount: 0,
      skipCount: 0,
      adherencePercentage: 50
    })

    const enduranceOnly = buildSessionComplianceSnapshot(normalized, {
      windowKey: "7d",
      modality: "ENDURANCE"
    })
    expect(enduranceOnly).toMatchObject({
      plannedCount: 2,
      completedCount: 0,
      moveCount: 1,
      skipCount: 1,
      adherencePercentage: 0
    })
  })

  it("classifies adherence states at threshold boundaries", () => {
    expect(classifyAdherenceState(59.99)).toBe("red")
    expect(classifyAdherenceState(60)).toBe("yellow")
    expect(classifyAdherenceState(84.99)).toBe("yellow")
    expect(classifyAdherenceState(85)).toBe("green")
  })

  it("normalizes unrecognized states and avoids divide-by-zero behavior", () => {
    expect(normalizeSessionComplianceState("completed")).toBe("completed")
    expect(normalizeSessionComplianceState("MOVED")).toBe("moved")
    expect(normalizeSessionComplianceState("skipped")).toBe("skipped")
    expect(normalizeSessionComplianceState("pending")).toBe("planned")
    expect(normalizeSessionComplianceState(undefined)).toBe("planned")

    const normalized = normalizeSessionComplianceData(rawData)
    const emptySnapshot = buildSessionComplianceSnapshot(normalized, {
      windowKey: "30d"
    })
    expect(emptySnapshot).toMatchObject({
      plannedCount: 0,
      completedCount: 0,
      moveCount: 0,
      skipCount: 0,
      adherencePercentage: 0,
      adherenceState: "red"
    })
  })
})
