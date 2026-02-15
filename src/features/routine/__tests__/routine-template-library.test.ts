import {
  buildRoutineTemplate,
  filterRoutineTemplates,
  instantiateRoutineTemplate
} from "@/features/routine/routine-template-library"
import type { RoutineDraft } from "@/features/routine/types"

function createSampleDraft(): RoutineDraft {
  return {
    name: "Threshold Builder",
    path: "endurance",
    strength: {
      exerciseIds: ["ex-1"],
      variables: [],
      blocks: [
        {
          id: "block-1",
          name: "Primary block",
          repeatCount: 1,
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
                    strategy: "none",
                    value: ""
                  },
                  condition: ""
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
          label: "Threshold",
          durationSeconds: 480,
          targetType: "power",
          targetValue: 300
        }
      ],
      reusableBlocks: []
    }
  }
}

describe("routine-template-library", () => {
  it("saves a routine as a template with normalized tags", () => {
    const template = buildRoutineTemplate({
      routine: createSampleDraft(),
      ownerRole: "coach",
      ownerId: "coach-1",
      visibility: "shared",
      tags: [" Endurance ", "power", "power"],
      idFactory: () => "tpl-1",
      now: "2026-02-15T07:30:00.000Z"
    })

    expect(template).toMatchObject({
      id: "tpl-1",
      name: "Threshold Builder",
      path: "endurance",
      tags: ["endurance", "power"],
      ownerRole: "coach",
      visibility: "shared"
    })
  })

  it("filters templates by modality and tags", () => {
    const templates = [
      buildRoutineTemplate({
        routine: {
          ...createSampleDraft(),
          name: "Bike VO2"
        },
        ownerRole: "coach",
        ownerId: "coach-1",
        visibility: "shared",
        tags: ["bike", "vo2"],
        idFactory: () => "tpl-1",
        now: "2026-02-15T07:30:00.000Z"
      }),
      buildRoutineTemplate({
        routine: {
          ...createSampleDraft(),
          name: "Strength Day",
          path: "strength"
        },
        ownerRole: "coach",
        ownerId: "coach-1",
        visibility: "shared",
        tags: ["strength"],
        idFactory: () => "tpl-2",
        now: "2026-02-15T07:30:00.000Z"
      })
    ]

    const filtered = filterRoutineTemplates(templates, {
      modality: "endurance",
      tags: ["vo2"]
    })

    expect(filtered.map((entry) => entry.name)).toEqual(["Bike VO2"])
  })

  it("instantiates an independent routine copy with source attribution", () => {
    const template = buildRoutineTemplate({
      routine: createSampleDraft(),
      ownerRole: "coach",
      ownerId: "coach-1",
      visibility: "shared",
      tags: ["endurance"],
      idFactory: () => "tpl-1",
      now: "2026-02-15T07:30:00.000Z"
    })

    let idCounter = 1
    const result = instantiateRoutineTemplate({
      template,
      actorRole: "athlete",
      actorId: "athlete-1",
      context: "micro",
      idFactory: (prefix) => {
        const id = `${prefix}-copy-${idCounter}`
        idCounter += 1
        return id
      },
      now: "2026-02-15T07:31:00.000Z"
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error("Expected template instantiation to succeed")
    }

    expect(result.routine.templateSource).toMatchObject({
      templateId: "tpl-1",
      templateName: "Threshold Builder",
      context: "micro",
      ownerRole: "coach",
      ownerId: "coach-1"
    })

    result.routine.name = "Edited Instance"
    expect(template.routine.name).toBe("Threshold Builder")
  })

  it("blocks athlete access to private coach templates", () => {
    const privateCoachTemplate = buildRoutineTemplate({
      routine: createSampleDraft(),
      ownerRole: "coach",
      ownerId: "coach-1",
      visibility: "private",
      tags: [],
      idFactory: () => "tpl-1",
      now: "2026-02-15T07:30:00.000Z"
    })

    const deniedResult = instantiateRoutineTemplate({
      template: privateCoachTemplate,
      actorRole: "athlete",
      actorId: "athlete-1",
      context: "macro",
      idFactory: (prefix) => `${prefix}-copy`,
      now: "2026-02-15T07:32:00.000Z"
    })

    expect(deniedResult).toEqual({
      ok: false,
      error: "You do not have permission to instantiate this template."
    })
  })
})
