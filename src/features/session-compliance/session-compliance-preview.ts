import type { SessionComplianceData } from "@/features/session-compliance/types"

function buildThirtyDaySessions() {
  return Array.from({ length: 30 }, (_, index) => {
    const dayNumber = index + 1
    const paddedDay = String(dayNumber).padStart(2, "0")
    const stateIndex = index % 4
    const state = ["completed", "planned", "moved", "skipped"][stateIndex]

    return {
      id: `m-${dayNumber}`,
      label: `Session ${dayNumber}`,
      href: `/calendar?sessionId=m-${dayNumber}`,
      date: `2026-01-${paddedDay}`,
      dayLabel: String(dayNumber),
      planBlock: dayNumber <= 15 ? "Base" : "Build",
      modality: dayNumber % 2 === 0 ? "Strength" : "Endurance",
      state
    }
  })
}

export const sessionCompliancePreviewData: SessionComplianceData = {
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
        },
        {
          id: "sc-4",
          label: "Bench Press",
          href: "/calendar?sessionId=sc-4",
          date: "2026-02-13",
          dayLabel: "Fri",
          planBlock: "Base",
          modality: "Strength",
          state: "planned"
        }
      ]
    },
    {
      key: "30d",
      label: "30 days",
      sessions: buildThirtyDaySessions()
    }
  ]
}
