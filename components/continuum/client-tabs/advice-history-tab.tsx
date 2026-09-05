import { History } from 'lucide-react'
import { AdviceTimeline, type RecommendationWithEvents } from '../advice-timeline'
import { SourceCitation } from '../source-citation'

export function AdviceHistoryTab({ items }: { items: RecommendationWithEvents[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Advice timeline
        </h3>
        <SourceCitation source="Advice Ledger" compact />
      </div>
      {items.length ? (
        <AdviceTimeline items={items} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <History className="size-5 text-muted-foreground" />
          </div>
          <h4 className="mt-3 text-xs font-semibold text-foreground">No Advice History</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            No past recommendations or advice events have been recorded for this portfolio.
          </p>
        </div>
      )}
    </div>
  )
}