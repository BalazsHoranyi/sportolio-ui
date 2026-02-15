# Endurance Progress Dashboard

Use this dashboard to check whether your endurance training is balanced across
zones and whether threshold performance is improving.

## Includes

- Zone distribution (`Z1`..`Z5`) for the selected window
- Threshold trend chart for pace or power
- Confidence indicator for inferred threshold points
- Session drill-down links from trend points

## How to use

1. Open `/dashboard/endurance-progress`.
2. Choose a window (`7 days`, `30 days`, etc.).
3. Toggle threshold metric (`Threshold pace` / `Threshold power`).
4. Hover or focus a trend point to inspect value, confidence, and contributing
   sessions.

## Confidence Bands

- Low: under `50%`
- Medium: `50%-79%`
- High: `80%+`

## Notes

- Points with no linked contributors display an explicit empty message.
- Missing window/metric data shows a safe fallback card instead of failing.
