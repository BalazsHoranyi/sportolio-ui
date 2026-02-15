import { render, screen } from "@testing-library/react"

import SessionComplianceDashboardPage from "@/app/dashboard/session-compliance/page"

describe("SessionComplianceDashboardPage", () => {
  it("renders the launch session compliance dashboard", () => {
    render(<SessionComplianceDashboardPage />)

    expect(
      screen.getByRole("heading", { name: "Session Compliance" })
    ).toBeVisible()
    expect(
      screen.getByLabelText("Session compliance adherence trend")
    ).toBeVisible()
  })
})
