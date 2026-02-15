import { render, screen } from "@testing-library/react"

import EnduranceProgressDashboardPage from "@/app/dashboard/endurance-progress/page"

describe("EnduranceProgressDashboardPage", () => {
  it("renders the launch endurance progress dashboard", () => {
    render(<EnduranceProgressDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "Endurance Progress" })
    ).toBeVisible()
    expect(
      screen.getByLabelText("Endurance threshold trend chart")
    ).toBeVisible()
  })
})
