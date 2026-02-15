import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AxisFatigueTrendsDashboard } from "@/features/axis-fatigue-trends/components/axis-fatigue-trends-dashboard"
import type { AxisFatigueTrendsData } from "@/features/axis-fatigue-trends/types"

const data: AxisFatigueTrendsData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      days: [
        {
          date: "2026-02-10",
          dayLabel: "Tue",
          planned: {
            neural: 6.5,
            metabolic: 5.8,
            mechanical: 6.1,
            recruitment: 5.9
          },
          completed: {
            neural: 6.1,
            metabolic: 5.4,
            mechanical: 5.9,
            recruitment: 5.7
          },
          plannedSessions: [
            { id: "p-1", label: "Planned Tempo Run", href: "/sessions/p-1" }
          ],
          completedSessions: []
        },
        {
          date: "2026-02-11",
          dayLabel: "Wed",
          planned: {
            neural: 7.1,
            metabolic: 6.3,
            mechanical: 6.9,
            recruitment: 6.4
          },
          completed: {
            neural: 6.8,
            metabolic: 6,
            mechanical: 6.4,
            recruitment: 6.1
          },
          plannedSessions: [],
          completedSessions: [
            { id: "c-1", label: "Back Squat", href: "/sessions/c-1" }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      days: [
        {
          date: "2026-02-01",
          dayLabel: "1",
          planned: {
            neural: 5.9,
            metabolic: 5.1,
            mechanical: 5.5,
            recruitment: 5.2
          },
          completed: {
            neural: 5.6,
            metabolic: 4.9,
            mechanical: 5.3,
            recruitment: 5
          },
          plannedSessions: [],
          completedSessions: []
        }
      ]
    }
  ]
}

describe("AxisFatigueTrendsDashboard", () => {
  it("renders selectable windows and switches the active window", async () => {
    const user = userEvent.setup()
    render(<AxisFatigueTrendsDashboard data={data} />)

    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "30 days" }))

    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("2026-02-01")).toBeVisible()
  })

  it("renders planned vs completed axis series with distinct styles", () => {
    render(<AxisFatigueTrendsDashboard data={data} />)

    expect(
      screen.getByLabelText("Completed neural axis series")
    ).not.toHaveAttribute("stroke-dasharray")
    expect(screen.getByLabelText("Planned neural axis series")).toHaveAttribute(
      "stroke-dasharray",
      "6 4"
    )

    expect(
      screen.getByLabelText("Completed metabolic axis series")
    ).toBeVisible()
    expect(
      screen.getByLabelText("Planned mechanical axis series")
    ).toBeVisible()
  })

  it("renders recruitment overlays and drill-down session links", async () => {
    const user = userEvent.setup()
    render(<AxisFatigueTrendsDashboard data={data} />)

    expect(
      screen.getByLabelText("Completed recruitment overlay band")
    ).toBeVisible()
    expect(
      screen.getByLabelText("Planned recruitment overlay line")
    ).toBeVisible()

    await user.hover(screen.getByRole("button", { name: "Wed day marker" }))

    const drilldown = screen.getByRole("region", {
      name: "Axis fatigue day details"
    })

    expect(
      within(drilldown).getByRole("link", { name: "Back Squat" })
    ).toHaveAttribute("href", "/sessions/c-1")
    expect(
      within(drilldown).getByText("No planned sessions for this day.")
    ).toBeVisible()
  })

  it("provides contextual metric glossary access", async () => {
    const user = userEvent.setup()
    render(<AxisFatigueTrendsDashboard data={data} />)

    await user.click(screen.getByRole("button", { name: "Metric glossary" }))

    const glossary = screen.getByRole("region", {
      name: "Axis Fatigue Trends metric glossary"
    })
    expect(within(glossary).getByText(/Glossary version/i)).toBeVisible()
    expect(within(glossary).getByText("Neural load")).toBeVisible()
    expect(within(glossary).getByText("Recruitment overlay")).toBeVisible()
  })
})
