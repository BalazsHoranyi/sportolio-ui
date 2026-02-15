import type { TodayDashboardData } from "@/features/today/types"

export const TODAY_DASHBOARD_PREVIEW: TodayDashboardData = {
  snapshot: {
    neural: 6.9,
    metabolic: 5.7,
    mechanical: 5.2,
    recruitment: 5.2
  },
  combinedScore: {
    score: 6.4,
    interpretation: "probability next hard session degrades adaptation."
  },
  systemCapacity: {
    sleepQuality: 0.72,
    fuelQuality: 0.76,
    stressLevel: 0.34,
    gateMultiplier: 1.01
  },
  accumulation: {
    boundaryStart: "2026-02-15T10:30:00+00:00",
    boundaryEnd: "2026-02-15T16:00:00+00:00",
    includedSessionIds: ["s2", "s4"]
  },
  contributors: [
    {
      id: "s1",
      label: "Planned Tempo Block",
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
