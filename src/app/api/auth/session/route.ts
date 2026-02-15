import { handleSessionRequest } from "@/features/auth/server/auth-route-handlers"

export async function GET(request: Request) {
  return handleSessionRequest(request)
}
