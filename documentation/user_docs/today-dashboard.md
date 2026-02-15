# Today Dashboard

The Today dashboard gives you a focused view of fatigue carryover and execution readiness.

## What it shows

- Neural, Metabolic, and Mechanical gauges
- Recruitment badge
- Combined fatigue score
- System capacity indicator (Sleep, Fuel, Stress, Gate)
- “Why this <score>?” links on every displayed score (Neural, Metabolic, Mechanical, Recruitment, Combined)
- “Why this today” links to completed sessions contributing in the active accumulation window

## How to use it

1. Open `/today`.
2. Check if any primary axis is in the red zone (`>= 7.0`).
3. Compare combined score with system-capacity values before deciding to push/deload.
4. Use the score-level “Why this <score>?” links to inspect explainability for each score.
5. Open “Why this today” links to inspect contributing completed sessions.

## Notes

- Only included accumulated sessions appear in “Why this today.”
- If a score explanation link is unavailable, the dashboard shows an inline “explanation unavailable” message for that score.
- Missing system-capacity values are shown as `n/a` rather than failing the page.
