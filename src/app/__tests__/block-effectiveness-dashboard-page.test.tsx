import { render, screen } from "@testing-library/react"

import BlockEffectivenessDashboardPage from "@/app/dashboard/block-effectiveness/page"

describe("BlockEffectivenessDashboardPage", () => {
  it("renders the launch block effectiveness dashboard", () => {
    render(<BlockEffectivenessDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "Block Effectiveness" })
    ).toBeVisible()
    expect(
      screen.getByRole("table", { name: "Block effectiveness metrics" })
    ).toBeVisible()
  })
})
