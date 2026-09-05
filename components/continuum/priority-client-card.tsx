import Link from 'next/link'
import { ArrowRightIcon, HistoryIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PriorityClient } from '@/lib/data'
import { PriorityBadge } from './priority-badge'
import { EvidenceChip } from './evidence-chip'
import { AdviceStatusBadge } from './advice-status-badge'

export function PriorityClientCard({ client, rank }: { client: PriorityClient; rank: number }) {
  const critical = client.priority === 'ACTION REQUIRED'
  const href = client.id === 'lau-chi-ming' ? `/clients/${client.id}` : `/clients/${client.id}`

  return (
    <article
      className={cn(
        'group relative grid grid-cols-[auto_1fr] gap-x-4 rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm',
        critical && 'border-signal-critical/25',
      )}
    >
      <div className="flex flex-col items-center pt-0.5">
        <span className="tabular text-[11px] font-medium text-muted-foreground">{String(rank).padStart(2, '0')}</span>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-base font-semibold tracking-tight">
                <Link href={href} className="hover:underline underline-offset-4">
                  {client.name}
                </Link>
              </h3>
              <PriorityBadge priority={client.priority} size="sm" />
              <span className="text-xs text-muted-foreground">{client.domicile}</span>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-foreground/90">{client.reason}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{client.exposure.label}</p>
            <p className="tabular text-lg font-medium tracking-tight">{client.exposure.value}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {client.evidence.map((e, i) => (
            <EvidenceChip
              key={e.label}
              evidence={e}
              tone={critical && i === 0 ? 'critical' : 'default'}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Next action</span>
              <span className="font-medium">{client.nextAction}</span>
            </div>
            {client.previousAdvice ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <HistoryIcon className="size-3.5" />
                <span>
                  Previous advice{' '}
                  <span className="text-foreground">“{client.previousAdvice.summary}”</span> ·{' '}
                  {client.previousAdvice.date}
                </span>
                <AdviceStatusBadge status={client.previousAdvice.status} size="sm" />
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="tabular rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Avg. handling time: {client.avgHandlingTime}
            </span>
            <Button
              variant={critical ? 'default' : 'outline'}
              size="lg"
              render={<Link href={href} />}
              nativeButton={false}
            >
              Review Client
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
