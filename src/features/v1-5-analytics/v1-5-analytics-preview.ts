import type { V15AnalyticsData } from "@/features/v1-5-analytics/types"

export const v15AnalyticsPreviewData: V15AnalyticsData = {
  defaultWindowKey: "7d",
  windows: [
    {
      key: "7d",
      label: "7 days",
      strengthSessions: [
        {
          id: "sq-1",
          date: "2026-02-10",
          lift: "Back squat",
          weightKg: 150,
          reps: 5,
          sets: 3,
          rpe: 8.5
        },
        {
          id: "sq-2",
          date: "2026-02-12",
          lift: "Back squat",
          weightKg: 155,
          reps: 4,
          sets: 3,
          rpe: 9.2
        },
        {
          id: "bp-1",
          date: "2026-02-11",
          lift: "Bench press",
          weightKg: 100,
          reps: 6,
          sets: 4,
          rpe: 7.4
        },
        {
          id: "bp-2",
          date: "2026-02-13",
          lift: "Bench press",
          weightKg: 102.5,
          reps: 5,
          sets: 4,
          rpe: 8.1
        }
      ],
      interferenceSignals: [
        {
          id: "int-1",
          primaryRegion: "posterior_chain",
          secondaryRegion: "calves",
          overlapScore: 0.82,
          sessions: ["dl-1", "bike-1"]
        },
        {
          id: "int-2",
          primaryRegion: "posterior_chain",
          secondaryRegion: "quads",
          overlapScore: 0.61,
          sessions: ["sq-2", "run-1"]
        }
      ],
      recoveryDays: [
        {
          date: "2026-02-10",
          sleepHours: 8.1,
          fuelScore: 8,
          stressScore: 3,
          nextDayOutputScore: 7.8
        },
        {
          date: "2026-02-11",
          sleepHours: 6.2,
          fuelScore: 5,
          stressScore: 7,
          nextDayOutputScore: 6.1
        },
        {
          date: "2026-02-12",
          sleepHours: 7.6,
          fuelScore: 7,
          stressScore: 4,
          nextDayOutputScore: 7.2
        }
      ],
      weeklyLoads: [
        {
          weekKey: "2026-W05",
          dailyLoads: [620, 540, 700, 0, 680, 520, 400]
        },
        {
          weekKey: "2026-W06",
          dailyLoads: [720, 710, 690, 680, 650, 640, 620]
        }
      ],
      athletes: [
        {
          athleteId: "ath-1",
          athleteName: "Alex K",
          highRiskDays: 3,
          missedSessions: 2,
          lowRecoveryDays: 1
        },
        {
          athleteId: "ath-2",
          athleteName: "Chris M",
          highRiskDays: 2,
          missedSessions: 1,
          lowRecoveryDays: 3
        },
        {
          athleteId: "ath-3",
          athleteName: "Bri V",
          highRiskDays: 1,
          missedSessions: 1,
          lowRecoveryDays: 0
        }
      ]
    },
    {
      key: "28d",
      label: "28 days",
      strengthSessions: [
        {
          id: "dl-11",
          date: "2026-01-20",
          lift: "Deadlift",
          weightKg: 200,
          reps: 5,
          sets: 4,
          rpe: 8.1
        },
        {
          id: "dl-12",
          date: "2026-01-25",
          lift: "Deadlift",
          weightKg: 210,
          reps: 4,
          sets: 4,
          rpe: 8.8
        },
        {
          id: "sq-11",
          date: "2026-01-22",
          lift: "Back squat",
          weightKg: 160,
          reps: 5,
          sets: 4,
          rpe: 7.9
        },
        {
          id: "sq-12",
          date: "2026-01-29",
          lift: "Back squat",
          weightKg: 170,
          reps: 3,
          sets: 4,
          rpe: 9.1
        },
        {
          id: "bp-11",
          date: "2026-01-18",
          lift: "Bench press",
          weightKg: 110,
          reps: 6,
          sets: 5,
          rpe: 7.6
        },
        {
          id: "bp-12",
          date: "2026-01-31",
          lift: "Bench press",
          weightKg: 115,
          reps: 5,
          sets: 4,
          rpe: 8.4
        },
        {
          id: "ohp-11",
          date: "2026-01-27",
          lift: "Overhead press",
          weightKg: 80,
          reps: 6,
          sets: 5,
          rpe: 7.2
        },
        {
          id: "ohp-12",
          date: "2026-02-01",
          lift: "Overhead press",
          weightKg: 85,
          reps: 7,
          sets: 4,
          rpe: 8.8
        }
      ],
      interferenceSignals: [
        {
          id: "int-8",
          primaryRegion: "hamstrings",
          secondaryRegion: "lower_back",
          overlapScore: 0.78,
          sessions: ["dl-12", "tempo-bike"]
        }
      ],
      recoveryDays: [
        {
          date: "2026-01-27",
          sleepHours: 7.9,
          fuelScore: 8,
          stressScore: 4,
          nextDayOutputScore: 7.6
        },
        {
          date: "2026-01-28",
          sleepHours: 7.4,
          fuelScore: 7,
          stressScore: 5,
          nextDayOutputScore: 7.4
        },
        {
          date: "2026-01-29",
          sleepHours: 8.3,
          fuelScore: 9,
          stressScore: 3,
          nextDayOutputScore: 8
        }
      ],
      weeklyLoads: [
        {
          weekKey: "2026-W04",
          dailyLoads: [580, 610, 640, 600, 670, 590, 520]
        },
        {
          weekKey: "2026-W05",
          dailyLoads: [620, 540, 700, 0, 680, 520, 400]
        },
        {
          weekKey: "2026-W06",
          dailyLoads: [720, 710, 690, 680, 650, 640, 620]
        }
      ],
      athletes: [
        {
          athleteId: "ath-1",
          athleteName: "Alex K",
          highRiskDays: 4,
          missedSessions: 3,
          lowRecoveryDays: 2
        },
        {
          athleteId: "ath-4",
          athleteName: "Dana R",
          highRiskDays: 2,
          missedSessions: 2,
          lowRecoveryDays: 2
        },
        {
          athleteId: "ath-5",
          athleteName: "Elliot P",
          highRiskDays: 0,
          missedSessions: 1,
          lowRecoveryDays: 1
        }
      ]
    },
    {
      key: "empty",
      label: "Empty sample",
      strengthSessions: [],
      interferenceSignals: [],
      recoveryDays: [],
      weeklyLoads: [],
      athletes: []
    }
  ]
}
