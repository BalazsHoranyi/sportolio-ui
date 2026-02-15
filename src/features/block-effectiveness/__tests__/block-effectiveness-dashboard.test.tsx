import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { BlockEffectivenessDashboard } from "@/features/block-effectiveness/components/block-effectiveness-dashboard"
import type { BlockEffectivenessData } from "@/features/block-effectiveness/types"

const data: BlockEffectivenessData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      blocks: [
        {
          key: "base",
          label: "Base",
          startDate: "2026-02-03",
          metrics: [
            {
              key: "squat_1rm",
              label: "Back squat estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 170,
              realizedValue: 172,
              direction: "higher",
              confidence: 0.84,
              sampleSize: 4,
              contributors: [
                {
                  id: "be-1",
                  label: "Back squat top set",
                  href: "/sessions/be-1"
                }
              ]
            },
            {
              key: "threshold_pace",
              label: "Threshold pace",
              objectiveType: "endurance",
              unit: "min/km",
              targetValue: 4.2,
              realizedValue: 4.08,
              direction: "lower",
              confidence: 0.72,
              sampleSize: 3,
              contributors: [
                {
                  id: "be-2",
                  label: "Tempo run progression",
                  href: "/sessions/be-2"
                }
              ]
            }
          ]
        },
        {
          key: "build",
          label: "Build",
          startDate: "2026-02-10",
          metrics: [
            {
              key: "threshold_power",
              label: "Threshold power",
              objectiveType: "endurance",
              unit: "W",
              targetValue: 280,
              realizedValue: 270,
              direction: "higher",
              confidence: 0.41,
              sampleSize: 1,
              contributors: []
            }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      blocks: [
        {
          key: "accumulation",
          label: "Accumulation",
          startDate: "2026-01-15",
          metrics: [
            {
              key: "threshold_power",
              label: "Threshold power",
              objectiveType: "endurance",
              unit: "W",
              targetValue: 275,
              realizedValue: 279,
              direction: "higher",
              confidence: 0.86,
              sampleSize: 6,
              contributors: []
            }
          ]
        }
      ]
    }
  ]
}

describe("BlockEffectivenessDashboard", () => {
  it("renders block summary metrics and mixed-goal delta rows", () => {
    render(<BlockEffectivenessDashboard data={data} />)

    expect(screen.getByText("Block effectiveness index")).toBeVisible()
    expect(screen.getByText("Data confidence")).toBeVisible()
    expect(screen.getByText("Average delta")).toBeVisible()

    const metricsTable = screen.getByRole("table", {
      name: "Block effectiveness metrics"
    })
    expect(
      within(metricsTable).getByText("Back squat estimated 1RM")
    ).toBeVisible()
    expect(within(metricsTable).getByText("Threshold pace")).toBeVisible()
  })

  it("switches window and active block selectors", async () => {
    const user = userEvent.setup()
    render(<BlockEffectivenessDashboard data={data} />)

    await user.click(screen.getByRole("button", { name: "30 days" }))
    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByRole("button", { name: "7 days" }))
    await user.click(screen.getByRole("button", { name: "Block Build" }))

    const confidenceCard = screen.getByText("Data confidence").closest("div")
    expect(confidenceCard).not.toBeNull()
    expect(
      within(confidenceCard as HTMLElement).getByText("Sparse data")
    ).toBeVisible()
  })

  it("shows contributor drill-down links for selected metric rows", async () => {
    const user = userEvent.setup()
    render(<BlockEffectivenessDashboard data={data} />)

    await user.click(
      screen.getByRole("button", {
        name: "View contributors for Threshold pace"
      })
    )

    const drilldown = screen.getByRole("region", {
      name: "Block delta contributors"
    })
    expect(
      within(drilldown).getByRole("link", {
        name: "Tempo run progression"
      })
    ).toHaveAttribute("href", "/sessions/be-2")

    await user.click(screen.getByRole("button", { name: "Block Build" }))
    expect(
      within(drilldown).getByText("No contributing sessions for this metric.")
    ).toBeVisible()
  })

  it("provides contextual metric glossary access", async () => {
    const user = userEvent.setup()
    render(<BlockEffectivenessDashboard data={data} />)

    await user.click(screen.getByRole("button", { name: "Metric glossary" }))

    const glossary = screen.getByRole("region", {
      name: "Block Effectiveness metric glossary"
    })
    expect(within(glossary).getByText(/Glossary version/i)).toBeVisible()
    expect(
      within(glossary).getByText("Block effectiveness index")
    ).toBeVisible()
    expect(within(glossary).getByText("Delta (%)")).toBeVisible()
  })
})
