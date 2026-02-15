import type { MonthlyAuditChartData } from "@/features/audit/types"

function buildWindow(
  monthLabel: string,
  monthPrefix: string,
  seriesState: "planned" | "completed"
) {
  return {
    monthLabel,
    seriesState,
    days: Array.from({ length: 30 }, (_, index) => {
      const dayNumber = index + 1
      const paddedDay = String(dayNumber).padStart(2, "0")

      return {
        dayLabel: String(dayNumber),
        date: `${monthPrefix}-${paddedDay}`,
        neural: 5.5 + (index % 5) * 0.3,
        metabolic: 4.9 + (index % 6) * 0.3,
        mechanical: 5.2 + (index % 4) * 0.35,
        recruitment: 5.1 + (index % 5) * 0.2,
        sessions:
          dayNumber === 15
            ? [
                {
                  id: `${monthPrefix}-15`,
                  label: "Tempo Ride",
                  href: "/sessions/15"
                }
              ]
            : []
      }
    })
  }
}

export const monthlyAuditPreviewData: MonthlyAuditChartData = {
  windows: [
    buildWindow("Feb 2026", "2026-02", "planned"),
    buildWindow("Mar 2026", "2026-03", "completed")
  ]
}
