# Endurance Timeline Builder

The routine creation flow now includes a timeline-based endurance builder.

## What changed

- Endurance workouts can be built with intervals and nested blocks.
- Interval duration can be adjusted by dragging left/right.
- Interval target can be adjusted by dragging up/down.
- Reusable blocks can be saved and inserted later.
- Target types now include `cadence`.

## Notes

- Duration changes use 1-second precision and never go below 1 second.
- Target values are clamped to a safe range.
- Reusable insertions create independent copies.
- Legacy DSL payloads using `endurance.intervals` are still accepted.
