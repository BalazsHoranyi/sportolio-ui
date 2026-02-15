"use client"

import { useMemo } from "react"
import Body from "react-muscle-highlighter"

import { Card } from "@/components/ui/card"
import {
  aggregateMuscleContributions,
  mapMuscleContributionsToBodyData
} from "@/features/muscle-map/map-muscle-usage"
import type { MuscleContribution } from "@/features/muscle-map/types"

type MuscleMapProps = {
  title: string
  contributions: MuscleContribution[]
}

export function MuscleMap({ title, contributions }: MuscleMapProps) {
  const data = useMemo(
    () => mapMuscleContributionsToBodyData(contributions),
    [contributions]
  )

  const bodyPartContributions = useMemo(
    () => aggregateMuscleContributions(contributions),
    [contributions]
  )

  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-lg font-medium">{title}</h3>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No mapped muscles to display yet.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <figure className="space-y-2">
          <figcaption className="text-sm font-medium">Front</figcaption>
          <div className="rounded-md border p-2">
            <Body data={data} side="front" scale={1.25} />
          </div>
        </figure>

        <figure className="space-y-2">
          <figcaption className="text-sm font-medium">Back</figcaption>
          <div className="rounded-md border p-2">
            <Body data={data} side="back" scale={1.25} />
          </div>
        </figure>
      </div>

      <ul
        aria-label={`${title} contributions`}
        className="grid gap-1 text-sm text-muted-foreground"
      >
        {bodyPartContributions.map((contribution) => (
          <li key={contribution.slug}>
            {contribution.slug}: {contribution.score.toFixed(2)}
          </li>
        ))}
      </ul>
    </Card>
  )
}
