import { AppShell } from "@/components/layout/app-shell"
import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    <AppShell
      title="Sportolo Login"
      description="Sign in to access planning, dashboards, and routine workflows."
      maxWidth="narrow"
    >
      <LoginForm />
    </AppShell>
  )
}
