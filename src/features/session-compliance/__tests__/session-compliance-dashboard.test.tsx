import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SessionComplianceDashboard } from "@/features/session-compliance/components/session-compliance-dashboard"
import type { SessionComplianceData } from "@/features/session-compliance/types"

const data: SessionComplianceData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      sessions: [
        {
          id: "sc-1",
          label: "Back Squat",
          href: "/calendar?sessionId=sc-1",
          date: "2026-02-10",
          dayLabel: "Tue",
          planBlock: "Base",
          modality: "Strength",
          state: "completed"
        },
        {
          id: "sc-2",
          label: "Tempo Bike",
          href: "/calendar?sessionId=sc-2",
          date: "2026-02-11",
          dayLabel: "Wed",
          planBlock: "Build",
          modality: "Endurance",
          state: "moved"
        },
        {
          id: "sc-3",
          label: "Long Run",
          href: "/calendar?sessionId=sc-3",
          date: "2026-02-12",
          dayLabel: "Thu",
          planBlock: "Build",
          modality: "Endurance",
          state: "skipped"
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      sessions: [
        {
          id: "sc-4",
          label: "Bench Press",
          href: "/calendar?sessionId=sc-4",
          date: "2026-01-31",
          dayLabel: "31",
          planBlock: "Base",
          modality: "Strength",
          state: "completed"
        }
      ]
    }
  ]
}

describe("SessionComplianceDashboard", () => {
  it("renders planned/completed metrics and adherence status", () => {
    render(<SessionComplianceDashboard data={data} />)

    expect(screen.getByText("Planned sessions")).toBeVisible()
    expect(screen.getByText("Completed sessions")).toBeVisible()
    expect(screen.getByText("Move events")).toBeVisible()
    expect(screen.getByText("Skip events")).toBeVisible()
    expect(screen.getByText("Adherence")).toBeVisible()
    expect(screen.getByText("33%")).toBeVisible()
    expect(screen.getByText("Adherence state: Red")).toBeVisible()
  })

  it("supports window, plan block, and modality filters", async () => {
    const user = userEvent.setup()
    render(<SessionComplianceDashboard data={data} />)

    await user.click(screen.getByRole("button", { name: "30 days" }))
    expect(screen.getByText("100%")).toBeVisible()
    expect(screen.getByText("Adherence state: Green")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "7 days" }))
    await user.click(screen.getByRole("button", { name: "Plan block Build" }))
    expect(screen.getByText("0%")).toBeVisible()
    expect(screen.getByText("Move events")).toBeVisible()
    expect(screen.getByText(/1 moved/i)).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Modality Endurance" }))
    const plannedCard = screen.getByText("Planned sessions").closest("div")
    expect(plannedCard).not.toBeNull()
    expect(within(plannedCard as HTMLElement).getByText("2")).toBeVisible()
  })

  it("renders trend visuals and day drill-down links", async () => {
    const user = userEvent.setup()
    render(<SessionComplianceDashboard data={data} />)

    expect(
      screen.getByLabelText("Session compliance adherence trend")
    ).toBeVisible()
    expect(screen.getByLabelText("Session compliance move trend")).toBeVisible()
    expect(screen.getByLabelText("Session compliance skip trend")).toBeVisible()

    await user.hover(
      screen.getByRole("button", { name: "Wed compliance marker" })
    )

    const details = screen.getByRole("region", {
      name: "Session compliance day details"
    })
    expect(within(details).getByText("Tempo Bike")).toBeVisible()
    expect(
      within(details).getByRole("link", { name: "Tempo Bike" })
    ).toHaveAttribute("href", "/calendar?sessionId=sc-2")
  })
})
