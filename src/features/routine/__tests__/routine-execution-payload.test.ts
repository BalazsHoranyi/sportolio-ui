import { buildRoutineExecutionPayload } from "@/features/routine/routine-execution-payload"
import type { RoutineDraft } from "@/features/routine/types"

const HYBRID_DRAFT: RoutineDraft = {
  name: "Hybrid Builder",
  path: "strength",
  strength: {
    exerciseIds: ["ex-1", "ex-unknown"],
    variables: [],
    blocks: [
      {
        id: "block-1",
        name: "Primary",
        repeatCount: 2,
        condition: "",
        exercises: [
          {
            id: "entry-1",
            exerciseId: "ex-1",
            condition: "",
            sets: [
              {
                id: "set-1",
                reps: 5,
                load: "100kg",
                restSeconds: 120,
                timerSeconds: null,
                progression: {
                  strategy: "linear",
                  value: "+2.5kg/week"
                },
                condition: ""
              }
            ]
          },
          {
            id: "entry-2",
            exerciseId: "ex-unknown",
            condition: "",
            sets: [
              {
                id: "set-2",
                reps: 8,
                load: "70kg",
                restSeconds: 90,
                timerSeconds: 45,
                progression: {
                  strategy: "none",
                  value: ""
                },
                condition: "lastSetRpe<=8"
              }
            ]
          }
        ]
      }
    ]
  },
  endurance: {
    timeline: [
      {
        kind: "interval",
        id: "int-1",
        label: "Warmup",
        durationSeconds: 300,
        targetType: "power",
        targetValue: 220
      },
      {
        kind: "block",
        id: "blk-1",
        label: "Main Set",
        repeats: 2,
        children: [
          {
            kind: "interval",
            id: "int-2",
            label: "Threshold",
            durationSeconds: 240,
            targetType: "pace",
            targetValue: 405
          },
          {
            kind: "block",
            id: "blk-2",
            label: "Kick",
            repeats: 2,
            children: [
              {
                kind: "interval",
                id: "int-3",
                label: "Sprint",
                durationSeconds: 45,
                targetType: "cadence",
                targetValue: 100
              }
            ]
          }
        ]
      }
    ],
    reusableBlocks: []
  }
}

describe("routine-execution-payload", () => {
  it("builds deterministic tracking payloads with expanded repeats and nested intervals", () => {
    const first = buildRoutineExecutionPayload(HYBRID_DRAFT)
    const second = buildRoutineExecutionPayload(HYBRID_DRAFT)

    expect(second).toEqual(first)
    expect(first).toMatchObject({
      schema_version: "1.0",
      routine_name: "Hybrid Builder",
      path: "strength"
    })

    expect(first.strength_sets).toHaveLength(4)
    expect(first.strength_sets[0]).toMatchObject({
      sequence: 1,
      block_id: "block-1",
      block_repeat_index: 1,
      exercise_id: "ex-1",
      exercise_name: "Back Squat",
      progression: "linear(+2.5kg/week)"
    })
    expect(first.strength_sets[1]).toMatchObject({
      sequence: 2,
      block_repeat_index: 1,
      exercise_id: "ex-unknown",
      exercise_name: "ex-unknown",
      progression: null,
      condition: "lastSetRpe<=8"
    })
    expect(first.strength_sets[3]).toMatchObject({
      sequence: 4,
      block_repeat_index: 2,
      exercise_id: "ex-unknown"
    })

    expect(first.endurance_intervals).toHaveLength(7)
    expect(first.endurance_intervals[0]).toMatchObject({
      sequence: 1,
      interval_id: "int-1",
      label: "Warmup",
      block_path: []
    })
    expect(first.endurance_intervals[1]).toMatchObject({
      sequence: 2,
      interval_id: "int-2",
      block_path: ["blk-1#1"]
    })
    expect(first.endurance_intervals[2]).toMatchObject({
      sequence: 3,
      interval_id: "int-3",
      block_path: ["blk-1#1", "blk-2#1"]
    })
    expect(first.endurance_intervals[6]).toMatchObject({
      sequence: 7,
      interval_id: "int-3",
      block_path: ["blk-1#2", "blk-2#2"]
    })
  })
})
