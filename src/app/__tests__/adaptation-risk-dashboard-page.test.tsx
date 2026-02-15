import { render, screen } from "@testing-library/react"

import AdaptationRiskDashboardPage from "@/app/dashboard/adaptation-risk/page"

describe("AdaptationRiskDashboardPage", () => {
  it("renders the launch adaptation risk timeline dashboard", () => {
    render(<AdaptationRiskDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "Adaptation Risk Timeline" })
    ).toBeVisible()
    expect(
      screen.getByLabelText("Adaptation risk timeline chart")
    ).toBeVisible()
  })
})
