# Session Compliance Dashboard

The Session Compliance dashboard shows how closely execution matches your plan,
including moved and skipped workout behavior.

## Where to find it

Open `/dashboard/session-compliance`.

## What it shows

- Planned session count
- Completed session count
- Adherence percentage
- Move and skip event counts
- Adherence state badge (`Green`, `Yellow`, `Red`)
- A trend chart for:
  - daily adherence
  - move events
  - skip events
- Day-level drill-down links back to calendar sessions

## How to use it

1. Choose a date window (`7 days` or `30 days`).
2. Filter by `plan block` and/or `modality`.
3. Review summary metrics and adherence state.
4. Hover or focus a day marker in the chart.
5. Use drill-down links to open related calendar sessions.

## Adherence state thresholds

- Green: `>= 85%`
- Yellow: `60% - 84%`
- Red: `< 60%`

## Notes

- When no sessions match the active filters, the dashboard shows a safe empty
  state instead of failing.
- Unknown session states are treated as planned sessions to keep aggregation
  deterministic.
