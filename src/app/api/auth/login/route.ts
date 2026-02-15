import { handleLoginRequest } from "@/features/auth/server/auth-route-handlers"

export async function POST(request: Request) {
  return handleLoginRequest(request)
}
