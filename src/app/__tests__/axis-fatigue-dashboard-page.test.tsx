import { render, screen } from "@testing-library/react"

import AxisFatigueDashboardPage from "@/app/dashboard/axis-fatigue/page"

describe("AxisFatigueDashboardPage", () => {
  it("renders the launch axis fatigue trends dashboard", () => {
    render(<AxisFatigueDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "Axis Fatigue Trends" })
    ).toBeVisible()
    expect(screen.getByLabelText("Axis fatigue trends chart")).toBeVisible()
  })
})
