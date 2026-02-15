# Routine Creation Flow (SPRT-63)

## Overview

`RoutineCreationFlow` introduces a dual-mode routine authoring experience:

- Entry paths: `strength` and `endurance`
- Editing modes: `visual` and `dsl`
- Deterministic synchronization between visual state and DSL JSON for supported fields

The page entrypoint (`src/app/page.tsx`) now renders this flow.

## Data Model

Routine state lives in `RoutineDraft` (`src/features/routine/types.ts`):

- `name`: routine display name
- `path`: `strength | endurance`
- `strength.exerciseIds[]`: selected exercise IDs
- `endurance.intervals[]`: interval definitions (`id`, `label`, `durationSeconds`, `targetType`, `targetValue`)

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
- at least one endurance interval with valid numeric fields and target type

## UI Behavior

- Mode switches (`Visual`/`DSL`) use toggle buttons with `aria-pressed`.
- Path switches (`Strength`/`Endurance`) preserve both path payloads in the draft.
- Invalid DSL edits do not clobber last valid visual state.
- A payload preview card exposes the current synchronized routine JSON as a parity hook.

## Tests

- `src/features/routine/__tests__/routine-creation-flow.test.tsx`
  - path and mode switching
  - DSL -> visual synchronization
  - invalid DSL inline error and valid-state preservation
- `src/features/routine/__tests__/routine-dsl.test.ts`
  - parse/serialize round-trip
  - syntax and schema validation paths
  - strength ID dedupe behavior
