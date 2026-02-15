import { handleLogoutRequest } from "@/features/auth/server/auth-route-handlers"

export async function POST(request: Request) {
  return handleLogoutRequest(request)
}
