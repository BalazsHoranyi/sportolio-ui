# Login, Onboarding, and Access Rules

## What changed

The web app now enforces authenticated access and onboarding completion for core planning routes.

### New routes

- `/login`
- `/onboarding`
- `/coach` (coach-only access)

### Protected routes

These now require authentication:

- `/`
- `/today`
- `/routine`
- `/dashboard/*`
- `/coach/*`

## Access behavior

1. If you are not logged in and open a protected page, you are redirected to `/login`.
2. If you are logged in but onboarding is incomplete, you are redirected to `/onboarding`.
3. If onboarding is complete and you open `/login`, you are redirected to `/`.
4. Coach-only routes reject athlete access and redirect to `/`.

## Onboarding fields

- Athlete onboarding asks for:
  - Display name
  - Primary modality
  - Experience level

- Coach onboarding asks for:
  - Display name
  - Coaching focus
  - Athlete capacity

## Session handling

- Sign-in creates a secure session cookie for web auth.
- Logout revokes the session and clears the cookie.
