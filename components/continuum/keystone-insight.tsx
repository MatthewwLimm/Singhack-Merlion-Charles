'use client'

import * as React from 'react'
import { ChevronDownIcon, NetworkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AssistLabel, SystemLabel } from './source-citation'
import type { InsightWithEvidence } from '@/services/insights'

const shades = ['bg-primary', 'bg-primary/75', 'bg-primary/50', 'bg-primary/30', 'bg-primary/20']

export function KeystoneInsight({ insight }: { insight: InsightWithEvidence | null }) {
  const [open, setOpen] = React.useState(false)

  if (!insight) {
    return (
      <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
        No concentration signal currently open for this client — holdings are diversified within the {' '}
        {35}% region-concentration threshold used by the rules engine.
      </section>
    )
  }

  return (
    <section aria-labelledby="keystone-heading" className="rounded-lg border bg-card">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <NetworkIcon className="size-4 text-muted-foreground" />
            <h3 id="keystone-heading" className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Keystone insight · Concentration
            </h3>
          </div>
          <SystemLabel>Rules-generated</SystemLabel>
        </div>

        <p className="font-serif text-lg leading-snug text-pretty">{insight.summary}</p>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between border-t px-5 py-2.5">
          <CollapsibleTrigger render={<Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" />}>
            Show working
            <ChevronDownIcon data-icon="inline-end" className={cn('transition-transform', open && 'rotate-180')} />
          </CollapsibleTrigger>
          <AssistLabel>Traced to holdings</AssistLabel>
        </div>
        <CollapsibleContent>
          <div className="border-t bg-surface p-5">
            <p className="mb-3 text-xs text-muted-foreground">
              Every contributing position below is a real holding as of the latest snapshot.
            </p>
            <ul className="flex flex-col divide-y rounded-md border bg-card">
              {insight.evidence.map((e, i) => (
                <li key={e.id} className="grid grid-cols-[24px_1fr] items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={cn('size-2.5 shrink-0 rounded-sm', shades[i % shades.length])} />
                  <span>{e.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
