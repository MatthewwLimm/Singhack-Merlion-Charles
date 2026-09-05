'use client'

import * as React from 'react'
import { CalculatorIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SourceCitation, SystemLabel, AssistLabel } from './source-citation'
import { LtvThresholdBar } from './ltv-threshold-bar'
import type { InsightWithEvidence } from '@/services/insights'
import type { CreditFacilityWithSnapshots } from '@/services/credit'

export function InsightPanel({
  insight,
  creditFacility,
}: {
  insight: InsightWithEvidence | null
  creditFacility: CreditFacilityWithSnapshots | null
}) {
  const [open, setOpen] = React.useState(false)

  if (!insight) {
    return (
      <section className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No priority signal is currently open for this client — nothing requires immediate action.
      </section>
    )
  }

  const showLtv = insight.insight_type === 'CREDIT_RISK' && creditFacility?.latest && creditFacility.margin_call_ltv_pct != null

  return (
    <section
      aria-labelledby="insight-heading"
      className={cn('rounded-lg border bg-card', insight.severity === 'Critical' || insight.severity === 'High' ? 'border-signal-critical/25' : '')}
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2
              id="insight-heading"
              className={cn(
                'text-[11px] font-semibold tracking-[0.1em] uppercase',
                insight.severity === 'Critical' || insight.severity === 'High' ? 'text-signal-critical' : 'text-muted-foreground',
              )}
            >
              What you need to know
            </h2>
            <p className="max-w-3xl font-serif text-xl leading-snug text-pretty">{insight.summary}</p>
          </div>
          <SystemLabel>Rules-generated · not AI</SystemLabel>
        </div>

        {showLtv && creditFacility?.latest ? (
          <LtvThresholdBar
            current={creditFacility.latest.ltv_pct ?? 0}
            warning={(creditFacility.margin_call_ltv_pct ?? 0) - 5}
            liquidation={creditFacility.margin_call_ltv_pct ?? 0}
          />
        ) : null}
      </div>

      {insight.evidence.length ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between border-t px-6 py-3">
            <CollapsibleTrigger
              render={<Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" />}
            >
              <CalculatorIcon data-icon="inline-start" />
              View calculation and sources
              <ChevronDownIcon
                data-icon="inline-end"
                className={cn('transition-transform', open && 'rotate-180')}
              />
            </CollapsibleTrigger>
            <AssistLabel>Evidence, not AI-drafted</AssistLabel>
          </div>

          <CollapsibleContent>
            <div className="border-t bg-surface px-6 py-5">
              <p className="mb-4 text-xs text-muted-foreground">
                Every line below traces to a source-system record — see insight_evidence.
              </p>
              <ol className="flex flex-col divide-y rounded-md border bg-card">
                {insight.evidence.map((row, i) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[28px_1fr] items-start gap-4 px-4 py-3 text-sm"
                  >
                    <span className="tabular pt-px text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex flex-col gap-1">
                      <span>{row.description}</span>
                      <SourceCitation source={sourceTableToSystem(row.source_table)} compact />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </section>
  )
}

function sourceTableToSystem(table: string): import('@/lib/data').SourceSystem {
  const map: Record<string, import('@/lib/data').SourceSystem> = {
    holdings: 'Holdings',
    credit_facilities: 'Credit Facility',
    credit_facility_snapshots: 'Credit Facility',
    mandate_allocations: 'Mandate',
    portfolios: 'Mandate',
    planned_cash_needs: 'CRM',
    rm_notes: 'RM Note',
  }
  return map[table] ?? 'Advice Ledger'
}
