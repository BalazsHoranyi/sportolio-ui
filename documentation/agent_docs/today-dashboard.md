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
- `contributors` list (`id`, `label`, `href`)

## Behavior

- Renders neural/metabolic/mechanical gauges plus recruitment badge.
- Keeps combined score and system-capacity indicator as separate UI regions.
- Filters “Why this today” links using `includedSessionIds` so planned/non-accumulated sessions are excluded.
- Applies deterministic risk bands:
  - `>= 7.0`: `Red zone`
  - `>= 5.0`: `Elevated`
  - otherwise: `Manageable`
- Handles missing system-capacity inputs with `n/a` fallbacks.

## Test Coverage

`src/features/today/__tests__/today-dashboard.test.tsx` validates:

- gauge and recruitment rendering
- combined-vs-capacity separation
- chip link filtering and href correctness
- threshold behavior at `7.0`
- missing system-capacity fallback behavior
