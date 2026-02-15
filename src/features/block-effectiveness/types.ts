export type BlockObjectiveType = "strength" | "endurance"

export type BlockMetricDirection = "higher" | "lower"

export type BlockConfidenceBand = "low" | "medium" | "high"

export type BlockDataQualityFlag = "ok" | "sparse" | "low-quality"

export type BlockEffectivenessContributor = {
  id: string
  label: string
  href: string
}

export type BlockEffectivenessMetric = {
  key: string
  label: string
  objectiveType: BlockObjectiveType
  unit: string
  targetValue: number
  realizedValue: number
  direction?: BlockMetricDirection
  confidence: number
  sampleSize: number
  contributors: BlockEffectivenessContributor[]
}

export type BlockEffectivenessBlock = {
  key: string
  label: string
  startDate: string
  endDate?: string
  metrics: BlockEffectivenessMetric[]
}

export type BlockEffectivenessWindow = {
  key: string
  label: string
  blocks: BlockEffectivenessBlock[]
}

export type BlockEffectivenessData = {
  defaultWindowKey?: string
  windows: BlockEffectivenessWindow[]
}

export type NormalizedBlockEffectivenessMetric = Omit<
  BlockEffectivenessMetric,
  "direction" | "confidence" | "sampleSize" | "targetValue" | "realizedValue"
> & {
  direction: BlockMetricDirection
  targetValue: number
  realizedValue: number
  confidence: number
  sampleSize: number
  deltaValue: number
  deltaPercentage: number
  effectivenessIndex: number
}

export type NormalizedBlockEffectivenessBlock = Omit<
  BlockEffectivenessBlock,
  "metrics"
> & {
  metrics: NormalizedBlockEffectivenessMetric[]
}

export type NormalizedBlockEffectivenessWindow = Omit<
  BlockEffectivenessWindow,
  "blocks"
> & {
  blocks: NormalizedBlockEffectivenessBlock[]
}

export type NormalizedBlockEffectivenessData = Omit<
  BlockEffectivenessData,
  "windows"
> & {
  windows: NormalizedBlockEffectivenessWindow[]
}

export type BlockEffectivenessSummary = {
  block: NormalizedBlockEffectivenessBlock
  objectiveTypes: BlockObjectiveType[]
  averageDeltaPercentage: number
  effectivenessIndex: number
  averageConfidence: number
  confidenceBand: BlockConfidenceBand
  dataQualityFlag: BlockDataQualityFlag
}

export type BlockEffectivenessSnapshot = {
  window: NormalizedBlockEffectivenessWindow | undefined
  blockSummaries: BlockEffectivenessSummary[]
  activeBlockSummary: BlockEffectivenessSummary | undefined
  activeMetric: NormalizedBlockEffectivenessMetric | undefined
}
