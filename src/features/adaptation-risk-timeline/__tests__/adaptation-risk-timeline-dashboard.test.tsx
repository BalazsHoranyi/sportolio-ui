import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AdaptationRiskTimelineDashboard } from "@/features/adaptation-risk-timeline/components/adaptation-risk-timeline-dashboard"
import type { AdaptationRiskTimelineData } from "@/features/adaptation-risk-timeline/types"

const data: AdaptationRiskTimelineData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      points: [
        {
          date: "2026-02-10",
          dayLabel: "Tue",
          combinedFatigueScore: 4.4,
          systemCapacityGate: 1.02,
          contributors: []
        },
        {
          date: "2026-02-11",
          dayLabel: "Wed",
          combinedFatigueScore: 6.6,
          systemCapacityGate: 1.1,
          contributors: [
            {
              id: "s-1",
              label: "Completed VO2 Set",
              href: "/sessions/s-1"
            }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      points: [
        {
          date: "2026-01-31",
          dayLabel: "31",
          combinedFatigueScore: 5.3,
          systemCapacityGate: 0.95,
          contributors: []
        }
      ]
    }
  ]
}

describe("AdaptationRiskTimelineDashboard", () => {
  it("renders risk zones and threshold legends", () => {
    render(<AdaptationRiskTimelineDashboard data={data} />)

    expect(screen.getByLabelText("Green risk zone band")).toBeVisible()
    expect(screen.getByLabelText("Yellow risk zone band")).toBeVisible()
    expect(screen.getByLabelText("Red risk zone band")).toBeVisible()
    expect(screen.getByText("Green < 5.0")).toBeVisible()
    expect(screen.getByText("Yellow 5.0 - 6.9")).toBeVisible()
    expect(screen.getByText("Red >= 7.0")).toBeVisible()
  })

  it("renders selectable windows and switches the active timeline", async () => {
    const user = userEvent.setup()
    render(<AdaptationRiskTimelineDashboard data={data} />)

    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "30 days" }))

    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("2026-01-31")).toBeVisible()
  })

  it("shows contributor drill-down links for the active point", async () => {
    const user = userEvent.setup()
    render(<AdaptationRiskTimelineDashboard data={data} />)

    await user.hover(screen.getByRole("button", { name: "Wed risk marker" }))

    const details = screen.getByRole("region", { name: "Risk point details" })
    expect(
      within(details).getByRole("link", { name: "Completed VO2 Set" })
    ).toHaveAttribute("href", "/sessions/s-1")
  })

  it("shows an empty state when no contributors exist for a point", async () => {
    const user = userEvent.setup()
    render(<AdaptationRiskTimelineDashboard data={data} />)

    await user.hover(screen.getByRole("button", { name: "Tue risk marker" }))

    const details = screen.getByRole("region", { name: "Risk point details" })
    expect(
      within(details).getByText("No contributors available for this point.")
    ).toBeVisible()
  })
})
