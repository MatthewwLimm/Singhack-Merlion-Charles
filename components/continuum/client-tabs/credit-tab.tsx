import { CreditCard, Plus } from 'lucide-react'
import { MetricCard } from '../metric-card'
import { LtvThresholdBar } from '../ltv-threshold-bar'
import { SourceCitation, SystemLabel } from '../source-citation'
import { LtvProgression } from '../ltv-progression'
import { formatMoney, formatPct } from '@/lib/format'
import type { CreditFacilityWithSnapshots } from '@/services/credit'
import type { HoldingWithInstrument } from '@/lib/supabase/types'

export function CreditTab({
  facilities,
  holdings,
}: {
  facilities: CreditFacilityWithSnapshots[]
  holdings: HoldingWithInstrument[]
}) {
  if (facilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">No Credit Facility on Record</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          This client currently has no active credit lines or collateralized facility agreements set up.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Initiate Credit Line Proposal
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {facilities.map((facility) => (
        <FacilityCard key={facility.facility_id} facility={facility} holdings={holdings} />
      ))}
    </div>
  )
}

function FacilityCard({
  facility,
  holdings,
}: {
  facility: CreditFacilityWithSnapshots
  holdings: HoldingWithInstrument[]
}) {
  // facility card implementation...
  return null
}