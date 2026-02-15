export type RoutinePath = "strength" | "endurance"
export type RoutineMode = "visual" | "dsl"
export type EnduranceTargetType = "power" | "pace" | "hr" | "cadence"

export type EnduranceIntervalNode = {
  kind: "interval"
  id: string
  label: string
  durationSeconds: number
  targetType: EnduranceTargetType
  targetValue: number
}

export type EnduranceBlockNode = {
  kind: "block"
  id: string
  label: string
  repeats: number
  children: EnduranceTimelineNode[]
}

export type EnduranceTimelineNode = EnduranceIntervalNode | EnduranceBlockNode

export type EnduranceReusableBlock = {
  id: string
  name: string
  block: EnduranceBlockNode
}

export type RoutineDraft = {
  name: string
  path: RoutinePath
  strength: {
    exerciseIds: string[]
  }
  endurance: {
    timeline: EnduranceTimelineNode[]
    reusableBlocks: EnduranceReusableBlock[]
  }
}
