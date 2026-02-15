"use client"

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  EnduranceBlockNode,
  EnduranceIntervalNode,
  EnduranceReusableBlock,
  EnduranceTargetType,
  EnduranceTimelineNode
} from "@/features/routine/types"

type EnduranceTimelineBuilderProps = {
  timeline: EnduranceTimelineNode[]
  reusableBlocks: EnduranceReusableBlock[]
  onTimelineChange: (nextTimeline: EnduranceTimelineNode[]) => void
  onReusableBlocksChange: (nextReusableBlocks: EnduranceReusableBlock[]) => void
}

type DragAxis = "duration" | "target"

type DragState = {
  nodeId: string
  axis: DragAxis
  startX: number
  startY: number
  startValue: number
}

const TARGET_TYPES: EnduranceTargetType[] = ["power", "pace", "hr", "cadence"]
const MIN_DURATION_SECONDS = 1
const MIN_TARGET_VALUE = 1
const MAX_TARGET_VALUE = 2000

function clampDuration(value: number): number {
  return Math.max(MIN_DURATION_SECONDS, Math.round(value))
}

function clampTarget(value: number): number {
  return Math.min(
    MAX_TARGET_VALUE,
    Math.max(MIN_TARGET_VALUE, Math.round(value))
  )
}

function collectNodeIds(nodes: EnduranceTimelineNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.kind === "interval") {
      return [node.id]
    }

    return [node.id, ...collectNodeIds(node.children)]
  })
}

function maxIdNumber(
  timeline: EnduranceTimelineNode[],
  reusableBlocks: EnduranceReusableBlock[]
): number {
  const ids = [
    ...collectNodeIds(timeline),
    ...reusableBlocks.flatMap((entry) => [
      entry.id,
      ...collectNodeIds([entry.block])
    ])
  ]

  const numericSuffixes = ids
    .map((id) => Number.parseInt(id.split("-").at(-1) ?? "", 10))
    .filter((value) => Number.isFinite(value))

  if (numericSuffixes.length === 0) {
    return 0
  }

  return Math.max(...numericSuffixes)
}

function createIdFactory(
  timeline: EnduranceTimelineNode[],
  reusableBlocks: EnduranceReusableBlock[]
): (prefix: string) => string {
  let next = maxIdNumber(timeline, reusableBlocks) + 1

  return (prefix: string) => {
    const id = `${prefix}-${next}`
    next += 1
    return id
  }
}

function cloneNode(node: EnduranceTimelineNode): EnduranceTimelineNode {
  if (node.kind === "interval") {
    return { ...node }
  }

  return {
    ...node,
    children: node.children.map(cloneNode)
  }
}

function cloneBlockWithNewIds(
  block: EnduranceBlockNode,
  makeId: (prefix: string) => string
): EnduranceBlockNode {
  return {
    ...block,
    id: makeId("blk"),
    children: block.children.map((child) => {
      if (child.kind === "interval") {
        return {
          ...child,
          id: makeId("int")
        }
      }

      return cloneBlockWithNewIds(child, makeId)
    })
  }
}

function updateNodeById(
  nodes: EnduranceTimelineNode[],
  targetId: string,
  updater: (node: EnduranceTimelineNode) => EnduranceTimelineNode
): EnduranceTimelineNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return updater(node)
    }

    if (node.kind === "block") {
      const nextChildren = updateNodeById(node.children, targetId, updater)
      if (nextChildren !== node.children) {
        return {
          ...node,
          children: nextChildren
        }
      }
    }

    return node
  })
}

function appendNodeToBlock(
  nodes: EnduranceTimelineNode[],
  blockId: string,
  nodeToAppend: EnduranceTimelineNode
): EnduranceTimelineNode[] {
  return nodes.map((node) => {
    if (node.kind === "block" && node.id === blockId) {
      return {
        ...node,
        children: [...node.children, nodeToAppend]
      }
    }

    if (node.kind === "block") {
      return {
        ...node,
        children: appendNodeToBlock(node.children, blockId, nodeToAppend)
      }
    }

    return node
  })
}

function createIntervalNode(
  id: string,
  label: string,
  targetType: EnduranceTargetType = "power",
  targetValue = 250
): EnduranceIntervalNode {
  return {
    kind: "interval",
    id,
    label,
    durationSeconds: 300,
    targetType,
    targetValue
  }
}

function createBlockNode(
  id: string,
  label: string,
  childId: string
): EnduranceBlockNode {
  return {
    kind: "block",
    id,
    label,
    repeats: 2,
    children: [createIntervalNode(childId, `${label} Interval`)]
  }
}

function blockCount(nodes: EnduranceTimelineNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.kind === "interval") {
      return count
    }

    return count + 1 + blockCount(node.children)
  }, 0)
}

export function EnduranceTimelineBuilder({
  timeline,
  reusableBlocks,
  onTimelineChange,
  onReusableBlocksChange
}: EnduranceTimelineBuilderProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)

  useEffect(() => {
    if (!dragState) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      const nextValue =
        dragState.axis === "duration"
          ? clampDuration(dragState.startValue + deltaX)
          : clampTarget(dragState.startValue - deltaY)

      onTimelineChange(
        updateNodeById(timeline, dragState.nodeId, (node) => {
          if (node.kind !== "interval") {
            return node
          }

          if (dragState.axis === "duration") {
            return {
              ...node,
              durationSeconds: nextValue
            }
          }

          return {
            ...node,
            targetValue: nextValue
          }
        })
      )
    }

    const handleMouseUp = () => {
      setDragState(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragState, onTimelineChange, timeline])

  const beginDrag =
    (node: EnduranceIntervalNode, axis: DragAxis) =>
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      setDragState({
        nodeId: node.id,
        axis,
        startX: event.clientX,
        startY: event.clientY,
        startValue:
          axis === "duration" ? node.durationSeconds : node.targetValue
      })
    }

  const updateIntervalWithDelta = (
    interval: EnduranceIntervalNode,
    axis: DragAxis,
    delta: number
  ) => {
    onTimelineChange(
      updateNodeById(timeline, interval.id, (node) => {
        if (node.kind !== "interval") {
          return node
        }

        if (axis === "duration") {
          return {
            ...node,
            durationSeconds: clampDuration(node.durationSeconds + delta)
          }
        }

        return {
          ...node,
          targetValue: clampTarget(node.targetValue + delta)
        }
      })
    )
  }

  const addTopLevelInterval = () => {
    const makeId = createIdFactory(timeline, reusableBlocks)
    const nextIntervalCount =
      timeline.filter((entry) => entry.kind === "interval").length + 1

    onTimelineChange([
      ...timeline,
      createIntervalNode(makeId("int"), `Interval ${nextIntervalCount}`)
    ])
  }

  const addTopLevelBlock = () => {
    const makeId = createIdFactory(timeline, reusableBlocks)
    const nextBlockNumber = blockCount(timeline) + 1
    onTimelineChange([
      ...timeline,
      createBlockNode(makeId("blk"), `Block ${nextBlockNumber}`, makeId("int"))
    ])
  }

  const addNodeToBlock = (blockId: string, node: EnduranceTimelineNode) => {
    onTimelineChange(appendNodeToBlock(timeline, blockId, node))
  }

  const saveReusableBlock = (block: EnduranceBlockNode) => {
    const makeId = createIdFactory(timeline, reusableBlocks)
    const templateId = makeId("tpl")

    onReusableBlocksChange([
      ...reusableBlocks,
      {
        id: templateId,
        name: block.label,
        block: cloneNode(block) as EnduranceBlockNode
      }
    ])
  }

  const insertReusableBlock = (template: EnduranceReusableBlock) => {
    const makeId = createIdFactory(timeline, reusableBlocks)
    const copiedBlock = cloneBlockWithNewIds(template.block, makeId)
    onTimelineChange([...timeline, copiedBlock])
  }

  const renderNode = (node: EnduranceTimelineNode, depth = 0) => {
    if (node.kind === "interval") {
      return (
        <li key={node.id} className="rounded-md border p-3">
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            style={{ marginLeft: depth * 12 }}
          >
            <div className="space-y-1">
              <p className="font-medium">{node.label}</p>
              <p className="text-xs text-muted-foreground">
                {node.durationSeconds}s
              </p>
              <p className="text-xs text-muted-foreground">
                {node.targetType}: {node.targetValue}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Resize duration for ${node.label}`}
                onMouseDown={beginDrag(node, "duration")}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    event.preventDefault()
                    updateIntervalWithDelta(node, "duration", 1)
                  }
                  if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    updateIntervalWithDelta(node, "duration", -1)
                  }
                }}
              >
                Drag duration
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Adjust target for ${node.label}`}
                onMouseDown={beginDrag(node, "target")}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault()
                    updateIntervalWithDelta(node, "target", 1)
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    updateIntervalWithDelta(node, "target", -1)
                  }
                }}
              >
                Drag target
              </Button>
            </div>
          </div>
        </li>
      )
    }

    return (
      <li key={node.id} className="rounded-md border border-dashed p-3">
        <div style={{ marginLeft: depth * 12 }} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="font-medium">{node.label}</p>
              <Badge>x{node.repeats}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const makeId = createIdFactory(timeline, reusableBlocks)
                  addNodeToBlock(
                    node.id,
                    createIntervalNode(
                      makeId("int"),
                      `${node.label} Interval ${node.children.length + 1}`
                    )
                  )
                }}
              >
                Add interval to {node.label}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const makeId = createIdFactory(timeline, reusableBlocks)
                  const nestedBlockCount = blockCount(node.children) + 1
                  addNodeToBlock(
                    node.id,
                    createBlockNode(
                      makeId("blk"),
                      `${node.label} Nested ${nestedBlockCount}`,
                      makeId("int")
                    )
                  )
                }}
              >
                Add nested block
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Save ${node.label} as reusable block`}
                onClick={() => saveReusableBlock(node)}
              >
                Save block
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        </div>
      </li>
    )
  }

  return (
    <section className="space-y-4" aria-label="Endurance timeline builder">
      <div className="space-y-2">
        <h2 className="text-base font-medium">Endurance timeline</h2>
        <p className="text-sm text-muted-foreground">
          Drag right/left for duration and up/down for target precision.
          Timeline values update in 1-second increments.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addTopLevelInterval}>
          Add interval
        </Button>
        <Button type="button" variant="outline" onClick={addTopLevelBlock}>
          Add block
        </Button>
      </div>

      <ul className="space-y-2">{timeline.map((node) => renderNode(node))}</ul>

      <div className="space-y-2 rounded-md border p-3">
        <h3 className="font-medium">Reusable blocks</h3>
        {reusableBlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Save a block to reuse it across the timeline.
          </p>
        ) : (
          <ul className="space-y-2">
            {reusableBlocks.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
              >
                <div>
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TARGET_TYPES.join(" / ")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label={`Insert ${template.name}`}
                  onClick={() => insertReusableBlock(template)}
                >
                  Insert {template.name}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
