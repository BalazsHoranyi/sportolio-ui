import { SessionComplianceDashboard } from "@/features/session-compliance/components/session-compliance-dashboard"
import { sessionCompliancePreviewData } from "@/features/session-compliance/session-compliance-preview"

export default function SessionComplianceDashboardPage() {
  return <SessionComplianceDashboard data={sessionCompliancePreviewData} />
}
