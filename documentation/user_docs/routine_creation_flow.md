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

## Advanced DSL editor safeguards

DSL mode now includes:

- syntax highlighting and autocomplete support in the editor surface
- non-blocking lint warnings for risky constructs (for example missing progression values or unusually large repeat/interval values)
- a primitive reference panel with examples for common keys (`path`, `strength.variables`, `endurance.timeline`, `templateSource`)

Only structurally invalid DSL blocks commit. Warning-only payloads can still be applied.

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

## Payload previews

Two preview panels are available:

- Routine payload preview: the synchronized routine JSON used by the visual/DSL editor flow.
- Tracking execution payload preview: an expanded, deterministic execution contract (`schema_version: "1.0"`) for downstream workout logging/tracking surfaces.

The tracking payload expands repeat loops and nested endurance blocks into executable set/interval sequences while preserving template attribution metadata.

## Routine template library

The flow now includes a **Routine template library** so you can reuse routines.

You can:

- save the current routine as a template
- add template tags (for example, `strength`, `power`)
- filter templates by modality and tags
- instantiate templates into `macro`, `meso`, or `micro` planning context

Instantiated routines include source attribution metadata in the payload preview (`templateSource`) so you can trace where the routine came from.

## Template permissions

- Coaches and athletes can use their own templates.
- Athletes can instantiate coach templates when the template visibility is `shared`.
- Private coach templates are not available to athletes.

## Direct route

You can open the routine flow directly at `/routine`.
