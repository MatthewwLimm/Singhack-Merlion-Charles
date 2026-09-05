import { cn } from '@/lib/utils'
import type { Recommendation, RecommendationEvent } from '@/lib/supabase/types'
import { toAdviceStatus, eventLabel, formatDate, formatDateTime } from '@/lib/recommendation-display'
import { AdviceStatusBadge } from './advice-status-badge'

export interface RecommendationWithEvents {
  recommendation: Recommendation
  events: RecommendationEvent[]
}

/** One card per recommendation, each showing its own event lifecycle inline. */
export function AdviceTimeline({ items }: { items: RecommendationWithEvents[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map(({ recommendation: r, events }) => {
        const latestEvent = events.at(-1)
        const status = toAdviceStatus(r.status, latestEvent?.event_type)
        return (
          <li
            key={r.id}
            className={cn(
              'flex flex-col gap-3 rounded-lg border bg-card p-4',
              status === 'Resurfaced' && 'border-signal-critical/30',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{r.title}</p>
                <p className="text-sm font-medium text-pretty">{r.recommendation}</p>
              </div>
              <div className="flex items-center gap-2">
                <AdviceStatusBadge status={status} size="sm" />
                <span className="tabular text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
            </div>

            {r.rationale ? <p className="text-xs leading-relaxed text-muted-foreground">{r.rationale}</p> : null}

            {events.length ? (
              <ol className="flex flex-col border-t pt-3">
                {events.map((e, i) => (
                  <li key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={cn('mt-1 size-2 shrink-0 rounded-full', i === events.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40')} />
                      {i < events.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className={cn('flex flex-col gap-0.5 pb-3', i === events.length - 1 && 'pb-0')}>
                      <div className="flex items-center gap-2">
                        <time className="tabular text-xs font-medium text-muted-foreground">{formatDateTime(e.created_at)}</time>
                        {e.created_by ? <span className="text-xs text-muted-foreground">· {e.created_by}</span> : null}
                      </div>
                      <p className="text-xs text-foreground/90">{eventLabel(e.event_type)}</p>
                      {e.notes ? <p className="text-xs text-muted-foreground italic">{e.notes}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
