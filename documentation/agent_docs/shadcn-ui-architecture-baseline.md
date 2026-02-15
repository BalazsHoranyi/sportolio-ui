# Shadcn UI Architecture Baseline (SPRT-64)

## Summary

Core web surfaces now share a single layout primitive so dashboard/calendar/flow pages use consistent spacing, width, and accessibility defaults.

## Implementation Contracts

- Shared shell component: `src/components/layout/app-shell.tsx`
  - Renders the page `<main>` with:
    - `data-layout="app-shell"`
    - default `id="main-content"`
    - `tabIndex={-1}` for keyboard skip-link focus target
  - Width variants:
    - `default` (`max-w-6xl`)
    - `narrow` (`max-w-5xl`)
- Shared shell spacing token class:
  - `src/app/globals.css`
  - `.app-shell` controls shared responsive page padding and vertical spacing.
- Skip-link primitive:
  - `src/components/layout/skip-to-content-link.tsx`
  - Mounted in `src/app/layout.tsx`

## Adopted Surfaces

- `src/features/planning/components/planning-surface.tsx`
- `src/features/today/components/today-dashboard.tsx`
- `src/features/routine/components/routine-creation-flow.tsx`

## Test Coverage

- `src/features/planning/__tests__/planning-surface-muscle-summary.test.tsx`
- `src/features/today/__tests__/today-dashboard.test.tsx`
- `src/features/routine/__tests__/routine-creation-flow.test.tsx`
- `src/app/__tests__/root-layout.test.tsx`

## Responsive QA Checklist

1. Confirm skip-link appears on keyboard focus and targets main content.
2. Validate no horizontal overflow in dense card content blocks.
3. Validate consistent spacing rhythm between sections.
4. Validate readability and contrast on both desktop and mobile.
5. Capture screenshots for planning (`/`), today (`/today`), routine (`/routine`) at desktop and mobile viewports.
