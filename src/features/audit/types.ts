export type WeeklyAuditSessionLink = {
  id: string
  label: string
  href: string
}

export type WeeklyAuditDay = {
  dayLabel: string
  date: string
  neural: number
  metabolic: number
  mechanical: number
  recruitment: number
  sessions: WeeklyAuditSessionLink[]
}

export type WeeklyAuditChartData = {
  weekLabel: string
  seriesState?: string | null
  days: WeeklyAuditDay[]
}
