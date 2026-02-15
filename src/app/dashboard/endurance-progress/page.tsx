import { EnduranceProgressDashboard } from "@/features/endurance-progress/components/endurance-progress-dashboard"
import { enduranceProgressPreviewData } from "@/features/endurance-progress/endurance-progress-preview"

export default function EnduranceProgressDashboardPage() {
  return <EnduranceProgressDashboard data={enduranceProgressPreviewData} />
}
