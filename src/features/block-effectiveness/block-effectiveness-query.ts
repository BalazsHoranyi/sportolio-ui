import type {
  BlockEffectivenessBlock,
  BlockEffectivenessMetric,
  BlockConfidenceBand,
  BlockDataQualityFlag,
  BlockEffectivenessData,
  BlockEffectivenessSnapshot,
  BlockMetricDirection,
  BlockObjectiveType,
  BlockEffectivenessSummary,
  NormalizedBlockEffectivenessBlock,
  NormalizedBlockEffectivenessData,
  NormalizedBlockEffectivenessMetric,
  NormalizedBlockEffectivenessWindow
} from "@/features/block-effectiveness/types"

const LOW_CONFIDENCE_THRESHOLD = 0.5
const HIGH_CONFIDENCE_THRESHOLD = 0.8
const SPARSE_SAMPLE_SIZE_THRESHOLD = 3

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sanitizeFinite(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return value
}

function sanitizeSampleSize(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.trunc(value))
}

function deriveDirection(
  value: BlockMetricDirection | undefined
): BlockMetricDirection {
  if (value === "lower") {
    return "lower"
  }
  return "higher"
}

function normalizeMetric(
  metric: BlockEffectivenessMetric
): NormalizedBlockEffectivenessMetric {
  const targetValue = sanitizeFinite(metric.targetValue)
  const realizedValue = sanitizeFinite(metric.realizedValue)
  const direction = deriveDirection(metric.direction)
  const confidence = clamp(sanitizeFinite(metric.confidence), 0, 1)
  const sampleSize = sanitizeSampleSize(metric.sampleSize)

  const rawDelta =
    direction === "lower"
      ? targetValue - realizedValue
      : realizedValue - targetValue

  const deltaValue = round(rawDelta, 1)
  const deltaPercentage =
    targetValue <= 0 ? 0 : round((rawDelta / targetValue) * 100, 1)
  const effectivenessIndex =
    targetValue <= 0
      ? 0
      : round(Math.max(0, 100 - Math.abs(deltaPercentage)), 1)

  return {
    ...metric,
    direction,
    confidence,
    sampleSize,
    targetValue,
    realizedValue,
    contributors: [...metric.contributors].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    deltaValue,
    deltaPercentage,
    effectivenessIndex
  }
}

function normalizeBlock(
  block: BlockEffectivenessBlock
): NormalizedBlockEffectivenessBlock {
  return {
    ...block,
    metrics: block.metrics.map(normalizeMetric)
  }
}

export function normalizeBlockEffectivenessData(
  data: BlockEffectivenessData
): NormalizedBlockEffectivenessData {
  return {
    ...data,
    windows: data.windows.map((window) => ({
      ...window,
      blocks: window.blocks
        .map((block) => normalizeBlock(block))
        .sort((left, right) => {
          const byDate = left.startDate.localeCompare(right.startDate)
          if (byDate !== 0) {
            return byDate
          }
          return left.key.localeCompare(right.key)
        })
    }))
  }
}

export function selectBlockEffectivenessWindow(
  data: NormalizedBlockEffectivenessData,
  requestedKey: string
): NormalizedBlockEffectivenessWindow | undefined {
  const requested = data.windows.find((window) => window.key === requestedKey)
  if (requested) {
    return requested
  }

  if (data.defaultWindowKey) {
    const fallback = data.windows.find(
      (window) => window.key === data.defaultWindowKey
    )
    if (fallback) {
      return fallback
    }
  }

  return data.windows[0]
}

export function classifyBlockConfidenceBand(
  confidence: number
): BlockConfidenceBand {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return "high"
  }
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) {
    return "medium"
  }
  return "low"
}

function buildDataQualityFlag(
  block: NormalizedBlockEffectivenessBlock,
  confidenceBand: BlockConfidenceBand
): BlockDataQualityFlag {
  if (
    block.metrics.length === 0 ||
    block.metrics.some(
      (metric) => metric.sampleSize < SPARSE_SAMPLE_SIZE_THRESHOLD
    )
  ) {
    return "sparse"
  }

  if (confidenceBand === "low") {
    return "low-quality"
  }

  return "ok"
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function buildBlockSummary(
  block: NormalizedBlockEffectivenessBlock
): BlockEffectivenessSummary {
  const averageDeltaPercentage = round(
    average(block.metrics.map((metric) => metric.deltaPercentage)),
    1
  )
  const effectivenessIndex = round(
    average(block.metrics.map((metric) => metric.effectivenessIndex)),
    1
  )
  const averageConfidence = round(
    average(block.metrics.map((metric) => metric.confidence)),
    2
  )

  const confidenceBand = classifyBlockConfidenceBand(averageConfidence)

  return {
    block,
    objectiveTypes: Array.from(
      new Set(block.metrics.map((metric) => metric.objectiveType))
    ).sort((left, right) => left.localeCompare(right)) as BlockObjectiveType[],
    averageDeltaPercentage,
    effectivenessIndex,
    averageConfidence,
    confidenceBand,
    dataQualityFlag: buildDataQualityFlag(block, confidenceBand)
  }
}

type BuildSnapshotOptions = {
  windowKey: string
  blockKey: string
  metricKey?: string
}

export function buildBlockEffectivenessSnapshot(
  data: NormalizedBlockEffectivenessData,
  options: BuildSnapshotOptions
): BlockEffectivenessSnapshot {
  const window = selectBlockEffectivenessWindow(data, options.windowKey)

  if (!window) {
    return {
      window: undefined,
      blockSummaries: [],
      activeBlockSummary: undefined,
      activeMetric: undefined
    }
  }

  const blockSummaries = window.blocks.map((block) => buildBlockSummary(block))

  const activeBlockSummary =
    blockSummaries.find((summary) => summary.block.key === options.blockKey) ??
    blockSummaries[0]

  const activeMetric =
    activeBlockSummary?.block.metrics.find(
      (metric) => metric.key === options.metricKey
    ) ?? activeBlockSummary?.block.metrics[0]

  return {
    window,
    blockSummaries,
    activeBlockSummary,
    activeMetric
  }
}
