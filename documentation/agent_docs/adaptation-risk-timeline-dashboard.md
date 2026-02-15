# Adaptation Risk Timeline Dashboard (SPRT-50)

## Overview

The Adaptation Risk Timeline dashboard provides a date-window trend of gated
combined fatigue risk and exposes contributor drill-down per point.

Route:

- `sportolo-ui/src/app/dashboard/adaptation-risk/page.tsx`

Core component:

- `sportolo-ui/src/features/adaptation-risk-timeline/components/adaptation-risk-timeline-dashboard.tsx`

Query/normalization:

- `sportolo-ui/src/features/adaptation-risk-timeline/adaptation-risk-timeline-query.ts`

## Data Contract

`AdaptationRiskTimelineDashboard` accepts `AdaptationRiskTimelineData`:

- `defaultWindowKey`: optional default selected timeline window
- `windows[]`: each window has:
  - `key` and `label`
  - `points[]` where each point includes:
    - `date`
    - `dayLabel` (optional, derived deterministically when missing)
    - `combinedFatigueScore`
    - `systemCapacityGate`
    - `contributors[]` (`id`, `label`, `href`)

Normalized points also carry:

- `gatedRiskScore` = clamped(`combinedFatigueScore * systemCapacityGate`)

## Rendering Semantics

- Timeline renders the gated risk series, not raw combined score.
- Risk zones are shown as colored chart bands:
  - Green: `< 5.0`
  - Yellow: `5.0 - 6.9`
  - Red: `>= 7.0`
- Threshold lines at `5.0` and `7.0` are rendered for deterministic visual
  interpretation.
- Window selection updates active timeline and resets active point state.
- Active point detail panel includes date, gated score, risk zone, and
  contributor links.

## Resilience Rules

- Missing/invalid requested window falls back to `defaultWindowKey`, then first
  window.
- Empty windows and missing windows render explicit non-crashing fallback cards.
- Out-of-range and non-finite scores clamp to `[0, 10]`.
- Unsorted dates are normalized to ascending order.

## Test Coverage

Tests cover:

- query normalization, score clamping, day-label derivation, and window fallback
- threshold classification boundaries (`5.0`, `7.0`)
- chart zone rendering and legend presence
- window switching behavior
- contributor drill-down links and empty-contributor fallback
- page-level route wiring
