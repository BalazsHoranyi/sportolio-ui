# v1.5 Analytics Pack Dashboard

The v1.5 Analytics Pack combines five advanced coaching/athlete analytics views
into one dashboard.

## Where to find it

Open `/dashboard/v1-5-analytics`.

## What it shows

- Strength Progress:
  - e1RM trend by lift
  - PR event count
  - total volume-load
  - low/moderate/high intensity distribution
- Interference Audit:
  - regional overlap conflicts
  - severity labels (`High`, `Medium`, `Low` conflict)
- Recovery IO:
  - recovery input vs next-day output links
  - alignment score
  - trend direction (`Upward`, `Flat`, `Downward`)
- Monotony / Strain:
  - weekly monotony and strain values
  - risk band (`Low`, `Moderate`, `High`)
- Coach Portfolio:
  - athlete exception score
  - status badge (`Critical`, `Watch`, `Stable`)

## How to use it

1. Select the time window at the top (`7 days`, `28 days`, etc.).
2. Review Strength Progress to confirm load progression and PR signals.
3. Use Interference Audit to identify high-overlap region conflicts.
4. Compare Recovery IO alignment and trajectory before programming harder blocks.
5. Check Monotony / Strain risk bands week over week.
6. Prioritize coach follow-up using Coach Portfolio status ordering.

## Empty/sparse windows

If a selected window has no data, each module shows a safe empty state instead
of partial or ambiguous values.
