# Endurance Timeline Builder (SPRT-22)

## Files

- `src/features/routine/components/endurance-timeline-builder.tsx`
- `src/features/routine/components/routine-creation-flow.tsx`
- `src/features/routine/routine-dsl.ts`
- `src/features/routine/types.ts`

## Contract

- Endurance draft now uses:
  - `timeline: EnduranceTimelineNode[]`
  - `reusableBlocks: EnduranceReusableBlock[]`
- `EnduranceTargetType` includes `cadence`.
- Parser accepts:
  - new format: `endurance.timeline` (+ optional `endurance.reusableBlocks`)
  - legacy format: `endurance.intervals` (normalized into timeline nodes)

## Behavior

- Horizontal drag updates interval duration with 1-second precision.
- Vertical drag updates interval target value.
- Duration clamp: `>= 1`.
- Target clamp: `[1, 2000]`.
- Keyboard fallback:
  - duration handle: left/right arrows
  - target handle: up/down arrows
- Nested blocks and reusable block insertion are supported.
- Reusable block insertion deep-clones with fresh IDs.

## Tests

- `src/features/routine/__tests__/routine-dsl.test.ts`
  - nested timeline parsing
  - legacy interval normalization
- `src/features/routine/__tests__/routine-creation-flow.test.tsx`
  - drag interaction semantics
  - nested + reusable block preview behavior
