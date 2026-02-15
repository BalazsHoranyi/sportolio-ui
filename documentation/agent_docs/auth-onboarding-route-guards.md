# Auth, Onboarding, and Route Guards

## Overview

Web auth for v1 is implemented with backend-backed session tokens and frontend route guarding:

- Login via backend `/v1/auth/login`
- Session lookup via `/v1/auth/session`
- Role-aware onboarding via `/v1/auth/onboarding`
- Logout via `/v1/auth/logout`
- Protected web routes enforced by Next middleware

## Implementation

- `src/features/auth/server/auth-route-handlers.ts`
  - route handler logic for login/session/onboarding/logout
  - backend proxy to `SPORTOLO_API_BASE_URL` (default `http://127.0.0.1:8000/v1`)
  - secure session cookie lifecycle (`sportolo_session`, HttpOnly, same-site lax)
  - token clearing on logout and invalid session responses

- `src/app/api/auth/*/route.ts`
  - Next route bindings for auth proxy endpoints:
    - `POST /api/auth/login`
    - `GET /api/auth/session`
    - `POST /api/auth/onboarding`
    - `POST /api/auth/logout`

- `src/middleware.ts`
  - applies auth gate for:
    - `/`
    - `/today`
    - `/routine`
    - `/dashboard/*`
    - `/coach/*`
    - `/login`
    - `/onboarding`
  - redirects:
    - unauthenticated -> `/login`
    - authenticated + not onboarded -> `/onboarding`
    - authenticated + onboarded hitting `/login` -> `/`
    - non-coach hitting `/coach/*` -> `/`

- `src/features/auth/guard-policy.ts`
  - deterministic redirect policy used by middleware

- `src/app/login/page.tsx` + `src/features/auth/components/login-form.tsx`
  - credential form
  - redirects based on onboarding completion

- `src/app/onboarding/page.tsx` + `src/features/auth/components/onboarding-form.tsx`
  - role-specific onboarding forms:
    - athlete: `primary_modality`, `experience_level`
    - coach: `coaching_focus`, `athlete_capacity`

- `src/app/coach/page.tsx`
  - coach-only route target for role guard validation

## Testing

- `src/features/auth/__tests__/guard-policy.test.ts`
  - redirect rules for public/protected routes
  - onboarding gate behavior
  - coach-only role gate

- `src/features/auth/__tests__/login-form.test.tsx`
  - login success redirect logic
  - invalid credential error handling

- `src/features/auth/__tests__/onboarding-form.test.tsx`
  - role-specific field rendering
  - payload mapping for athlete/coach onboarding
  - unauthenticated redirect behavior

- `src/app/api/auth/__tests__/route-handlers.test.ts`
  - login proxy and cookie setting
  - session auth-required behavior
  - onboarding bearer forwarding
  - logout cookie revocation
