"use client"

import { useId, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getAnalyticsGlossary,
  type AnalyticsGlossaryDashboardKey
} from "@/features/analytics-glossary/glossary-catalog"

type AnalyticsMetricGlossaryProps = {
  dashboardKey: AnalyticsGlossaryDashboardKey
}

export function AnalyticsMetricGlossary({
  dashboardKey
}: AnalyticsMetricGlossaryProps) {
  const glossary = getAnalyticsGlossary(dashboardKey)
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setIsOpen((open) => !open)
        }}
      >
        Metric glossary
      </Button>

      {isOpen ? (
        <Card
          id={panelId}
          role="region"
          aria-label={`${glossary.title} metric glossary`}
          className="space-y-4 border-dashed p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Metric glossary</h3>
            <Badge>Glossary version {glossary.version}</Badge>
          </div>

          <ul className="space-y-3">
            {glossary.entries.map((entry) => (
              <li key={entry.key} className="rounded-md border p-3">
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.definition}
                </p>
                <p className="mt-2 text-xs">
                  <span className="font-medium">Formula:</span> {entry.formula}
                </p>
                <p className="mt-1 text-xs">
                  <span className="font-medium">Lineage:</span> {entry.lineage}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
