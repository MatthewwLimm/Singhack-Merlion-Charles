import {
  BookOpenIcon,
  CalendarIcon,
  ContactIcon,
  FileCheckIcon,
  FileTextIcon,
  LandmarkIcon,
  LayersIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/continuum/page-header'

const sources = [
  { name: 'Holdings', icon: LayersIcon, detail: 'Positions, allocation and valuations across custody accounts.', status: 'Connected', sync: '04 Sep 2026, close of business' },
  { name: 'Credit Facility', icon: LandmarkIcon, detail: 'Lombard facility balances, collateral and threshold monitoring.', status: 'Connected', sync: '05 Sep 2026, 06:00 HKT' },
  { name: 'Mandate', icon: ScaleIcon, detail: 'Risk profile, permitted ranges and suitability constraints.', status: 'Connected', sync: '05 Sep 2026, 06:00 HKT' },
  { name: 'RM Note', icon: FileTextIcon, detail: 'Structured notes and observations logged by relationship managers.', status: 'Connected', sync: 'Real-time' },
  { name: 'Advice Ledger', icon: BookOpenIcon, detail: 'Persistent record of every recommendation and its outcome.', status: 'Connected', sync: 'Real-time' },
  { name: 'CRM', icon: ContactIcon, detail: 'Client communications, obligations and relationship events.', status: 'Connected', sync: '05 Sep 2026, 05:40 HKT' },
  { name: 'Calendar', icon: CalendarIcon, detail: 'Scheduled meetings and reviews.', status: 'Connected', sync: '05 Sep 2026, 06:00 HKT' },
  { name: 'Valuations', icon: FileCheckIcon, detail: 'Private-market and illiquid asset valuations.', status: 'Attention needed', sync: '15 Sep 2025' },
  { name: 'Suitability', icon: ShieldCheckIcon, detail: 'Client risk profiling and mandate suitability assessments.', status: 'Connected', sync: '30 Aug 2026' },
]

export default function DataSourcesPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      <PageHeader
        title="Data Sources"
        subtitle="Every figure shown in Continuum is traceable to one of these systems."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <div key={s.name} className="flex flex-col gap-3 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <s.icon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{s.name}</h3>
              </div>
              <span
                className={
                  s.status === 'Connected'
                    ? 'rounded-sm bg-signal-positive-muted px-1.5 py-px text-[10px] font-semibold tracking-wide text-signal-positive uppercase'
                    : 'rounded-sm bg-signal-warning-muted px-1.5 py-px text-[10px] font-semibold tracking-wide text-signal-warning-foreground uppercase'
                }
              >
                {s.status}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty">{s.detail}</p>
            <p className="tabular mt-auto text-[11px] text-muted-foreground">Last sync · {s.sync}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
