import type { AxisFatigueTrendsData } from "@/features/axis-fatigue-trends/types"

function buildMonthlyDays() {
  return Array.from({ length: 30 }, (_, index) => {
    const dayNumber = index + 1
    const paddedDay = String(dayNumber).padStart(2, "0")

    return {
      date: `2026-02-${paddedDay}`,
      dayLabel: String(dayNumber),
      planned: {
        neural: 5.8 + (index % 6) * 0.32,
        metabolic: 5.2 + (index % 5) * 0.28,
        mechanical: 5.6 + (index % 4) * 0.3,
        recruitment: 5.4 + (index % 5) * 0.25
      },
      completed: {
        neural: 5.5 + (index % 6) * 0.3,
        metabolic: 5 + (index % 5) * 0.26,
        mechanical: 5.3 + (index % 4) * 0.28,
        recruitment: 5.1 + (index % 5) * 0.22
      },
      plannedSessions:
        dayNumber === 9
          ? [
              {
                id: "p-9",
                label: "Planned Threshold Session",
                href: "/sessions/p-9"
              }
            ]
          : [],
      completedSessions:
        dayNumber === 9
          ? [
              {
                id: "c-9",
                label: "Completed Threshold Session",
                href: "/sessions/c-9"
              }
            ]
          : []
    }
  })
}

export const axisFatigueTrendsPreviewData: AxisFatigueTrendsData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      days: [
        {
          date: "2026-02-10",
          dayLabel: "Tue",
          planned: {
            neural: 6.4,
            metabolic: 5.7,
            mechanical: 6,
            recruitment: 5.8
          },
          completed: {
            neural: 6,
            metabolic: 5.3,
            mechanical: 5.7,
            recruitment: 5.5
          },
          plannedSessions: [
            {
              id: "p-1",
              label: "Planned Tempo Run",
              href: "/sessions/p-1"
            }
          ],
          completedSessions: []
        },
        {
          date: "2026-02-11",
          dayLabel: "Wed",
          planned: {
            neural: 7.1,
            metabolic: 6.3,
            mechanical: 6.8,
            recruitment: 6.4
          },
          completed: {
            neural: 6.8,
            metabolic: 6,
            mechanical: 6.4,
            recruitment: 6.1
          },
          plannedSessions: [],
          completedSessions: [
            {
              id: "c-1",
              label: "Back Squat",
              href: "/sessions/c-1"
            }
          ]
        },
        {
          date: "2026-02-12",
          dayLabel: "Thu",
          planned: {
            neural: 6.7,
            metabolic: 6.1,
            mechanical: 6.3,
            recruitment: 6
          },
          completed: {
            neural: 6.5,
            metabolic: 5.9,
            mechanical: 6,
            recruitment: 5.8
          },
          plannedSessions: [
            {
              id: "p-2",
              label: "Planned Recovery Ride",
              href: "/sessions/p-2"
            }
          ],
          completedSessions: [
            {
              id: "c-2",
              label: "Completed Recovery Ride",
              href: "/sessions/c-2"
            }
          ]
        },
        {
          date: "2026-02-13",
          dayLabel: "Fri",
          planned: {
            neural: 7.4,
            metabolic: 6.7,
            mechanical: 7,
            recruitment: 6.8
          },
          completed: {
            neural: 7,
            metabolic: 6.4,
            mechanical: 6.7,
            recruitment: 6.5
          },
          plannedSessions: [
            {
              id: "p-3",
              label: "Planned Deadlift",
              href: "/sessions/p-3"
            }
          ],
          completedSessions: [
            {
              id: "c-3",
              label: "Completed Deadlift",
              href: "/sessions/c-3"
            }
          ]
        },
        {
          date: "2026-02-14",
          dayLabel: "Sat",
          planned: {
            neural: 6.3,
            metabolic: 5.9,
            mechanical: 6.1,
            recruitment: 5.9
          },
          completed: {
            neural: 6.1,
            metabolic: 5.6,
            mechanical: 5.9,
            recruitment: 5.7
          },
          plannedSessions: [],
          completedSessions: []
        },
        {
          date: "2026-02-15",
          dayLabel: "Sun",
          planned: {
            neural: 6,
            metabolic: 5.5,
            mechanical: 5.8,
            recruitment: 5.5
          },
          completed: {
            neural: 5.8,
            metabolic: 5.3,
            mechanical: 5.6,
            recruitment: 5.4
          },
          plannedSessions: [
            {
              id: "p-4",
              label: "Planned Long Run",
              href: "/sessions/p-4"
            }
          ],
          completedSessions: [
            {
              id: "c-4",
              label: "Completed Long Run",
              href: "/sessions/c-4"
            }
          ]
        },
        {
          date: "2026-02-16",
          dayLabel: "Mon",
          planned: {
            neural: 5.7,
            metabolic: 5.2,
            mechanical: 5.4,
            recruitment: 5.3
          },
          completed: {
            neural: 5.5,
            metabolic: 5,
            mechanical: 5.2,
            recruitment: 5.1
          },
          plannedSessions: [],
          completedSessions: []
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      days: buildMonthlyDays()
    }
  ]
}
