import type {
  EnduranceBlockNode,
  EnduranceTimelineNode,
  RoutineDraft,
  RoutinePath,
  RoutineTemplate,
  RoutineTemplateContext,
  RoutineTemplateOwnerRole,
  RoutineTemplateSource,
  RoutineTemplateVisibility,
  StrengthBlockDraft
} from "@/features/routine/types"

const SHARED_COACH_TEMPLATE = {
  ownerRole: "coach",
  visibility: "shared"
} as const

type BuildRoutineTemplateOptions = {
  routine: RoutineDraft
  ownerRole: RoutineTemplateOwnerRole
  ownerId: string
  visibility: RoutineTemplateVisibility
  tags: string[]
  name?: string
  idFactory?: () => string
  now?: string
}

type InstantiateRoutineTemplateOptions = {
  template: RoutineTemplate
  actorRole: RoutineTemplateOwnerRole
  actorId: string
  context: RoutineTemplateContext
  idFactory?: (prefix: string) => string
  now?: string
}

type TemplateFilter = {
  query?: string
  modality?: RoutinePath | "all"
  tags?: string[]
}

type TemplateAccessParams = {
  template: RoutineTemplate
  actorRole: RoutineTemplateOwnerRole
  actorId: string
}

type InstantiateRoutineTemplateResult =
  | {
      ok: true
      routine: RoutineDraft
    }
  | {
      ok: false
      error: string
    }

function buildDefaultTemplateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `tpl-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag).filter((entry) => entry.length > 0)

  return [...new Set(normalized)]
}

function cloneRoutineWithoutSource(routine: RoutineDraft): RoutineDraft {
  const cloned = structuredClone(routine)
  delete cloned.templateSource
  return cloned
}

function cloneStrengthBlocksWithFreshIds(
  blocks: StrengthBlockDraft[],
  idFactory: (prefix: string) => string
): StrengthBlockDraft[] {
  return blocks.map((block) => ({
    ...block,
    id: idFactory("block"),
    exercises: block.exercises.map((exercise) => ({
      ...exercise,
      id: idFactory("entry"),
      sets: exercise.sets.map((set) => ({
        ...set,
        id: idFactory("set")
      }))
    }))
  }))
}

function cloneTimelineNodeWithFreshIds(
  node: EnduranceTimelineNode,
  idFactory: (prefix: string) => string
): EnduranceTimelineNode {
  if (node.kind === "interval") {
    return {
      ...node,
      id: idFactory("int")
    }
  }

  return {
    ...node,
    id: idFactory("blk"),
    children: node.children.map((child) =>
      cloneTimelineNodeWithFreshIds(child, idFactory)
    )
  }
}

function cloneReusableBlockWithFreshIds(
  block: EnduranceBlockNode,
  idFactory: (prefix: string) => string
): EnduranceBlockNode {
  const cloned = cloneTimelineNodeWithFreshIds(block, idFactory)
  return cloned as EnduranceBlockNode
}

function cloneRoutineWithFreshIds(
  routine: RoutineDraft,
  idFactory: (prefix: string) => string
): RoutineDraft {
  return {
    ...structuredClone(routine),
    strength: {
      ...routine.strength,
      variables: routine.strength.variables.map((variable) => ({
        ...variable,
        id: idFactory("var")
      })),
      blocks: cloneStrengthBlocksWithFreshIds(
        routine.strength.blocks,
        idFactory
      )
    },
    endurance: {
      ...routine.endurance,
      timeline: routine.endurance.timeline.map((node) =>
        cloneTimelineNodeWithFreshIds(node, idFactory)
      ),
      reusableBlocks: routine.endurance.reusableBlocks.map((template) => ({
        ...template,
        id: idFactory("tplblk"),
        block: cloneReusableBlockWithFreshIds(template.block, idFactory)
      }))
    }
  }
}

export function parseTemplateTagInput(value: string): string[] {
  return normalizeTags(value.split(","))
}

export function buildRoutineTemplate({
  routine,
  ownerRole,
  ownerId,
  visibility,
  tags,
  name,
  idFactory,
  now
}: BuildRoutineTemplateOptions): RoutineTemplate {
  const nextId = idFactory ?? buildDefaultTemplateId

  return {
    id: nextId(),
    name: (name ?? routine.name).trim() || routine.name,
    path: routine.path,
    tags: normalizeTags(tags),
    ownerRole,
    ownerId,
    visibility,
    createdAt: now ?? new Date().toISOString(),
    routine: cloneRoutineWithoutSource(routine)
  }
}

export function filterRoutineTemplates(
  templates: RoutineTemplate[],
  filter: TemplateFilter
): RoutineTemplate[] {
  const query = filter.query?.trim().toLowerCase() ?? ""
  const requiredTags = normalizeTags(filter.tags ?? [])

  return templates.filter((template) => {
    if (
      filter.modality &&
      filter.modality !== "all" &&
      template.path !== filter.modality
    ) {
      return false
    }

    if (
      query.length > 0 &&
      !template.name.toLowerCase().includes(query) &&
      !template.tags.some((tag) => tag.includes(query))
    ) {
      return false
    }

    if (requiredTags.length > 0) {
      return requiredTags.every((tag) => template.tags.includes(tag))
    }

    return true
  })
}

export function canInstantiateRoutineTemplate({
  template,
  actorRole,
  actorId
}: TemplateAccessParams): boolean {
  if (template.ownerRole === actorRole && template.ownerId === actorId) {
    return true
  }

  if (
    template.ownerRole === SHARED_COACH_TEMPLATE.ownerRole &&
    template.visibility === SHARED_COACH_TEMPLATE.visibility &&
    actorRole === "athlete"
  ) {
    return true
  }

  return false
}

export function instantiateRoutineTemplate({
  template,
  actorRole,
  actorId,
  context,
  idFactory,
  now
}: InstantiateRoutineTemplateOptions): InstantiateRoutineTemplateResult {
  if (!canInstantiateRoutineTemplate({ template, actorRole, actorId })) {
    return {
      ok: false,
      error: "You do not have permission to instantiate this template."
    }
  }

  let counter = 1
  const nextIdFactory =
    idFactory ??
    ((prefix: string) => {
      const nextId = `${prefix}-${counter}`
      counter += 1
      return nextId
    })

  const clonedRoutine = cloneRoutineWithFreshIds(
    template.routine,
    nextIdFactory
  )
  const attribution: RoutineTemplateSource = {
    templateId: template.id,
    templateName: template.name,
    context,
    ownerRole: template.ownerRole,
    ownerId: template.ownerId,
    instantiatedAt: now ?? new Date().toISOString()
  }

  return {
    ok: true,
    routine: {
      ...clonedRoutine,
      templateSource: attribution
    }
  }
}
