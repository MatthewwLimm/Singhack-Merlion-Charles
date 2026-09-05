'use client'

import Link from 'next/link'
import type { LedgerRow } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { AdviceStatusBadge } from './advice-status-badge'
import { SourceCitation } from './source-citation'
import { ResurfacedAdviceBanner } from './resurfaced-advice-banner'

export function LedgerHistoryDrawer({
  row,
  open,
  onOpenChange,
}: {
  row: LedgerRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {row ? (
          <>
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle>{row.recommendation}</SheetTitle>
              <SheetDescription>
                <Link href={`/clients/${row.clientId}`} className="hover:underline underline-offset-4">
                  {row.client}
                </Link>{' '}
                · {row.category}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-5 py-5">
              {row.status === 'Resurfaced' ? (
                <ResurfacedAdviceBanner>
                  Previous advice resurfaced because its review condition has been met.
                </ResurfacedAdviceBanner>
              ) : null}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Status</p>
                  <AdviceStatusBadge status={row.status} size="sm" className="w-fit" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Next review</p>
                  <p className="font-medium">{row.nextReview}</p>
                </div>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Review trigger</p>
                  <p className="font-medium text-pretty">{row.reviewTrigger}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Recommendation lifecycle
                </h4>
                <ol className="flex flex-col">
                  {row.lifecycle.map((e, i) => (
                    <li key={`${e.date}-${e.event}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'mt-1.5 size-2 shrink-0 rounded-full',
                            i === row.lifecycle.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40',
                          )}
                        />
                        {i < row.lifecycle.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                      </div>
                      <div className={cn('flex flex-col gap-1 pb-5', i === row.lifecycle.length - 1 && 'pb-0')}>
                        <div className="flex items-center gap-2">
                          <time className="tabular text-xs font-medium text-muted-foreground">{e.date}</time>
                          <AdviceStatusBadge status={e.status} size="sm" />
                        </div>
                        <p className="text-sm text-pretty">{e.event}</p>
                        {e.note ? <p className="text-xs text-muted-foreground italic">{e.note}</p> : null}
                        {e.source ? <SourceCitation source={e.source} compact /> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
