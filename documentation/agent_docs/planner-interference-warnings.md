# Planner Interference Warnings (SPRT-19)

## Scope

Adds soft interference warnings to cycle planner review based on scheduled workout clashes, with alternative suggestions and persisted `Proceed anyway` audit decisions.

## Implementation

- Warning engine updates in `src/features/planning/cycle-creation.ts`:
  - `buildCycleWarnings(draft, plannedWorkouts)` now accepts planner workouts.
  - Adds `axis_overlap` warning type (`severity: high`) when two workouts share axis load inside a recovery window.
  - Infers workout modality/axis profile from title keywords.
  - Warning rationale explicitly includes axis overlap + recovery-window context.
  - Suggestion generation provides deterministic alternatives (move target workout by minimum hours or lower-load substitution).
- Review-step behavior in `src/features/planning/components/cycle-creation-flow.tsx`:
  - Uses planner workouts from `PlanningSurface` when building warnings.
  - Keeps warnings non-blocking.
  - Persists proceed decisions in local storage key `sportolo.cycle-creation.interference-decisions.v1`.
  - Surfaces a `Proceed decisions` audit list in review.

## Contracts

- Planner warnings are advisory only; they do not block step progression or draft saving.
- Axis conflict detection is deterministic for identical draft/workout inputs.
- Persisted decisions capture:
  - timestamp
  - selected proceed state
  - warning messages present at decision time

## Testing

- `src/features/planning/__tests__/cycle-creation.test.ts`
  - axis-overlap trigger behavior
  - recovery-window rationale presence
  - deterministic warning generation
- `src/features/planning/__tests__/cycle-creation-flow.test.tsx`
  - review rendering of axis-overlap warnings
  - persisted proceed decision audit trail across remount
