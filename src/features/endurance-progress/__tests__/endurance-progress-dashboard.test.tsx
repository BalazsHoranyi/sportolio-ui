import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { EnduranceProgressDashboard } from "@/features/endurance-progress/components/endurance-progress-dashboard"
import type { EnduranceProgressData } from "@/features/endurance-progress/types"

const data: EnduranceProgressData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      zoneDistribution: [
        { zone: "z1", minutes: 40 },
        { zone: "z2", minutes: 25 },
        { zone: "z3", minutes: 20 },
        { zone: "z4", minutes: 10 },
        { zone: "z5", minutes: 5 }
      ],
      thresholdMetrics: [
        {
          key: "pace",
          label: "Threshold pace",
          unit: "min/km",
          points: [
            {
              date: "2026-02-10",
              dayLabel: "Tue",
              value: 4.3,
              confidence: 0.96,
              inferred: false,
              contributors: []
            },
            {
              date: "2026-02-11",
              dayLabel: "Wed",
              value: 4.2,
              confidence: 0.62,
              inferred: true,
              contributors: [
                {
                  id: "session-1",
                  label: "Tempo Run 3x10",
                  href: "/sessions/session-1"
                }
              ]
            }
          ]
        },
        {
          key: "power",
          label: "Threshold power",
          unit: "W",
          points: [
            {
              date: "2026-02-10",
              dayLabel: "Tue",
              value: 286,
              confidence: 0.8,
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
      zoneDistribution: [
        { zone: "z1", minutes: 120 },
        { zone: "z2", minutes: 90 },
        { zone: "z3", minutes: 60 },
        { zone: "z4", minutes: 30 },
        { zone: "z5", minutes: 20 }
      ],
      thresholdMetrics: [
        {
          key: "pace",
          label: "Threshold pace",
          unit: "min/km",
          points: [
            {
              date: "2026-01-31",
              dayLabel: "31",
              value: 4.35,
              confidence: 0.57,
              inferred: true,
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
              date: "2026-01-31",
              dayLabel: "31",
              value: 278,
              confidence: 0.61,
              inferred: true,
              contributors: []
            }
          ]
        }
      ]
    }
  ]
}

describe("EnduranceProgressDashboard", () => {
  it("renders zone distribution and totals for the active window", () => {
    render(<EnduranceProgressDashboard data={data} />)

    expect(screen.getByText("Total zone minutes")).toBeVisible()
    expect(screen.getByText("100")).toBeVisible()
    expect(screen.getByText("Z1")).toBeVisible()
    expect(screen.getByText("40.0%")).toBeVisible()
  })

  it("switches windows and threshold metrics", async () => {
    const user = userEvent.setup()
    render(<EnduranceProgressDashboard data={data} />)

    await user.click(screen.getByRole("button", { name: "30 days" }))

    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("320")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Threshold power" }))
    expect(screen.getByLabelText("Threshold power trend series")).toBeVisible()
  })

  it("shows inferred confidence and contributor drill-down links", async () => {
    const user = userEvent.setup()
    render(<EnduranceProgressDashboard data={data} />)

    await user.hover(screen.getByRole("button", { name: "Wed trend point" }))

    const details = screen.getByRole("region", {
      name: "Threshold point details"
    })
    expect(
      within(details).getByText("Inferred source confidence")
    ).toBeVisible()
    expect(within(details).getByText("62% (Medium)")).toBeVisible()
    expect(
      within(details).getByRole("link", { name: "Tempo Run 3x10" })
    ).toHaveAttribute("href", "/sessions/session-1")
  })

  it("shows an empty state when no contributors exist for the active point", async () => {
    const user = userEvent.setup()
    render(<EnduranceProgressDashboard data={data} />)

    await user.hover(screen.getByRole("button", { name: "Tue trend point" }))

    const details = screen.getByRole("region", {
      name: "Threshold point details"
    })
    expect(
      within(details).getByText("No contributing sessions for this point.")
    ).toBeVisible()
  })
})
