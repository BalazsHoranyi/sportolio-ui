import type { BlockEffectivenessData } from "@/features/block-effectiveness/types"

export const blockEffectivenessPreviewData: BlockEffectivenessData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      blocks: [
        {
          key: "base",
          label: "Base",
          startDate: "2026-02-03",
          metrics: [
            {
              key: "squat_1rm",
              label: "Back squat estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 170,
              realizedValue: 172,
              direction: "higher",
              confidence: 0.86,
              sampleSize: 5,
              contributors: [
                {
                  id: "be-1",
                  label: "Back squat top set",
                  href: "/sessions/be-1"
                }
              ]
            },
            {
              key: "threshold_pace",
              label: "Threshold pace",
              objectiveType: "endurance",
              unit: "min/km",
              targetValue: 4.2,
              realizedValue: 4.11,
              direction: "lower",
              confidence: 0.74,
              sampleSize: 3,
              contributors: [
                {
                  id: "be-2",
                  label: "Tempo run progression",
                  href: "/sessions/be-2"
                }
              ]
            }
          ]
        },
        {
          key: "build",
          label: "Build",
          startDate: "2026-02-10",
          metrics: [
            {
              key: "threshold_power",
              label: "Threshold power",
              objectiveType: "endurance",
              unit: "W",
              targetValue: 282,
              realizedValue: 274,
              direction: "higher",
              confidence: 0.44,
              sampleSize: 2,
              contributors: []
            },
            {
              key: "deadlift_1rm",
              label: "Deadlift estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 208,
              realizedValue: 212,
              direction: "higher",
              confidence: 0.71,
              sampleSize: 4,
              contributors: [
                {
                  id: "be-3",
                  label: "Deadlift top single",
                  href: "/sessions/be-3"
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
      blocks: [
        {
          key: "accumulation",
          label: "Accumulation",
          startDate: "2026-01-15",
          metrics: [
            {
              key: "threshold_power",
              label: "Threshold power",
              objectiveType: "endurance",
              unit: "W",
              targetValue: 275,
              realizedValue: 279,
              direction: "higher",
              confidence: 0.85,
              sampleSize: 8,
              contributors: []
            }
          ]
        },
        {
          key: "specialization",
          label: "Specialization",
          startDate: "2026-01-29",
          metrics: [
            {
              key: "squat_1rm",
              label: "Back squat estimated 1RM",
              objectiveType: "strength",
              unit: "kg",
              targetValue: 168,
              realizedValue: 169,
              direction: "higher",
              confidence: 0.81,
              sampleSize: 7,
              contributors: []
            }
          ]
        }
      ]
    }
  ]
}
