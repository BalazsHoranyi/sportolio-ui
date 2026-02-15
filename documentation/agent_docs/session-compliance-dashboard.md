# Session Compliance Dashboard (SPRT-52)

## Scope

`SPRT-52` adds the launch analytics dashboard at `/dashboard/session-compliance`
for planned-vs-completed adherence with move/skip auditing.

## Route and Files

- Route: `src/app/dashboard/session-compliance/page.tsx`
- Component:
  `src/features/session-compliance/components/session-compliance-dashboard.tsx`
- Query/aggregation:
  `src/features/session-compliance/session-compliance-query.ts`
- Preview data:
  `src/features/session-compliance/session-compliance-preview.ts`
- Types: `src/features/session-compliance/types.ts`

## Data Contract

`SessionComplianceDashboard` accepts `SessionComplianceData`:

- `defaultWindowKey` (optional)
- `windows[]` with:
  - `key` and `label`
  - `sessions[]`, each containing:
    - `id`, `label`, `href`
    - `date`, optional `dayLabel`
    - `planBlock`, `modality`
    - `state` (`planned`, `completed`, `moved`, `skipped`, with alias support)

Normalization rules:

- Sessions are sorted by `date` then `id`.
- Missing labels are derived deterministically from date (`en-US`, `UTC`).
- Unknown/missing state falls back to `planned`.
- `planBlock` and `modality` are trimmed and normalized to title case.

## Aggregation Semantics

`buildSessionComplianceSnapshot` computes:

- `plannedCount`: total filtered sessions
- `completedCount`: count of `completed`
- `adherencePercentage`: `round(completedCount / plannedCount * 100)`, `0` when
  planned is `0`
- `moveCount`: count of `moved`
- `skipCount`: count of `skipped`
- `adherenceState`:
  - `green`: `>= 85`
  - `yellow`: `60-84`
  - `red`: `< 60`

Filters:

- window
- plan block
- modality

Trend:

- Per-day points include adherence percent and move/skip counts for charting.
- Day detail drill-down exposes session links back to calendar.

## Test Coverage

- Query tests:
  `src/features/session-compliance/__tests__/session-compliance-query.test.ts`
  validate normalization, state mapping, window fallback, adherence math,
  classification thresholds, filter behavior, and zero-planned handling.
- Component tests:
  `src/features/session-compliance/__tests__/session-compliance-dashboard.test.tsx`
  validate metric rendering, filter interactions, trend paths, and drill-down
  links.
- Page route test:
  `src/app/__tests__/session-compliance-dashboard-page.test.tsx`.
