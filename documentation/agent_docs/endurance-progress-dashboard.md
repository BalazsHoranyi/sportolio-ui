# Endurance Progress Dashboard (SPRT-51)

## Overview

Launch dashboard for endurance analytics with:

- zone distribution by selected window
- threshold trend for pace/power
- inferred-source confidence visibility
- trend-point contributor drill-down

## Paths

- Route: `src/app/dashboard/endurance-progress/page.tsx`
- Component:
  `src/features/endurance-progress/components/endurance-progress-dashboard.tsx`
- Query:
  `src/features/endurance-progress/endurance-progress-query.ts`

## Contract

Input type: `EnduranceProgressData`

- `defaultWindowKey` (optional)
- `windows[]`:
  - `key`, `label`
  - `zoneDistribution[]` (`z1`..`z5`, minutes)
  - `thresholdMetrics[]` (`key`, `label`, `unit`, `points[]`)
- `points[]`:
  - `date`, optional `dayLabel`
  - `value`
  - `confidence` (clamped to `[0,1]`)
  - `inferred`
  - `contributors[]` (`id`, `label`, `href`)

## Behavior Notes

- Window fallback: requested key -> default key -> first window.
- Metric fallback: requested key -> first metric in selected window.
- Zone buckets normalize to full `z1`..`z5` output.
- Zone percentages derive from total minutes, 1-decimal precision.
- Confidence bands:
  - low `<0.5`
  - medium `0.5-0.79`
  - high `>=0.8`

## Coverage

- Query tests: normalization, fallback, percentage accuracy, confidence
  classification.
- Component tests: window/metric switching, confidence rendering, contributor
  links, empty contributor state.
- Page test: route rendering.
