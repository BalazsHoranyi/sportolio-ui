# Adaptation Risk Timeline

The Adaptation Risk Timeline helps you see when planned training load is likely
to outpace adaptation quality.

## What you see

- A risk timeline chart based on gated combined fatigue score
- Green/yellow/red risk zones with threshold guides
- Window filters (for example, 7-day vs 30-day views)
- A detail panel for each timeline point with contributor session links

## How to use it

1. Open the dashboard route: `/dashboard/adaptation-risk`.
2. Switch date windows to compare short-term and broader trends.
3. Hover or focus a point to inspect:
   - gated risk score
   - current risk zone
   - sessions contributing to that point
4. Use contributor links to inspect the sessions behind elevated or red risk.

## Risk thresholds

- Green: below `5.0`
- Yellow: `5.0` to `6.9`
- Red: `7.0` and above

## Notes

- If a selected point has no contributors, the dashboard shows an explicit
  empty-state message.
- If timeline data is missing for a selected window, the dashboard shows a
  safe fallback message instead of failing.
