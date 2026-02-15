# Monthly Audit Chart (SPRT-35)

## Overview

`MonthlyAuditChart` renders a 30-day fatigue audit view with parity to weekly chart semantics.

## Data Contract

`MonthlyAuditChart` accepts `MonthlyAuditChartData`:

- `windows[]`
  - `monthLabel`: display label for the active month window
  - `seriesState` (optional): backend alias normalized by the shared chart style contract
  - `days`: exactly 30 `WeeklyAuditDay` entries

If any window does not contain exactly 30 days, the component renders a safe validation message.

## Rendering Semantics

- Primary lines: neural, metabolic, mechanical
- Recruitment: translucent overlay band (`recruitment ± 0.35`)
- Red zone: highlighted band with dashed threshold at `>= 7.0`
- Planned/completed style parity uses `chart-style-contract.ts`
  - planned => dashed (`strokeDasharray: "6 4"`)
  - completed => solid

## Navigation + Drill-down

- Previous/next controls switch month windows.
- Day markers are keyboard-focusable and update the details panel.
- Details panel renders explainability links for sessions on selected day.

## Integration

- `PlanningSurface` now includes an audit view toggle (`Week` / `Month`).
- Month mode renders `MonthlyAuditChart` with `monthlyAuditPreviewData`.

## Test Coverage

`src/features/audit/__tests__/monthly-audit-chart.test.tsx` verifies:

- strict 30-day payload validation
- primary axis line rendering for month view
- recruitment overlay + red-zone threshold visibility
- planned/completed stroke style parity while navigating windows
- month window navigation and day-level drill-down links
