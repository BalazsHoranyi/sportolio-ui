import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { cn } from "@/lib/utils"
import type {
  TodayContributorSession,
  TodayDashboardData
} from "@/features/today/types"

const SCORE_MIN = 1
const SCORE_MAX = 10
const RED_ZONE_THRESHOLD = 7
const ELEVATED_THRESHOLD = 5

const AXIS_DEFINITIONS = [
  { key: "neural", label: "Neural", barColor: "bg-blue-600" },
  { key: "metabolic", label: "Metabolic", barColor: "bg-emerald-600" },
  { key: "mechanical", label: "Mechanical", barColor: "bg-amber-600" }
] as const

type RiskBand = "Red zone" | "Elevated" | "Manageable"

function clampScore(value: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value))
}

function scoreToPercent(value: number): number {
  const normalized = (clampScore(value) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)
  return Math.round(normalized * 100)
}

function resolveRiskBand(score: number): RiskBand {
  if (score >= RED_ZONE_THRESHOLD) {
    return "Red zone"
  }
  if (score >= ELEVATED_THRESHOLD) {
    return "Elevated"
  }
  return "Manageable"
}

function riskBandClassName(riskBand: RiskBand): string {
  if (riskBand === "Red zone") {
    return "text-red-700"
  }
  if (riskBand === "Elevated") {
    return "text-amber-700"
  }
  return "text-emerald-700"
}

function formatScore(score: number): string {
  return clampScore(score).toFixed(1)
}

function formatQualityPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "n/a"
  }

  const clamped = Math.max(0, Math.min(1, value))
  return `${Math.round(clamped * 100)}%`
}

function formatGateMultiplier(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "n/a"
  }
  return `x${value.toFixed(2)}`
}

function resolveIncludedContributors(
  contributors: TodayContributorSession[],
  includedSessionIds: string[]
): TodayContributorSession[] {
  if (includedSessionIds.length === 0) {
    return []
  }

  const includedIds = new Set(includedSessionIds)
  return contributors.filter((session) => includedIds.has(session.id))
}

function renderSystemCapacityItem(
  label: string,
  value: number | null | undefined
) {
  return (
    <li key={label} className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{formatQualityPercent(value)}</span>
    </li>
  )
}

export function TodayDashboard({ data }: { data: TodayDashboardData }) {
  const includedContributors = resolveIncludedContributors(
    data.contributors,
    data.accumulation.includedSessionIds
  )

  return (
    <AppShell
      title="Today"
      description="Completed-session carryover and readiness view for today's execution decisions."
      maxWidth="narrow"
      headerContent={
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Recruitment {formatScore(data.snapshot.recruitment)}</Badge>
          <p className="text-sm text-muted-foreground">
            Accumulation window: {data.accumulation.boundaryStart} -&gt;{" "}
            {data.accumulation.boundaryEnd}
          </p>
        </div>
      }
    >
      <section
        className="grid gap-4 md:grid-cols-3"
        aria-label="Primary fatigue gauges"
      >
        {AXIS_DEFINITIONS.map((axis) => {
          const axisScore = data.snapshot[axis.key]
          const riskBand = resolveRiskBand(axisScore)

          return (
            <Card
              key={axis.key}
              className="space-y-3 p-4"
              aria-label={`${axis.label} gauge`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{axis.label}</p>
                <p className="text-sm text-muted-foreground">
                  {formatScore(axisScore)}
                </p>
              </div>

              <div
                className="h-2 w-full rounded-full bg-muted"
                role="progressbar"
                aria-label={`${axis.label} score progress`}
                aria-valuemin={SCORE_MIN}
                aria-valuemax={SCORE_MAX}
                aria-valuenow={clampScore(axisScore)}
              >
                <div
                  className={cn("h-full rounded-full", axis.barColor)}
                  style={{ width: `${scoreToPercent(axisScore)}%` }}
                />
              </div>

              <p
                className={cn(
                  "text-sm font-medium",
                  riskBandClassName(riskBand)
                )}
                aria-label={`${axis.label} risk band`}
              >
                {riskBand}
              </p>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card
          className="space-y-2 p-4"
          role="region"
          aria-label="Combined fatigue score"
        >
          <h2 className="text-base font-semibold">Combined fatigue score</h2>
          <p className="text-3xl font-semibold">
            {formatScore(data.combinedScore.score)}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.combinedScore.interpretation}
          </p>
        </Card>

        <Card
          className="space-y-3 p-4"
          role="region"
          aria-label="System capacity indicator"
        >
          <h2 className="text-base font-semibold">System capacity indicator</h2>
          <ul className="space-y-2 text-sm">
            {renderSystemCapacityItem(
              "Sleep",
              data.systemCapacity.sleepQuality
            )}
            {renderSystemCapacityItem("Fuel", data.systemCapacity.fuelQuality)}
            {renderSystemCapacityItem(
              "Stress",
              data.systemCapacity.stressLevel
            )}
            <li className="flex items-center justify-between gap-4 border-t pt-2">
              <span className="text-muted-foreground">Gate</span>
              <span className="font-medium">
                {formatGateMultiplier(data.systemCapacity.gateMultiplier)}
              </span>
            </li>
          </ul>
        </Card>
      </section>

      <Card className="space-y-3 p-4" role="region" aria-label="Why this today">
        <h2 className="text-base font-semibold">Why this today</h2>
        {includedContributors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed contributing sessions in this window.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {includedContributors.map((session) => (
              <a
                key={session.id}
                href={session.href}
                className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium underline-offset-2 hover:underline"
              >
                {session.label}
              </a>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  )
}
