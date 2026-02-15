import { NextResponse } from "next/server"

import { AUTH_SESSION_COOKIE } from "@/features/auth/constants"
import {
  buildAuthApiUrl,
  parseEnvelope
} from "@/features/auth/server/auth-backend"
import type { ApiEnvelope, AuthenticatedActor } from "@/features/auth/types"

type LoginPayload = {
  session_token: string
  expires_at: string
  actor: AuthenticatedActor
}

function readCookieValue(request: Request, key: string): string | null {
  const rawCookieHeader = request.headers.get("cookie")
  if (!rawCookieHeader) {
    return null
  }

  for (const cookiePart of rawCookieHeader.split(";")) {
    const [cookieKey, ...valueParts] = cookiePart.trim().split("=")
    if (cookieKey === key) {
      return valueParts.join("=").trim() || null
    }
  }

  return null
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0
  })
}

function setSessionCookie(
  response: NextResponse,
  payload: { sessionToken: string; expiresAt: string }
): void {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: payload.sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(payload.expiresAt)
  })
}

function authRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      data: null,
      error: {
        code: "auth_required",
        message: "Authentication is required.",
        details: {}
      }
    },
    { status: 401 }
  )
}

function upstreamUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      data: null,
      error: {
        code: "upstream_unavailable",
        message: "Authentication service unavailable.",
        details: {}
      }
    },
    { status: 502 }
  )
}

async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function handleLoginRequest(
  request: Request
): Promise<NextResponse> {
  const requestBody = await parseJsonBody(request)
  if (!requestBody) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "invalid_request",
          message: "Request is invalid.",
          details: {}
        }
      },
      { status: 400 }
    )
  }

  try {
    const upstreamResponse = await fetch(buildAuthApiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody),
      cache: "no-store"
    })
    const payload = await parseEnvelope<LoginPayload>(upstreamResponse)

    if (!payload) {
      return upstreamUnavailableResponse()
    }

    if (!upstreamResponse.ok || !payload.data) {
      return NextResponse.json(payload, { status: upstreamResponse.status })
    }

    const response = NextResponse.json(
      {
        data: {
          actor: payload.data.actor
        },
        error: null
      },
      { status: 200 }
    )
    setSessionCookie(response, {
      sessionToken: payload.data.session_token,
      expiresAt: payload.data.expires_at
    })
    return response
  } catch {
    return upstreamUnavailableResponse()
  }
}

export async function handleSessionRequest(
  request: Request
): Promise<NextResponse> {
  const token = readCookieValue(request, AUTH_SESSION_COOKIE)
  if (!token) {
    return authRequiredResponse()
  }

  try {
    const upstreamResponse = await fetch(buildAuthApiUrl("/auth/session"), {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`
      },
      cache: "no-store"
    })
    const payload = await parseEnvelope<{ actor: AuthenticatedActor }>(
      upstreamResponse
    )
    if (!payload) {
      return upstreamUnavailableResponse()
    }

    const response = NextResponse.json(payload, {
      status: upstreamResponse.status
    })
    if (upstreamResponse.status === 401) {
      clearSessionCookie(response)
    }
    return response
  } catch {
    return upstreamUnavailableResponse()
  }
}

export async function handleOnboardingRequest(
  request: Request
): Promise<NextResponse> {
  const token = readCookieValue(request, AUTH_SESSION_COOKIE)
  if (!token) {
    return authRequiredResponse()
  }

  const requestBody = await parseJsonBody(request)
  if (!requestBody) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "invalid_request",
          message: "Request is invalid.",
          details: {}
        }
      },
      { status: 400 }
    )
  }

  try {
    const upstreamResponse = await fetch(buildAuthApiUrl("/auth/onboarding"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify(requestBody),
      cache: "no-store"
    })
    const payload = await parseEnvelope<{ actor: AuthenticatedActor }>(
      upstreamResponse
    )
    if (!payload) {
      return upstreamUnavailableResponse()
    }

    const response = NextResponse.json(payload, {
      status: upstreamResponse.status
    })
    if (upstreamResponse.status === 401) {
      clearSessionCookie(response)
    }
    return response
  } catch {
    return upstreamUnavailableResponse()
  }
}

export async function handleLogoutRequest(
  request: Request
): Promise<NextResponse> {
  const token = readCookieValue(request, AUTH_SESSION_COOKIE)

  if (token) {
    try {
      await fetch(buildAuthApiUrl("/auth/logout"), {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`
        },
        cache: "no-store"
      })
    } catch {
      // Logout should still clear local cookie even if upstream is unavailable.
    }
  }

  const response = NextResponse.json({
    data: {
      revoked: true
    },
    error: null
  } satisfies ApiEnvelope<{ revoked: boolean }>)
  clearSessionCookie(response)
  return response
}
