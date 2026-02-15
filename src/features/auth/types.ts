export type AuthRole = "athlete" | "coach"

export type AuthenticatedActor = {
  user_id: string
  email: string
  role: AuthRole
  onboarding_completed: boolean
  display_name: string | null
}

export type ApiErrorPayload = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiEnvelope<TData> = {
  data: TData | null
  error: ApiErrorPayload | null
}
