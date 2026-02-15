# FullCalendar Planning Surface

## Overview

The planner now uses FullCalendar as the primary planning surface for web. It supports week/month calendar views and workout add/move/remove operations with deterministic recomputation payload emission.

## Implementation

- `src/features/planning/planning-operations.ts`
  - deterministic planner operations (`addWorkout`, `moveWorkout`, `removeWorkout`)
  - consistent chronological ordering
  - recalculation boundary generation
  - actionable errors for missing IDs

- `src/features/planning/components/planning-calendar.tsx`
  - FullCalendar integration with `dayGrid`, `timeGrid`, and `interaction` plugins
  - week/month view toggle
  - drag/drop move handling (`eventDrop`)
  - selectable add handling (`select`)
  - click-to-remove handling (`eventClick`)
  - keyboard-accessible fallback controls for move/remove

- `src/features/planning/components/planning-surface.tsx`
  - binds planner updates to visible recompute payload preview
  - derives weekly/monthly planned audit inputs from live planner workouts
  - reflows day/session explainability mapping immediately after add/move/remove

- `src/app/page.tsx`
  - home route now renders planning surface

- `src/features/planning/planning-audit-reflow.ts`
  - deterministic weekly (7-day) + monthly (30-day) planned audit builder
  - UTC day bucketing with stable session ordering
  - title-driven axis contribution synthesis for planned-curve updates
  - planned series-state contract preservation for dashed styling parity

## Testing

- `src/features/planning/__tests__/planning-operations.test.ts`
  - deterministic order and boundaries
  - unknown-ID errors

- `src/features/planning/__tests__/planning-calendar.test.tsx`
  - week/month mode integration
  - add/move/remove flows
  - drag/drop callback integration
  - keyboard-accessible move path

- `src/features/planning/__tests__/planning-audit-reflow.test.ts`
  - deterministic weekly/monthly shape contracts
  - day-level reflow verification after workout date changes

- `src/features/planning/__tests__/planning-surface-audit-reflow.test.tsx`
  - integration coverage for immediate weekly audit reflow after calendar drag move

## Notes

This is web-only planning behavior and intentionally excludes mobile execution state concerns in v1.
