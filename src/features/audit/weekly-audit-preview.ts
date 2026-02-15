import type { WeeklyAuditChartData } from "@/features/audit/types"

export const weeklyAuditPreviewData: WeeklyAuditChartData = {
  weekLabel: "Week of Feb 10, 2026",
  days: [
    {
      dayLabel: "Mon",
      date: "2026-02-10",
      neural: 6.2,
      metabolic: 5.1,
      mechanical: 5.8,
      recruitment: 5.4,
      sessions: [{ id: "s-1", label: "Back Squat", href: "/sessions/s-1" }]
    },
    {
      dayLabel: "Tue",
      date: "2026-02-11",
      neural: 6.9,
      metabolic: 6.1,
      mechanical: 6.3,
      recruitment: 6,
      sessions: []
    },
    {
      dayLabel: "Wed",
      date: "2026-02-12",
      neural: 7,
      metabolic: 6.7,
      mechanical: 6.9,
      recruitment: 6.6,
      sessions: [
        { id: "s-2", label: "Tempo Run", href: "/sessions/s-2" },
        { id: "s-3", label: "Accessory Circuit", href: "/sessions/s-3" }
      ]
    },
    {
      dayLabel: "Thu",
      date: "2026-02-13",
      neural: 6.4,
      metabolic: 5.9,
      mechanical: 6,
      recruitment: 5.9,
      sessions: [{ id: "s-4", label: "Recovery Ride", href: "/sessions/s-4" }]
    },
    {
      dayLabel: "Fri",
      date: "2026-02-14",
      neural: 7.1,
      metabolic: 6.8,
      mechanical: 7,
      recruitment: 6.8,
      sessions: [{ id: "s-5", label: "Deadlift", href: "/sessions/s-5" }]
    },
    {
      dayLabel: "Sat",
      date: "2026-02-15",
      neural: 6.5,
      metabolic: 6.2,
      mechanical: 6.1,
      recruitment: 6,
      sessions: []
    },
    {
      dayLabel: "Sun",
      date: "2026-02-16",
      neural: 5.9,
      metabolic: 5.5,
      mechanical: 5.7,
      recruitment: 5.6,
      sessions: [{ id: "s-6", label: "Long Run", href: "/sessions/s-6" }]
    }
  ]
}
