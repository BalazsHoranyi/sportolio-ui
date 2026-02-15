import { render, screen } from "@testing-library/react"

import RoutinePage from "@/app/routine/page"

describe("RoutinePage", () => {
  it("renders the routine creation flow", () => {
    render(<RoutinePage />)

    expect(
      screen.getByRole("heading", { name: "Routine Creation Flow" })
    ).toBeVisible()
  })
})
