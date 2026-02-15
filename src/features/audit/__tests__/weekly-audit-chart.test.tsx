import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { WeeklyAuditChart } from "@/features/audit/components/weekly-audit-chart"
import type { WeeklyAuditChartData } from "@/features/audit/types"

const chartData: WeeklyAuditChartData = {
  weekLabel: "Week of Feb 10, 2026",
  seriesState: "completed",
  days: [
    {
      dayLabel: "Mon",
      date: "2026-02-10",
      neural: 6.2,
      metabolic: 5.1,
      mechanical: 5.8,
      recruitment: 5.4,
      sessions: [{ id: "s-1", label: "Back Squat", href: "/sessions/s-1" }]
    },
    {
      dayLabel: "Tue",
      date: "2026-02-11",
      neural: 6.9,
      metabolic: 6.1,
      mechanical: 6.3,
      recruitment: 6,
      sessions: []
    },
    {
      dayLabel: "Wed",
      date: "2026-02-12",
      neural: 7,
      metabolic: 6.7,
      mechanical: 6.9,
      recruitment: 6.6,
      sessions: [
        { id: "s-2", label: "Tempo Run", href: "/sessions/s-2" },
        { id: "s-3", label: "Accessory Circuit", href: "/sessions/s-3" }
      ]
    },
    {
      dayLabel: "Thu",
      date: "2026-02-13",
      neural: 6.4,
      metabolic: 5.9,
      mechanical: 6,
      recruitment: 5.9,
      sessions: [{ id: "s-4", label: "Recovery Ride", href: "/sessions/s-4" }]
    },
    {
      dayLabel: "Fri",
      date: "2026-02-14",
      neural: 7.1,
      metabolic: 6.8,
      mechanical: 7,
      recruitment: 6.8,
      sessions: [{ id: "s-5", label: "Deadlift", href: "/sessions/s-5" }]
    },
    {
      dayLabel: "Sat",
      date: "2026-02-15",
      neural: 6.5,
      metabolic: 6.2,
      mechanical: 6.1,
      recruitment: 6,
      sessions: []
    },
    {
      dayLabel: "Sun",
      date: "2026-02-16",
      neural: 5.9,
      metabolic: 5.5,
      mechanical: 5.7,
      recruitment: 5.6,
      sessions: [{ id: "s-6", label: "Long Run", href: "/sessions/s-6" }]
    }
  ]
}

describe("WeeklyAuditChart", () => {
  it("fails safely when not provided a 7-day payload", () => {
    render(
      <WeeklyAuditChart
        data={{
          weekLabel: "Invalid",
          days: chartData.days.slice(0, 6)
        }}
      />
    )

    expect(
      screen.getByText("Weekly audit requires exactly 7 days of data.")
    ).toBeVisible()
  })

  it("renders a 7-day daily chart with the three primary axis series", () => {
    render(<WeeklyAuditChart data={chartData} />)

    const labels = screen.getByLabelText("Weekly audit x-axis labels")
    expect(within(labels).getAllByRole("listitem")).toHaveLength(7)

    expect(screen.getByLabelText("Neural axis series")).toBeVisible()
    expect(screen.getByLabelText("Metabolic axis series")).toBeVisible()
    expect(screen.getByLabelText("Mechanical axis series")).toBeVisible()

    const primaryLegend = screen.getByLabelText("Primary axis legend")
    expect(within(primaryLegend).getAllByRole("listitem")).toHaveLength(3)

    const seriesStateLegend = screen.getByLabelText("Series state legend")
    expect(
      within(seriesStateLegend).getByText("Completed (solid)")
    ).toBeVisible()
    expect(
      within(seriesStateLegend).getByText("Planned (dashed)")
    ).toBeVisible()
  })

  it("renders recruitment as an overlay band and keeps it out of the primary legend", () => {
    render(<WeeklyAuditChart data={chartData} />)

    expect(screen.getByLabelText("Recruitment overlay band")).toBeVisible()

    const primaryLegend = screen.getByLabelText("Primary axis legend")
    expect(
      within(primaryLegend).queryByText(/Recruitment/i)
    ).not.toBeInTheDocument()
  })

  it("shows a visible red-zone threshold at >= 7.0", () => {
    render(<WeeklyAuditChart data={chartData} />)

    expect(screen.getByLabelText("Red zone threshold at 7.0")).toBeVisible()
    expect(screen.getByText("Red zone >= 7.0")).toBeVisible()
  })

  it("renders completed series with solid strokes", () => {
    render(
      <WeeklyAuditChart data={{ ...chartData, seriesState: "completed" }} />
    )

    expect(screen.getByLabelText("Neural axis series")).not.toHaveAttribute(
      "stroke-dasharray"
    )
    expect(screen.getByLabelText("Metabolic axis series")).not.toHaveAttribute(
      "stroke-dasharray"
    )
    expect(screen.getByLabelText("Mechanical axis series")).not.toHaveAttribute(
      "stroke-dasharray"
    )
  })

  it("renders planned series with dashed strokes", () => {
    render(<WeeklyAuditChart data={{ ...chartData, seriesState: "planned" }} />)

    expect(screen.getByLabelText("Neural axis series")).toHaveAttribute(
      "stroke-dasharray",
      "6 4"
    )
    expect(screen.getByLabelText("Metabolic axis series")).toHaveAttribute(
      "stroke-dasharray",
      "6 4"
    )
    expect(screen.getByLabelText("Mechanical axis series")).toHaveAttribute(
      "stroke-dasharray",
      "6 4"
    )
  })

  it("shows explainability links inside the day tooltip on hover and keyboard focus", async () => {
    const user = userEvent.setup()

    render(<WeeklyAuditChart data={chartData} />)

    const wedMarker = screen.getByRole("button", { name: "Wed day marker" })

    await user.hover(wedMarker)

    const tooltip = screen.getByRole("region", {
      name: "Weekly audit day details"
    })

    expect(within(tooltip).getByText("2026-02-12")).toBeVisible()
    expect(
      within(tooltip).getByRole("link", { name: "Tempo Run" })
    ).toHaveAttribute("href", "/sessions/s-2")

    await user.unhover(wedMarker)
    await user.click(wedMarker)

    expect(
      within(tooltip).getByRole("link", { name: "Accessory Circuit" })
    ).toHaveAttribute("href", "/sessions/s-3")
  })
})
