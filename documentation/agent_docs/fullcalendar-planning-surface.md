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
  - composes planner with weekly audit preview

- `src/app/page.tsx`
  - home route now renders planning surface

## Testing

- `src/features/planning/__tests__/planning-operations.test.ts`
  - deterministic order and boundaries
  - unknown-ID errors

- `src/features/planning/__tests__/planning-calendar.test.tsx`
  - week/month mode integration
  - add/move/remove flows
  - drag/drop callback integration
  - keyboard-accessible move path

## Notes

This is web-only planning behavior and intentionally excludes mobile execution state concerns in v1.
