# Block Effectiveness Dashboard

The Block Effectiveness dashboard compares mesocycle block goals against
realized outcomes so you can adjust upcoming blocks using evidence, not guesswork.

## Where to find it

Open `/dashboard/block-effectiveness`.

## What it shows

- Block Effectiveness Index (how close outcomes are to block targets)
- Average delta across all objectives in the selected block
- Data confidence status (`Reliable data`, `Sparse data`, `Low-quality data`)
- Per-metric table for target vs realized outcomes (strength + endurance)
- Session drill-down links showing contributors for each metric delta

## How to use it

1. Choose a date window (`7 days` or `30 days`).
2. Choose a block (`Base`, `Build`, etc.).
3. Review summary cards to understand block quality and trend direction.
4. In the metrics table, pick `View contributors` for a metric.
5. Use linked sessions to inspect why the delta moved positive or negative.

## Data confidence meanings

- Reliable data: enough samples with healthy confidence
- Sparse data: not enough samples to trust trend strongly
- Low-quality data: enough samples exist, but confidence quality is weak

## Notes

- Strength and endurance objectives can appear together in the same block.
- For lower-is-better metrics (for example pace), delta direction is normalized
  so positive still indicates movement toward target.
- If a target is missing/invalid (`<= 0`), percentage-based delta and
  effectiveness are safely guarded.
