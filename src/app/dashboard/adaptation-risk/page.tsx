import { AdaptationRiskTimelineDashboard } from "@/features/adaptation-risk-timeline/components/adaptation-risk-timeline-dashboard"
import { adaptationRiskTimelinePreviewData } from "@/features/adaptation-risk-timeline/adaptation-risk-timeline-preview"

export default function AdaptationRiskDashboardPage() {
  return (
    <AdaptationRiskTimelineDashboard data={adaptationRiskTimelinePreviewData} />
  )
}
