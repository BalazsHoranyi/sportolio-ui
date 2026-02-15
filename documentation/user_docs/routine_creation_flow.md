# Routine Creation Flow

The routine builder now supports two ways to create training routines.

## Entry paths

- `Strength`: build routines by selecting strength exercises.
- `Endurance`: build routines by managing interval blocks.

You can switch between these paths at any time.

## Editing modes

- `Visual`: form-based editing for fast setup.
- `DSL`: advanced JSON editor for direct control.

Switching modes keeps your supported routine fields synchronized.

## Validation behavior

If DSL input is invalid, the editor shows an inline error with actionable guidance.
Your last valid routine state is preserved, so switching back to Visual mode is safe.

## Endurance interval controls

In Endurance visual mode, you can:

- add intervals
- remove intervals (at least one interval remains)
- review duration and target values per interval

## Strength selection

In Strength visual mode, you can:

- search/filter exercises
- add exercises to the routine
- remove selected exercises

## Payload preview

A preview panel shows the currently synchronized routine payload. This mirrors what downstream sync/parity hooks consume.
