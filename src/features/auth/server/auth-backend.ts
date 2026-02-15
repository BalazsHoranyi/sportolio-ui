import { DEFAULT_AUTH_API_BASE_URL } from "@/features/auth/constants"
import type { ApiEnvelope } from "@/features/auth/types"

export function resolveAuthApiBaseUrl(): string {
  const configured = process.env.SPORTOLO_API_BASE_URL?.trim()
  if (!configured) {
    return DEFAULT_AUTH_API_BASE_URL
  }
  return configured.replace(/\/+$/, "")
}

export function buildAuthApiUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`
  return `${resolveAuthApiBaseUrl()}${normalizedPath}`
}

export async function parseEnvelope<TData>(
  response: Response
): Promise<ApiEnvelope<TData> | null> {
  try {
    return (await response.json()) as ApiEnvelope<TData>
  } catch {
    return null
  }
}
