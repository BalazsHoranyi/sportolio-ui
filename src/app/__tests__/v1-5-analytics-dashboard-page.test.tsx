import { render, screen } from "@testing-library/react"

import V15AnalyticsDashboardPage from "@/app/dashboard/v1-5-analytics/page"

describe("V15AnalyticsDashboardPage", () => {
  it("renders the v1.5 analytics pack dashboard", () => {
    render(<V15AnalyticsDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "v1.5 Analytics Pack" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "Strength Progress" })
    ).toBeVisible()
  })
})
