# Analytics Metric Glossary (SPRT-7)

## Overview

Launch analytics dashboards include an in-product metric glossary with
deterministic definitions, formulas, and lineage for interpretation.

Shared glossary component:

- `sportolo-ui/src/features/analytics-glossary/components/analytics-metric-glossary.tsx`

Glossary catalog and version source:

- `sportolo-ui/src/features/analytics-glossary/glossary-catalog.ts`

Integrated dashboards:

- `sportolo-ui/src/features/axis-fatigue-trends/components/axis-fatigue-trends-dashboard.tsx`
- `sportolo-ui/src/features/adaptation-risk-timeline/components/adaptation-risk-timeline-dashboard.tsx`
- `sportolo-ui/src/features/endurance-progress/components/endurance-progress-dashboard.tsx`
- `sportolo-ui/src/features/session-compliance/components/session-compliance-dashboard.tsx`
- `sportolo-ui/src/features/block-effectiveness/components/block-effectiveness-dashboard.tsx`

## Behavior Contract

- Each launch dashboard exposes a `Metric glossary` button.
- Expanding the glossary renders a region labeled
  `<Dashboard Title> metric glossary`.
- Every glossary entry includes:
  - metric label
  - definition
  - formula string
  - lineage string
- Version is centralized through `ANALYTICS_GLOSSARY_VERSION`.

## Test Coverage

- `sportolo-ui/src/features/axis-fatigue-trends/__tests__/axis-fatigue-trends-dashboard.test.tsx`
- `sportolo-ui/src/features/adaptation-risk-timeline/__tests__/adaptation-risk-timeline-dashboard.test.tsx`
- `sportolo-ui/src/features/endurance-progress/__tests__/endurance-progress-dashboard.test.tsx`
- `sportolo-ui/src/features/session-compliance/__tests__/session-compliance-dashboard.test.tsx`
- `sportolo-ui/src/features/block-effectiveness/__tests__/block-effectiveness-dashboard.test.tsx`
