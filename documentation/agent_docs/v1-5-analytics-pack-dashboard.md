# v1.5 Analytics Pack Dashboard (SPRT-54)

## Overview

Advanced analytics surface that extends launch dashboards with five v1.5
modules:

- Strength Progress
- Interference Audit
- Recovery IO
- Monotony / Strain
- Coach Portfolio

## Paths

- Route: `src/app/dashboard/v1-5-analytics/page.tsx`
- Component:
  `src/features/v1-5-analytics/components/v1-5-analytics-dashboard.tsx`
- Query:
  `src/features/v1-5-analytics/v1-5-analytics-query.ts`
- Preview data:
  `src/features/v1-5-analytics/v1-5-analytics-preview.ts`
- Types: `src/features/v1-5-analytics/types.ts`

## Data Contract

Input type: `V15AnalyticsData`

- `defaultWindowKey` (optional)
- `windows[]`:
  - `key`, `label`
  - `strengthSessions[]` (`id`, `date`, `lift`, `weightKg`, `reps`, `sets`, `rpe`)
  - `interferenceSignals[]` (`id`, `primaryRegion`, `secondaryRegion`,
    `overlapScore`, `sessions[]`)
  - `recoveryDays[]` (`date`, `sleepHours`, `fuelScore`, `stressScore`,
    `nextDayOutputScore`)
  - `weeklyLoads[]` (`weekKey`, `dailyLoads[]`)
  - `athletes[]` (`athleteId`, `athleteName`, `highRiskDays`,
    `missedSessions`, `lowRecoveryDays`)

## Query Semantics

`normalizeV15AnalyticsData`:

- Sanitizes negative/non-finite inputs across all modules.
- Clamps bounded inputs:
  - `rpe` -> `[0,10]`
  - `overlapScore` -> `[0,1]`
  - recovery scores -> `[0,10]`
- Leaves window ordering explicit and deterministic.

`buildV15AnalyticsSnapshot` returns module snapshots for selected window with
fallback order: requested key -> `defaultWindowKey` -> first window.

Strength Progress:

- Volume-load = sum(`weightKg * reps * sets`) per session.
- e1RM = `weightKg * (1 + reps / 40)`.
- PR events tracked per lift in deterministic lift/date/session order.
- Intensity distribution from session RPE buckets:
  - `low` `< 7`
  - `moderate` `>= 7 && < 8.5`
  - `high` `>= 8.5`

Interference Audit:

- Conflict severity by overlap score:
  - `high` `>= 0.75`
  - `medium` `>= 0.5`
  - `low` otherwise
- Sorted by severity -> overlap score desc -> id.

Recovery IO:

- Input score = weighted combination of sleep/fuel/stress factors.
- Alignment score = mean closeness between normalized input and next-day output.
- Trajectory direction derived from first->last output delta with epsilon guard.

Monotony / Strain:

- Monotony = `mean(dailyLoads) / stddev(dailyLoads)` (guarded when stddev=0).
- Strain = `totalLoad * monotony`.
- Risk bands:
  - `high`: monotony `>= 3` or strain `>= 10000`
  - `moderate`: monotony `>= 1.5` or strain `>= 5000`
  - `low`: otherwise

Coach Portfolio:

- Exception score = `highRiskDays*3 + missedSessions*2 + lowRecoveryDays`.
- Status:
  - `critical`: score `>= 12` or `highRiskDays >= 3`
  - `watch`: score `>= 6`
  - `stable`: otherwise
- Sorted by status severity -> exception score desc -> athlete name -> id.

## UI Behavior

- Window selector drives all five modules in one synchronized view.
- Each module has explicit empty-state text for sparse windows.
- Severity/risk/status labels are rendered with deterministic badges.

## Coverage

- Query tests:
  `src/features/v1-5-analytics/__tests__/v1-5-analytics-query.test.ts`
  validate metric calculations, sorting, classifications, and fallback behavior.
- Component tests:
  `src/features/v1-5-analytics/__tests__/v1-5-analytics-dashboard.test.tsx`
  validate module rendering, window switching, labels, and empty states.
- Page test:
  `src/app/__tests__/v1-5-analytics-dashboard-page.test.tsx`.
