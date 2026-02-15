import {
  buildAuthApiUrl,
  parseEnvelope
} from "@/features/auth/server/auth-backend"
import type { AuthenticatedActor } from "@/features/auth/types"

export async function resolveActorFromSessionToken(
  token: string
): Promise<AuthenticatedActor | null> {
  try {
    const response = await fetch(buildAuthApiUrl("/auth/session"), {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`
      },
      cache: "no-store"
    })
    if (!response.ok) {
      return null
    }

    const payload = await parseEnvelope<{ actor: AuthenticatedActor }>(response)
    return payload?.data?.actor ?? null
  } catch {
    return null
  }
}
