import { AxisFatigueTrendsDashboard } from "@/features/axis-fatigue-trends/components/axis-fatigue-trends-dashboard"
import { axisFatigueTrendsPreviewData } from "@/features/axis-fatigue-trends/axis-fatigue-trends-preview"

export default function AxisFatigueDashboardPage() {
  return <AxisFatigueTrendsDashboard data={axisFatigueTrendsPreviewData} />
}
