# Cycle Creation Flow (SPRT-62)

## Overview

The planning surface now includes a guided cycle-creation wizard for web v1. The flow covers:

- Macro setup via start date + goals/events
- Mesocycle strategy selection (`block`, `dup`, `linear`) and parameters
- Microcycle detail editing
- Review with soft warnings and alternative suggestions
- Draft-save and continue-editing via local persistence

## Implementation

- `src/features/planning/cycle-creation.ts`
  - Draft types for goals, mesocycle, and microcycles
  - Step validators:
    - `validateGoalStep`
    - `validateMesocycleStep`
    - `validateMicrocycleStep`
  - Soft warning generator:
    - `buildCycleWarnings`
  - Deterministic microcycle resize:
    - `setMicrocycleCount`
  - Deterministic microcycle reorder:
    - `moveMicrocycle`
  - Draft persistence helpers:
    - `serializeCycleDraft`
    - `parseCycleDraft`

- `src/features/planning/components/cycle-creation-flow.tsx`
  - Step-based wizard UI
  - Explicit active-goal selection for multi-goal planning
  - Keyboard-accessible microcycle move-up/move-down controls in Microcycle Details
  - Non-blocking warning display with alternatives
  - Review-step microcycle muscle-map summaries with drill-down links
  - `Save draft` and restore-on-load behavior

- `src/features/planning/components/planning-surface.tsx`
  - Cycle creation flow is now composed into the main planning surface.

- `src/features/planning/microcycle-muscle-summary.ts`
  - Planner-workout to microcycle summary mapping
  - Exercise-title matching against catalog for muscle attribution
  - Visual-only high-overlap detection per microcycle

## Testing

- `src/features/planning/__tests__/cycle-creation.test.ts`
  - required goal-step validation
  - active-goal requirement for multi-goal drafts
  - mesocycle parameter validation
  - warning generation with alternatives
  - deterministic microcycle resizing
  - deterministic microcycle reorder and out-of-bounds no-op behavior
  - reorder persistence through draft serialize/parse

- `src/features/planning/__tests__/cycle-creation-flow.test.tsx`
  - full wizard step-through (goal -> mesocycle -> microcycle -> review)
  - soft warning visibility and proceed-anyway control
  - keyboard/mouse microcycle reorder controls
  - reorder persistence after save + restore
  - draft-save + restore on remount

- `src/features/planning/__tests__/microcycle-muscle-summary.test.ts`
  - microcycle grouping + deterministic drill-down output
  - out-of-window exclusion and unmatched-workout handling
  - high-overlap visual signal behavior

- `src/features/planning/__tests__/planning-surface-muscle-summary.test.tsx`
  - planner add/move/remove operations refresh review-step summary

## Notes

- Warnings are intentionally soft and do not block progression.
- Structural validity still blocks step transitions.
- Mobile execution scope is intentionally excluded for this feature.
