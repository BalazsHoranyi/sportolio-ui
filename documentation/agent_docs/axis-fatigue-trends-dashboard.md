# Axis Fatigue Trends Dashboard

## Scope

`SPRT-49` adds a launch analytics dashboard at `/dashboard/axis-fatigue` for planned-vs-completed axis trend visibility.

## UI behavior

- Window selector supports multiple windows (currently `7 days` and `30 days`).
- Three primary axes are shown with dual series:
  - Completed: solid stroke
  - Planned: dashed stroke
- Recruitment is rendered as:
  - Completed overlay band
  - Planned dashed overlay line
- Red-zone threshold is shown at `>= 7.0`.
- Day drill-down lists contributing sessions separately for completed and planned states.

## Data contract

Types live in `src/features/axis-fatigue-trends/types.ts`.

Primary contract:

- `AxisFatigueTrendsData`
- `AxisFatigueWindow`
- `AxisFatigueTrendDay`
- `AxisFatigueSeriesPoint`

## Query normalization

`src/features/axis-fatigue-trends/axis-fatigue-trends-query.ts` provides deterministic shaping:

- Clamps all scores into `[0, 10]`
- Derives missing day labels from ISO date
- Sorts days by date ascending
- Selects active window by requested key, then default key, then first window

## Tests

- Query tests: `src/features/axis-fatigue-trends/__tests__/axis-fatigue-trends-query.test.ts`
- Component tests: `src/features/axis-fatigue-trends/__tests__/axis-fatigue-trends-dashboard.test.tsx`
- Page route test: `src/app/__tests__/axis-fatigue-dashboard-page.test.tsx`
