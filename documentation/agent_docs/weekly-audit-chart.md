# Weekly Audit Chart (SPRT-32)

## Overview

The weekly audit chart renders a 7-day view of fatigue axes and recruitment context.

## Data Contract

`WeeklyAuditChart` accepts `WeeklyAuditChartData`:

- `weekLabel`: display label for the week
- `days`: exactly 7 items
  - `dayLabel`, `date`
  - `neural`, `metabolic`, `mechanical`, `recruitment` (0-10 expected)
  - `sessions[]` explainability links: `{ id, label, href }`

If the payload does not contain exactly 7 days, the component renders a safe validation message instead of chart geometry.

## Rendering Semantics

- Primary lines: neural, metabolic, mechanical
- Recruitment: translucent overlay band (`recruitment ± 0.35`), intentionally not a primary line
- Red zone: highlighted band and dashed threshold at `>= 7.0`
- Day markers are keyboard-focusable (`role="button"`) and update the details panel

## Test Coverage

Component tests in `src/features/audit/__tests__/weekly-audit-chart.test.tsx` verify:

- 7-day rendering and primary axis series
- recruitment overlay semantics
- red-zone threshold rendering
- explainability links on hover/focus
- safe handling for invalid day count
