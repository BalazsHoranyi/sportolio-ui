import { handleOnboardingRequest } from "@/features/auth/server/auth-route-handlers"

export async function POST(request: Request) {
  return handleOnboardingRequest(request)
}
