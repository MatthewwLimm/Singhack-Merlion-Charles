import { cn } from '@/lib/utils'
import type { SourceSystem } from '@/lib/data'
import { SourceCitation } from './source-citation'

export function MetricCard({
  label,
  value,
  source,
  asOf,
  hint,
  tone = 'default',
  className,
  size = 'default',
}: {
  label: string
  value: string
  source?: SourceSystem
  asOf?: string
  hint?: string
  tone?: 'default' | 'critical' | 'warning' | 'positive'
  className?: string
  size?: 'default' | 'lg'
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md border bg-card p-3.5',
        tone === 'critical' && 'border-signal-critical/30',
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          'tabular font-medium tracking-tight',
          size === 'lg' ? 'text-2xl' : 'text-xl',
          tone === 'critical' && 'text-signal-critical',
          tone === 'warning' && 'text-signal-warning-foreground',
          tone === 'positive' && 'text-signal-positive',
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {source ? <SourceCitation source={source} asOf={asOf} className="mt-1" /> : null}
    </div>
  )
}
