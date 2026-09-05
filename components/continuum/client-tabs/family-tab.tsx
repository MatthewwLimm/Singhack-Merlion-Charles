import { SourceCitation } from '../source-citation'
import { formatMoney } from '@/lib/format'
import type { Commitment, PlannedCashNeed } from '@/lib/supabase/types'

export function FamilyTab({
  plannedCashNeeds,
  commitments,
}: {
  plannedCashNeeds: PlannedCashNeed[]
  commitments: Commitment[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="cash-needs-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 id="cash-needs-heading" className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Planned cash needs
          </h3>
          <SourceCitation source="CRM" compact />
        </div>
        {plannedCashNeeds.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {plannedCashNeeds.map((n) => (
              <li key={n.need_id} className="flex flex-col gap-2 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold text-foreground">{n.description}</p>
                  <span className="tabular shrink-0 text-xs font-bold text-foreground">{formatMoney(n.amount, n.currency)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                    {n.due_from} – {n.due_to}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 font-medium text-muted-foreground">{n.recurrence}</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                    {n.certainty}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No planned cash needs recorded.
          </p>
        )}
      </section>

      <section aria-labelledby="commitments-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 id="commitments-heading" className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Private-market commitments
          </h3>
          <SourceCitation source="Holdings" compact />
        </div>
        {commitments.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {commitments.map((c) => (
              <li key={c.commitment_id} className="flex flex-col gap-2 px-4 py-3.5">
                <p className="text-xs font-semibold text-foreground">{c.fund_name}</p>
                <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Committed</p>
                    <p className="tabular font-medium text-foreground">{formatMoney(c.committed, c.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Called</p>
                    <p className="tabular font-medium text-foreground">{formatMoney(c.called_to_date, c.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Uncalled</p>
                    <p className="tabular font-medium text-destructive">{formatMoney(c.uncalled, c.currency)}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Expected call window: <span className="font-medium text-foreground">{c.expected_call_window}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No private-market commitments recorded.
          </p>
        )}
      </section>
    </div>
  )
}