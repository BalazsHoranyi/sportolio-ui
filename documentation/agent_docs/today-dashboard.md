# Today Dashboard (SPRT-60)

## Overview

The Today dashboard provides a concise same-day readiness surface in the web UI.

## Route and Component

- Route: `src/app/today/page.tsx`
- Component: `src/features/today/components/today-dashboard.tsx`

## Data Contract

`TodayDashboardData` includes:

- `snapshot` axis values (`neural`, `metabolic`, `mechanical`, `recruitment`)
- `combinedScore` (`score`, `interpretation`)
- `systemCapacity` (`sleepQuality`, `fuelQuality`, `stressLevel`, `gateMultiplier`)
- `accumulation` (`boundaryStart`, `boundaryEnd`, `includedSessionIds`)
- `scoreExplanationLinks` (optional map keyed by `neural`, `metabolic`, `mechanical`, `recruitment`, `combined_fatigue`)
- `contributors` list (`id`, `label`, `href`)

## Behavior

- Renders neural/metabolic/mechanical gauges plus recruitment badge.
- Keeps combined score and system-capacity indicator as separate UI regions.
- Every displayed score (axis cards, recruitment badge, combined score) renders a deterministic explainability link.
- Filters “Why this today” links using `includedSessionIds` so planned/non-accumulated sessions are excluded.
- Applies deterministic risk bands:
  - `>= 7.0`: `Red zone`
  - `>= 5.0`: `Elevated`
  - otherwise: `Manageable`
- If a score explanation link is explicitly set to `null`, the dashboard shows an in-place “explanation unavailable” fallback instead of a link.
- Handles missing system-capacity inputs with `n/a` fallbacks.

## Test Coverage

`src/features/today/__tests__/today-dashboard.test.tsx` validates:

- gauge and recruitment rendering
- combined-vs-capacity separation
- chip link filtering and href correctness
- score-level explanation links and disabled-link fallback behavior
- threshold behavior at `7.0`
- missing system-capacity fallback behavior
