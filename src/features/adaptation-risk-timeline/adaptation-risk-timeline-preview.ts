import type { AdaptationRiskTimelineData } from "@/features/adaptation-risk-timeline/types"

function buildThirtyDayPoints() {
  return Array.from({ length: 30 }, (_, index) => {
    const dayNumber = index + 1
    const paddedDay = String(dayNumber).padStart(2, "0")

    return {
      date: `2026-01-${paddedDay}`,
      dayLabel: String(dayNumber),
      combinedFatigueScore: 4.7 + (index % 7) * 0.43,
      systemCapacityGate: 0.9 + (index % 5) * 0.04,
      contributors:
        dayNumber === 18
          ? [
              {
                id: "s-18",
                label: "Completed Sweet Spot Session",
                href: "/sessions/s-18"
              }
            ]
          : []
    }
  })
}

export const adaptationRiskTimelinePreviewData: AdaptationRiskTimelineData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      points: [
        {
          date: "2026-02-10",
          dayLabel: "Tue",
          combinedFatigueScore: 4.5,
          systemCapacityGate: 1.01,
          contributors: []
        },
        {
          date: "2026-02-11",
          dayLabel: "Wed",
          combinedFatigueScore: 6.2,
          systemCapacityGate: 1.08,
          contributors: [
            {
              id: "s-1",
              label: "Completed VO2 Intervals",
              href: "/sessions/s-1"
            }
          ]
        },
        {
          date: "2026-02-12",
          dayLabel: "Thu",
          combinedFatigueScore: 6.9,
          systemCapacityGate: 1.03,
          contributors: [
            {
              id: "s-2",
              label: "Completed Back Squat",
              href: "/sessions/s-2"
            },
            {
              id: "s-3",
              label: "Completed Tempo Run",
              href: "/sessions/s-3"
            }
          ]
        },
        {
          date: "2026-02-13",
          dayLabel: "Fri",
          combinedFatigueScore: 7.4,
          systemCapacityGate: 0.98,
          contributors: [
            {
              id: "s-4",
              label: "Completed Deadlift",
              href: "/sessions/s-4"
            }
          ]
        },
        {
          date: "2026-02-14",
          dayLabel: "Sat",
          combinedFatigueScore: 5.8,
          systemCapacityGate: 0.95,
          contributors: []
        },
        {
          date: "2026-02-15",
          dayLabel: "Sun",
          combinedFatigueScore: 5.1,
          systemCapacityGate: 0.92,
          contributors: []
        },
        {
          date: "2026-02-16",
          dayLabel: "Mon",
          combinedFatigueScore: 4.8,
          systemCapacityGate: 0.94,
          contributors: []
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      points: buildThirtyDayPoints()
    }
  ]
}
