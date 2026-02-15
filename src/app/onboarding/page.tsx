import { AppShell } from "@/components/layout/app-shell"
import { OnboardingForm } from "@/features/auth/components/onboarding-form"

export default function OnboardingPage() {
  return (
    <AppShell
      title="Finish Onboarding"
      description="Complete your role setup before entering protected training workflows."
      maxWidth="narrow"
    >
      <OnboardingForm />
    </AppShell>
  )
}
