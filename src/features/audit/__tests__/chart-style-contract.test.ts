import { describe, expect, it } from "vitest"

import {
  getAuditSeriesStyle,
  normalizeAuditSeriesState
} from "@/features/audit/chart-style-contract"

describe("chart-style-contract", () => {
  it("normalizes backend payload state aliases into canonical chart states", () => {
    expect(normalizeAuditSeriesState("completed")).toBe("completed")
    expect(normalizeAuditSeriesState("COMPLETED")).toBe("completed")
    expect(normalizeAuditSeriesState("done")).toBe("completed")
    expect(normalizeAuditSeriesState("executed")).toBe("completed")
    expect(normalizeAuditSeriesState("planned")).toBe("planned")
    expect(normalizeAuditSeriesState("SCHEDULED")).toBe("planned")
    expect(normalizeAuditSeriesState("pending")).toBe("planned")
  })

  it("falls back unsupported or missing values to planned state", () => {
    expect(normalizeAuditSeriesState(undefined)).toBe("planned")
    expect(normalizeAuditSeriesState(null)).toBe("planned")
    expect(normalizeAuditSeriesState("")).toBe("planned")
    expect(normalizeAuditSeriesState("in-progress")).toBe("planned")
  })

  it("returns deterministic SVG stroke styles for each canonical state", () => {
    expect(getAuditSeriesStyle("completed")).toMatchInlineSnapshot(`
      {
        "strokeDasharray": undefined,
      }
    `)
    expect(getAuditSeriesStyle("planned")).toMatchInlineSnapshot(`
      {
        "strokeDasharray": "6 4",
      }
    `)
  })
})
