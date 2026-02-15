# Planner Interference Warnings

Sportolo now shows soft interference warnings in the cycle planner **Review** step when planned workouts create high-risk axis overlap inside short recovery windows.

## What changed

- Warnings are now based on scheduled workout clashes (not just goal timing).
- Each warning includes:
  - conflict rationale (axis overlap + recovery window)
  - at least one alternative suggestion (for example, move one workout later)
- You can explicitly select **Proceed anyway**.
- Proceed decisions are saved and shown in a **Proceed decisions** audit section for later review.

## Important behavior

- Warnings are non-blocking: you can continue planning and save drafts.
- Decision history is persisted locally so it remains visible after reload/remount in the same browser profile.
