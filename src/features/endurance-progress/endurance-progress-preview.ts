import type { EnduranceProgressData } from "@/features/endurance-progress/types"

function buildThirtyDayPacePoints() {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1
    const paddedDay = String(day).padStart(2, "0")
    return {
      date: `2026-01-${paddedDay}`,
      dayLabel: String(day),
      value: 4.5 - (index % 8) * 0.03,
      confidence: 0.55 + (index % 4) * 0.08,
      inferred: true,
      contributors:
        day === 18
          ? [
              {
                id: "ep-18",
                label: "Completed threshold progression run",
                href: "/sessions/ep-18"
              }
            ]
          : []
    }
  })
}

function buildThirtyDayPowerPoints() {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1
    const paddedDay = String(day).padStart(2, "0")
    return {
      date: `2026-01-${paddedDay}`,
      dayLabel: String(day),
      value: 272 + (index % 10) * 2,
      confidence: 0.58 + (index % 5) * 0.07,
      inferred: true,
      contributors: []
    }
  })
}

export const enduranceProgressPreviewData: EnduranceProgressData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      zoneDistribution: [
        { zone: "z1", minutes: 110 },
        { zone: "z2", minutes: 78 },
        { zone: "z3", minutes: 42 },
        { zone: "z4", minutes: 24 },
        { zone: "z5", minutes: 16 }
      ],
      thresholdMetrics: [
        {
          key: "pace",
          label: "Threshold pace",
          unit: "min/km",
          points: [
            {
              date: "2026-02-10",
              dayLabel: "Tue",
              value: 4.32,
              confidence: 0.95,
              inferred: false,
              contributors: []
            },
            {
              date: "2026-02-11",
              dayLabel: "Wed",
              value: 4.26,
              confidence: 0.66,
              inferred: true,
              contributors: [
                {
                  id: "ep-2",
                  label: "Completed threshold tempo blocks",
                  href: "/sessions/ep-2"
                }
              ]
            },
            {
              date: "2026-02-12",
              dayLabel: "Thu",
              value: 4.22,
              confidence: 0.72,
              inferred: true,
              contributors: []
            },
            {
              date: "2026-02-13",
              dayLabel: "Fri",
              value: 4.24,
              confidence: 0.94,
              inferred: false,
              contributors: []
            }
          ]
        },
        {
          key: "power",
          label: "Threshold power",
          unit: "W",
          points: [
            {
              date: "2026-02-10",
              dayLabel: "Tue",
              value: 281,
              confidence: 0.82,
              inferred: true,
              contributors: []
            },
            {
              date: "2026-02-11",
              dayLabel: "Wed",
              value: 286,
              confidence: 0.88,
              inferred: true,
              contributors: []
            },
            {
              date: "2026-02-12",
              dayLabel: "Thu",
              value: 288,
              confidence: 0.93,
              inferred: false,
              contributors: [
                {
                  id: "ep-6",
                  label: "Completed 3x12 threshold intervals",
                  href: "/sessions/ep-6"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      zoneDistribution: [
        { zone: "z1", minutes: 440 },
        { zone: "z2", minutes: 330 },
        { zone: "z3", minutes: 210 },
        { zone: "z4", minutes: 140 },
        { zone: "z5", minutes: 90 }
      ],
      thresholdMetrics: [
        {
          key: "pace",
          label: "Threshold pace",
          unit: "min/km",
          points: buildThirtyDayPacePoints()
        },
        {
          key: "power",
          label: "Threshold power",
          unit: "W",
          points: buildThirtyDayPowerPoints()
        }
      ]
    }
  ]
}
