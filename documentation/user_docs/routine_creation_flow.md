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
Visual edits and valid DSL edits both update the shared routine state immediately.

## Validation behavior

If DSL input is invalid, the editor shows an inline error with actionable guidance.
Your last valid routine state is preserved, so switching back to Visual mode is safe.
This includes partially invalid payload edits: invalid changes are rejected, and the last valid state stays active.

## Undo/Redo history

You can undo and redo committed routine edits from either editing mode.

- Buttons: `Undo` and `Redo` in the flow header
- Keyboard shortcuts:
  - `Ctrl/Cmd + Z` -> Undo
  - `Ctrl/Cmd + Y` -> Redo
  - `Ctrl/Cmd + Shift + Z` -> Redo

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

## Advanced strength controls

Strength mode now also supports:

- custom variables (for example, `topSetLoad`)
- loop counts and optional conditions on strength blocks
- exercise-level conditions
- set-level progression strategy + value
- set-level rest seconds and optional timer seconds
- drag/drop reordering of exercises inside a block
- keyboard reordering with move up/down controls

## Payload preview

A preview panel shows the currently synchronized routine payload. This mirrors what downstream sync/parity hooks consume.
