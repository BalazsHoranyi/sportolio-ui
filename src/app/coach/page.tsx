import { AppShell } from "@/components/layout/app-shell"
import { Card } from "@/components/ui/card"

export default function CoachPage() {
  return (
    <AppShell
      title="Coach Workspace"
      description="Role-guarded coach entry point for athlete planning oversight."
      maxWidth="narrow"
    >
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-medium">Coach-only access confirmed</h2>
        <p className="text-sm text-muted-foreground">
          This route is available only to authenticated coaches with completed
          onboarding.
        </p>
      </Card>
    </AppShell>
  )
}
