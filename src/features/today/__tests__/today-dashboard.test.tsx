import { render, screen, within } from "@testing-library/react"

import { TodayDashboard } from "@/features/today/components/today-dashboard"
import type { TodayDashboardData } from "@/features/today/types"

const todayData: TodayDashboardData = {
  snapshot: {
    neural: 7.0,
    metabolic: 5.4,
    mechanical: 4.9,
    recruitment: 4.9
  },
  combinedScore: {
    score: 6.8,
    interpretation: "probability next hard session degrades adaptation."
  },
  systemCapacity: {
    sleepQuality: 0.68,
    fuelQuality: 0.74,
    stressLevel: 0.32,
    gateMultiplier: 1.02
  },
  accumulation: {
    boundaryStart: "2026-02-15T10:30:00+00:00",
    boundaryEnd: "2026-02-15T16:00:00+00:00",
    includedSessionIds: ["s2", "s4"]
  },
  contributors: [
    {
      id: "s1",
      label: "Planned Threshold Intervals",
      href: "/sessions/s1"
    },
    {
      id: "s2",
      label: "Completed Back Squat",
      href: "/sessions/s2"
    },
    {
      id: "s4",
      label: "Completed Deadlift",
      href: "/sessions/s4"
    }
  ]
}

describe("TodayDashboard", () => {
  it("uses the shared app-shell layout contract", () => {
    render(<TodayDashboard data={todayData} />)

    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("data-layout", "app-shell")
    expect(main).toHaveClass("app-shell")
  })

  it("renders axis gauges, recruitment badge, and accumulation window context", () => {
    render(<TodayDashboard data={todayData} />)

    expect(screen.getByRole("heading", { name: "Today" })).toBeVisible()
    expect(screen.getByLabelText("Neural gauge")).toBeVisible()
    expect(screen.getByLabelText("Metabolic gauge")).toBeVisible()
    expect(screen.getByLabelText("Mechanical gauge")).toBeVisible()

    expect(screen.getByText("Recruitment 4.9")).toBeVisible()
    expect(
      screen.getByText(
        "Accumulation window: 2026-02-15T10:30:00+00:00 -> 2026-02-15T16:00:00+00:00"
      )
    ).toBeVisible()
  })

  it("keeps combined score and system capacity indicators in separate sections", () => {
    render(<TodayDashboard data={todayData} />)

    const combinedSection = screen.getByRole("region", {
      name: "Combined fatigue score"
    })
    expect(within(combinedSection).getByText("6.8")).toBeVisible()
    expect(
      within(combinedSection).getByText(
        "probability next hard session degrades adaptation."
      )
    ).toBeVisible()

    const systemCapacitySection = screen.getByRole("region", {
      name: "System capacity indicator"
    })
    expect(within(systemCapacitySection).getByText("Sleep")).toBeVisible()
    expect(within(systemCapacitySection).getByText("68%")).toBeVisible()
    expect(within(systemCapacitySection).getByText("Fuel")).toBeVisible()
    expect(within(systemCapacitySection).getByText("74%")).toBeVisible()
    expect(within(systemCapacitySection).getByText("Stress")).toBeVisible()
    expect(within(systemCapacitySection).getByText("32%")).toBeVisible()
    expect(within(systemCapacitySection).getByText("Gate")).toBeVisible()
    expect(within(systemCapacitySection).getByText("x1.02")).toBeVisible()
  })

  it("renders why-this chips as links and filters out non-accumulated sessions", () => {
    render(<TodayDashboard data={todayData} />)

    const whyThis = screen.getByRole("region", { name: "Why this today" })

    expect(
      within(whyThis).queryByRole("link", {
        name: "Planned Threshold Intervals"
      })
    ).not.toBeInTheDocument()

    expect(
      within(whyThis).getByRole("link", { name: "Completed Back Squat" })
    ).toHaveAttribute("href", "/sessions/s2")
    expect(
      within(whyThis).getByRole("link", { name: "Completed Deadlift" })
    ).toHaveAttribute("href", "/sessions/s4")
  })

  it("treats a score at 7.0 as red-zone threshold and shows empty contributor fallback", () => {
    render(
      <TodayDashboard
        data={{
          ...todayData,
          contributors: [],
          accumulation: {
            ...todayData.accumulation,
            includedSessionIds: []
          }
        }}
      />
    )

    expect(screen.getByLabelText("Neural risk band")).toHaveTextContent(
      "Red zone"
    )
    expect(
      screen.getByText("No completed contributing sessions in this window.")
    ).toBeVisible()
  })

  it("degrades gracefully when system-capacity values are missing", () => {
    render(
      <TodayDashboard
        data={{
          ...todayData,
          systemCapacity: {
            sleepQuality: null,
            fuelQuality: null,
            stressLevel: null,
            gateMultiplier: null
          }
        }}
      />
    )

    const systemCapacitySection = screen.getByRole("region", {
      name: "System capacity indicator"
    })
    expect(within(systemCapacitySection).getAllByText("n/a")).toHaveLength(4)
  })
})
