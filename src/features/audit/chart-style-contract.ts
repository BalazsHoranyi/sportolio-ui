export type AuditSeriesState = "completed" | "planned"

type AuditSeriesStyle = {
  strokeDasharray?: string
}

const PLANNED_STATE_ALIASES = new Set(["planned", "pending", "scheduled"])
const COMPLETED_STATE_ALIASES = new Set([
  "completed",
  "done",
  "executed",
  "logged"
])

const DEFAULT_STATE: AuditSeriesState = "planned"

export const AUDIT_SERIES_STATE_LEGEND: {
  state: AuditSeriesState
  label: string
}[] = [
  { state: "completed", label: "Completed (solid)" },
  { state: "planned", label: "Planned (dashed)" }
]

export function normalizeAuditSeriesState(
  state: string | null | undefined
): AuditSeriesState {
  const normalized = state?.trim().toLowerCase()
  if (!normalized) {
    return DEFAULT_STATE
  }

  if (COMPLETED_STATE_ALIASES.has(normalized)) {
    return "completed"
  }

  if (PLANNED_STATE_ALIASES.has(normalized)) {
    return "planned"
  }

  return DEFAULT_STATE
}

export function getAuditSeriesStyle(state: AuditSeriesState): AuditSeriesStyle {
  if (state === "planned") {
    return { strokeDasharray: "6 4" }
  }

  return { strokeDasharray: undefined }
}
