# Axis Fatigue Trends Dashboard

The Axis Fatigue Trends dashboard helps you compare planned vs completed fatigue load over time.

## Where to find it

Open `/dashboard/axis-fatigue` in the web app.

## What it shows

- Neural, metabolic, and mechanical trend lines
- Planned (dashed) vs completed (solid) for each axis
- Recruitment overlay for additional context
- Red-zone threshold at `7.0`

## How to use it

1. Choose a time window (`7 days` or `30 days`).
2. Hover or focus a day marker on the chart.
3. Review drill-down links for contributing completed and planned sessions.

## Notes

- If a selected day has no sessions in a state, the dashboard shows a clear empty-state message.
- Axis values are normalized to a `0-10` range for stable chart rendering.
