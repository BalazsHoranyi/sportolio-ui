# UI Architecture Baseline

Sportolo now uses a shared layout foundation across key web pages.

## What changed

- Planning, Today, and Routine pages now share one responsive shell layout.
- A keyboard skip link (`Skip to main content`) is available at the top of the app.
- Section spacing and page width behavior are consistent across these flows.

## Manual check

1. Open `/`, `/today`, and `/routine`.
2. Press `Tab` from the top of each page to reveal `Skip to main content`.
3. Press `Enter` and confirm focus moves into the main content area.
4. Check desktop and mobile widths for any clipping or horizontal overflow.
