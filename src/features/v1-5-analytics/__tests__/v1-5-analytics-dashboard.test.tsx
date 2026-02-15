import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { V15AnalyticsDashboard } from "@/features/v1-5-analytics/components/v1-5-analytics-dashboard"
import { v15AnalyticsPreviewData } from "@/features/v1-5-analytics/v1-5-analytics-preview"

describe("V15AnalyticsDashboard", () => {
  it("renders all five v1.5 analytics modules", () => {
    render(<V15AnalyticsDashboard data={v15AnalyticsPreviewData} />)

    expect(
      screen.getByRole("heading", { name: "Strength Progress" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Interference Audit" })
    ).toBeVisible()
    expect(screen.getByRole("heading", { name: "Recovery IO" })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Monotony / Strain" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Coach Portfolio" })
    ).toBeVisible()
  })

  it("switches windows and updates displayed analytics values", async () => {
    const user = userEvent.setup()
    render(<V15AnalyticsDashboard data={v15AnalyticsPreviewData} />)

    expect(screen.getByText("Total volume load")).toBeVisible()
    expect(screen.getByText("8,560 kg")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "28 days" }))

    expect(screen.getByRole("button", { name: "28 days" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByText("22,980 kg")).toBeVisible()
  })

  it("shows conflict severity and coach exception statuses", () => {
    render(<V15AnalyticsDashboard data={v15AnalyticsPreviewData} />)

    expect(screen.getByText("High conflict")).toBeVisible()
    expect(screen.getByText("Critical")).toBeVisible()
    expect(screen.getByText("Watch")).toBeVisible()
    expect(screen.getByText("Stable")).toBeVisible()
  })

  it("renders resilient empty states for sparse windows", async () => {
    const user = userEvent.setup()
    render(<V15AnalyticsDashboard data={v15AnalyticsPreviewData} />)

    await user.click(screen.getByRole("button", { name: "Empty sample" }))

    expect(
      screen.getByText("No strength sessions in this window.")
    ).toBeVisible()
    expect(screen.getByText("No overlap conflicts detected.")).toBeVisible()
    expect(screen.getByText("No recovery data in this window.")).toBeVisible()
    expect(screen.getByText("No weekly load history available.")).toBeVisible()
    expect(screen.getByText("No athlete exceptions in scope.")).toBeVisible()
  })
})
