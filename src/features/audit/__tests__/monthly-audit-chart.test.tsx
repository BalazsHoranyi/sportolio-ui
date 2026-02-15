import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MonthlyAuditChart } from "@/features/audit/components/monthly-audit-chart"
import type { MonthlyAuditChartData } from "@/features/audit/types"

function buildWindow(
  monthLabel: string,
  monthPrefix: string,
  seriesState: "planned" | "completed"
) {
  return {
    monthLabel,
    seriesState,
    days: Array.from({ length: 30 }, (_, index) => {
      const dayNumber = index + 1
      const paddedDay = String(dayNumber).padStart(2, "0")
      return {
        dayLabel: String(dayNumber),
        date: `${monthPrefix}-${paddedDay}`,
        neural: 5.5 + (index % 5) * 0.3,
        metabolic: 4.9 + (index % 6) * 0.3,
        mechanical: 5.2 + (index % 4) * 0.35,
        recruitment: 5.1 + (index % 5) * 0.2,
        sessions:
          dayNumber === 15
            ? [{ id: "session-15", label: "Tempo Ride", href: "/sessions/15" }]
            : []
      }
    })
  }
}

const monthlyData: MonthlyAuditChartData = {
  windows: [
    buildWindow("Feb 2026", "2026-02", "planned"),
    buildWindow("Mar 2026", "2026-03", "completed")
  ]
}

describe("MonthlyAuditChart", () => {
  it("fails safely when not provided a 30-day payload for a window", () => {
    render(
      <MonthlyAuditChart
        data={{
          windows: [
            {
              ...monthlyData.windows[0],
              days: monthlyData.windows[0].days.slice(0, 29)
            }
          ]
        }}
      />
    )

    expect(
      screen.getByText(
        "Month audit requires exactly 30 days of data per window."
      )
    ).toBeVisible()
  })

  it("renders a 30-day chart with the three primary axis series", () => {
    render(<MonthlyAuditChart data={monthlyData} />)

    const labels = screen.getByLabelText("Monthly audit x-axis labels")
    expect(within(labels).getAllByRole("listitem")).toHaveLength(30)

    expect(screen.getByLabelText("Neural axis series")).toBeVisible()
    expect(screen.getByLabelText("Metabolic axis series")).toBeVisible()
    expect(screen.getByLabelText("Mechanical axis series")).toBeVisible()
  })

  it("renders recruitment overlay and red-zone threshold", () => {
    render(<MonthlyAuditChart data={monthlyData} />)

    expect(screen.getByLabelText("Recruitment overlay band")).toBeVisible()
    expect(screen.getByLabelText("Red zone threshold at 7.0")).toBeVisible()
    expect(screen.getByText("Red zone >= 7.0")).toBeVisible()
  })

  it("uses planned/completed style parity with weekly chart", async () => {
    const user = userEvent.setup()
    render(<MonthlyAuditChart data={monthlyData} />)

    expect(screen.getByLabelText("Neural axis series")).toHaveAttribute(
      "stroke-dasharray",
      "6 4"
    )

    await user.click(screen.getByRole("button", { name: "Next month window" }))

    expect(screen.getByLabelText("Neural axis series")).not.toHaveAttribute(
      "stroke-dasharray"
    )
  })

  it("supports month-window navigation and day details drill-down", async () => {
    const user = userEvent.setup()
    render(<MonthlyAuditChart data={monthlyData} />)

    expect(screen.getByText("Feb 2026")).toBeVisible()

    const dayMarker = screen.getByRole("button", { name: "15 day marker" })
    await user.hover(dayMarker)

    const details = screen.getByRole("region", {
      name: "Monthly audit day details"
    })

    expect(within(details).getByText("2026-02-15")).toBeVisible()
    expect(
      within(details).getByRole("link", { name: "Tempo Ride" })
    ).toHaveAttribute("href", "/sessions/15")

    await user.click(screen.getByRole("button", { name: "Next month window" }))
    expect(screen.getByText("Mar 2026")).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Previous month window" })
    ).toBeEnabled()
  })
})
