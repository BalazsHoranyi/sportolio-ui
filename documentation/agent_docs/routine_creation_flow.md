# Routine Creation Flow (SPRT-63, SPRT-21)

## Overview

`RoutineCreationFlow` provides dual-mode routine authoring with advanced strength controls:

- Entry paths: `strength` and `endurance`
- Editing modes: `visual` and `dsl`
- Deterministic synchronization between visual state and DSL JSON for supported fields
- Shared edit history (`undo`/`redo`) across visual and DSL-originated valid edits

## Data Model

Routine state lives in `RoutineDraft` (`src/features/routine/types.ts`):

- `name`: routine display name
- `path`: `strength | endurance`
- `strength.exerciseIds[]`: selected exercise IDs
- `strength.variables[]`: custom variables (`id`, `name`, `defaultValue`)
- `strength.blocks[]`: loopable strength blocks (`id`, `name`, `repeatCount`, `condition`, `exercises[]`)
- `strength.blocks[].exercises[].sets[]`: set-level load/reps/rest/timer/progression/condition fields
- `endurance.timeline[]`: timeline nodes (`interval` or nested `block`)

## DSL Contract

`src/features/routine/routine-dsl.ts` provides:

- `buildInitialRoutineDraft()`
- `serializeRoutineDraft(draft)`
- `parseRoutineDsl(source)` with inline actionable validation messages

Validation guarantees include:

- valid JSON object payload
- valid `path` value
- non-empty routine name
- `strength.exerciseIds` string array
- `strength.variables` and `strength.blocks` schema validation when provided
- legacy strength payloads are hydrated with default `variables` and `blocks`
- at least one endurance interval with valid numeric fields and target type

## UI Behavior

- Mode switches (`Visual`/`DSL`) use toggle buttons with `aria-pressed`.
- Path switches (`Strength`/`Endurance`) preserve both path payloads in the draft.
- Every visual edit commits immediately to DSL state.
- Every valid DSL edit commits immediately to visual state.
- Invalid or partially invalid DSL edits do not clobber last valid committed state.
- Undo/redo controls are available in the form header and are keyboard-addressable (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Y`, `Ctrl/Cmd+Shift+Z`).
- A payload preview card exposes the current synchronized routine JSON as a parity hook.
- Strength visual mode additionally supports:
  - custom variable add/edit/remove
  - block loop counts and block condition editing
  - per-exercise condition editing
  - set-level progression, progression value, rest, and timer controls
  - exercise reorder via drag/drop and keyboard move actions

## Tests

- `src/features/routine/__tests__/routine-creation-flow.test.tsx`
  - path and mode switching
  - DSL -> visual synchronization
  - invalid DSL inline error and valid-state preservation
  - undo/redo history for visual edits
  - undo/redo history for DSL edits
  - partially invalid DSL conflict handling
  - advanced strength fields retained in DSL mode
  - strength drag/drop and keyboard reorder flow
- `src/features/routine/__tests__/routine-dsl.test.ts`
  - parse/serialize round-trip
  - fixture corpus round-trip invariants
  - syntax and schema validation paths
  - strength ID dedupe behavior
  - Liftosaur-like advanced strength fixture parity
