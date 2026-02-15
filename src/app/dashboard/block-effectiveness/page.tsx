import { BlockEffectivenessDashboard } from "@/features/block-effectiveness/components/block-effectiveness-dashboard"
import { blockEffectivenessPreviewData } from "@/features/block-effectiveness/block-effectiveness-preview"

export default function BlockEffectivenessDashboardPage() {
  return <BlockEffectivenessDashboard data={blockEffectivenessPreviewData} />
}
