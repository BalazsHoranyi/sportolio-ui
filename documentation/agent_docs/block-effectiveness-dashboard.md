# Block Effectiveness Dashboard (SPRT-53)

## Overview

Launch dashboard for mesocycle-level goal realization with mixed objective
support (strength + endurance), confidence flags, and session drill-down.

## Paths

- Route: `src/app/dashboard/block-effectiveness/page.tsx`
- Component:
  `src/features/block-effectiveness/components/block-effectiveness-dashboard.tsx`
- Query:
  `src/features/block-effectiveness/block-effectiveness-query.ts`
- Preview data:
  `src/features/block-effectiveness/block-effectiveness-preview.ts`
- Types: `src/features/block-effectiveness/types.ts`

## Data Contract

Input type: `BlockEffectivenessData`

- `defaultWindowKey` (optional)
- `windows[]`:
  - `key`, `label`
  - `blocks[]`:
    - `key`, `label`, `startDate`, optional `endDate`
    - `metrics[]`:
      - `key`, `label`, `objectiveType` (`strength` | `endurance`)
      - `unit`
      - `targetValue`, `realizedValue`
      - optional `direction` (`higher` | `lower`, defaults to `higher`)
      - `confidence` (`[0,1]` after normalization)
      - `sampleSize`
      - `contributors[]` (`id`, `label`, `href`)

## Query Semantics

`normalizeBlockEffectivenessData`:

- Sorts blocks by `startDate` then `key`.
- Clamps confidence to `[0,1]`.
- Normalizes sample sizes to non-negative integers.
- Computes metric outputs:
  - `deltaValue`:
    - `higher`: `realized - target`
    - `lower`: `target - realized`
  - `deltaPercentage`: `delta / target * 100` (guarded to `0` when target <= 0)
  - `effectivenessIndex`: `max(0, 100 - abs(deltaPercentage))` (guarded to `0`
    when target <= 0)

`buildBlockEffectivenessSnapshot`:

- Window fallback: requested key -> `defaultWindowKey` -> first window.
- Block fallback: requested key -> first block in selected window.
- Produces per-block summary:
  - `averageDeltaPercentage`
  - `effectivenessIndex`
  - `averageConfidence`
  - `confidenceBand` (`low` / `medium` / `high`)
  - `dataQualityFlag` (`ok` / `sparse` / `low-quality`)

Data quality rules:

- `sparse`: any metric with `sampleSize < 3` (or no metrics)
- `low-quality`: non-sparse block with low confidence band
- `ok`: all other cases

## UI Behavior

- Window selector and block selector drive active snapshot.
- Summary cards expose:
  - block effectiveness index
  - average delta
  - data confidence
- Metrics table shows target/realized/delta/confidence per objective metric.
- Drill-down panel lists contributor session links for the selected metric.

## Coverage

- Query tests:
  `src/features/block-effectiveness/__tests__/block-effectiveness-query.test.ts`
  validate normalization, fallback behavior, mixed objective delta handling,
  sparse/quality classification, and confidence thresholds.
- Component tests:
  `src/features/block-effectiveness/__tests__/block-effectiveness-dashboard.test.tsx`
  validate summary rendering, window/block interaction, and contributor
  drill-down.
- Page test:
  `src/app/__tests__/block-effectiveness-dashboard-page.test.tsx`.
