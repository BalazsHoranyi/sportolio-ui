export const ANALYTICS_GLOSSARY_VERSION = "2026.02.15"

export type AnalyticsGlossaryDashboardKey =
  | "axis-fatigue-trends"
  | "adaptation-risk-timeline"
  | "endurance-progress"
  | "session-compliance"
  | "block-effectiveness"

export type AnalyticsGlossaryEntry = {
  key: string
  label: string
  definition: string
  formula: string
  lineage: string
}

type AnalyticsDashboardGlossary = {
  title: string
  entries: AnalyticsGlossaryEntry[]
}

const GLOSSARIES: Record<
  AnalyticsGlossaryDashboardKey,
  AnalyticsDashboardGlossary
> = {
  "axis-fatigue-trends": {
    title: "Axis Fatigue Trends",
    entries: [
      {
        key: "neural_load",
        label: "Neural load",
        definition:
          "Neural axis strain based on high-intensity and high-coordination session demands.",
        formula:
          "neural_load(day, series) = mean(neural_score for sessions in day, series)",
        lineage:
          "Session events -> axis scoring engine -> dashboard daily series"
      },
      {
        key: "metabolic_load",
        label: "Metabolic load",
        definition:
          "Metabolic axis burden representing glycolytic and aerobic stress accumulation.",
        formula:
          "metabolic_load(day, series) = mean(metabolic_score for sessions in day, series)",
        lineage:
          "Session events -> axis scoring engine -> dashboard daily series"
      },
      {
        key: "mechanical_load",
        label: "Mechanical load",
        definition:
          "Mechanical axis burden from tissue-loading activities with slower decay behavior.",
        formula:
          "mechanical_load(day, series) = mean(mechanical_score for sessions in day, series)",
        lineage:
          "Session events -> axis scoring engine -> dashboard daily series"
      },
      {
        key: "recruitment_overlay",
        label: "Recruitment overlay",
        definition:
          "Derived neural-mechanical recruitment signal shown as completed band and planned line.",
        formula:
          "recruitment(day, series) = f(neural_load(day, series), mechanical_load(day, series))",
        lineage:
          "Axis daily scores -> recruitment derivation -> chart overlay geometry"
      }
    ]
  },
  "adaptation-risk-timeline": {
    title: "Adaptation Risk Timeline",
    entries: [
      {
        key: "gated_risk_score",
        label: "Gated risk score",
        definition:
          "Combined adaptation risk after system-capacity gating is applied to fatigue.",
        formula:
          "gated_risk_score = combined_fatigue_score * system_capacity_gate",
        lineage:
          "Session events -> combined fatigue model -> gating model -> timeline points"
      },
      {
        key: "system_capacity_gate",
        label: "System capacity gate",
        definition:
          "Capacity multiplier that scales risk up/down based on readiness constraints.",
        formula:
          "system_capacity_gate = readiness_capacity_index / baseline_capacity",
        lineage:
          "Readiness inputs + recovery model -> gate coefficient -> risk timeline"
      },
      {
        key: "risk_zone",
        label: "Risk zone",
        definition:
          "Discrete traffic-light band used for planning interpretation.",
        formula:
          "zone = green if score < 5, yellow if 5 <= score < 7, red if score >= 7",
        lineage:
          "Gated risk score -> zone threshold classifier -> chart zone styling"
      }
    ]
  },
  "endurance-progress": {
    title: "Endurance Progress",
    entries: [
      {
        key: "zone_distribution",
        label: "Zone distribution (%)",
        definition:
          "Percentage split of accumulated minutes by endurance training zone in the selected window.",
        formula:
          "zone_percentage(zone) = zone_minutes(zone) / total_zone_minutes * 100",
        lineage:
          "Completed endurance sessions -> zone classifier -> window aggregation"
      },
      {
        key: "threshold_trend",
        label: "Threshold trend",
        definition:
          "Windowed progression of selected threshold metric (pace or power).",
        formula:
          "threshold_value(day) = latest normalized threshold observation for selected metric",
        lineage:
          "Session telemetry -> threshold extraction -> metric-normalized daily series"
      },
      {
        key: "inferred_source_confidence",
        label: "Inferred source confidence",
        definition:
          "Confidence score for inferred threshold points when direct source data is absent.",
        formula: "confidence_percent = inferred_confidence * 100",
        lineage:
          "Telemetry completeness + inference method -> confidence score -> point details"
      }
    ]
  },
  "session-compliance": {
    title: "Session Compliance",
    entries: [
      {
        key: "adherence",
        label: "Adherence (%)",
        definition:
          "Execution adherence percentage for completed versus planned sessions.",
        formula: "adherence = completed_sessions / planned_sessions * 100",
        lineage:
          "Planned calendar entries + completed logs -> adherence classifier -> summary card"
      },
      {
        key: "move_events",
        label: "Move events",
        definition:
          "Count of sessions rescheduled from their original plan date.",
        formula:
          "move_events = count(session_state == moved within selected filters)",
        lineage:
          "Plan change events -> state classifier -> trend + day drill-down"
      },
      {
        key: "skip_events",
        label: "Skip events",
        definition:
          "Count of planned sessions marked as skipped in the selected window.",
        formula:
          "skip_events = count(session_state == skipped within selected filters)",
        lineage:
          "Execution state events -> compliance aggregation -> trend + day drill-down"
      }
    ]
  },
  "block-effectiveness": {
    title: "Block Effectiveness",
    entries: [
      {
        key: "block_effectiveness_index",
        label: "Block effectiveness index",
        definition:
          "Normalized score summarizing objective realization across metrics in a block.",
        formula:
          "effectiveness_index = mean(metric_effectiveness_index for block metrics)",
        lineage:
          "Metric target/realized pairs -> directional delta normalization -> block summary"
      },
      {
        key: "delta_percentage",
        label: "Delta (%)",
        definition:
          "Signed gap between realized and target value respecting metric directionality.",
        formula:
          "delta_percent = (realized - target) / abs(target) * direction_multiplier * 100",
        lineage:
          "Objective metric observations -> directional comparator -> metrics table rows"
      },
      {
        key: "average_confidence",
        label: "Average confidence",
        definition:
          "Average confidence level across objective metrics for the selected block.",
        formula:
          "average_confidence = mean(metric_confidence for block metrics)",
        lineage:
          "Metric sample quality -> confidence scoring -> block confidence summary"
      }
    ]
  }
}

export function getAnalyticsGlossary(
  dashboardKey: AnalyticsGlossaryDashboardKey
) {
  const glossary = GLOSSARIES[dashboardKey]
  return {
    ...glossary,
    version: ANALYTICS_GLOSSARY_VERSION
  }
}
