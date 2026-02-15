# Weekly Audit Chart

The Weekly Audit Chart helps you inspect training load trade-offs over the last 7 days.

## What you see

- Three main trend lines: Neural, Metabolic, Mechanical
- Clear series-style semantics:
  - Completed = solid lines
  - Planned = dashed lines
- A dedicated style legend showing `Completed (solid)` and `Planned (dashed)`
- Recruitment shown as a shaded overlay band
- A red-zone threshold marker at `7.0` and above
- Day-level explainability links to sessions that contributed to the selected day

## How to use it

1. Review the 7-day line trends to spot rising or uneven stress.
2. Watch where values cross into the red zone (`>= 7.0`).
3. Hover or focus day markers to inspect contributing sessions in the details panel.

## Notes

- The chart requires a full 7-day payload. If not available, the UI shows a validation message instead of partial chart output.
- Backend state aliases are normalized before rendering:
  - completed aliases: `completed`, `done`, `executed`, `logged`
  - planned aliases: `planned`, `pending`, `scheduled`
  - unknown/missing values default to planned styling
