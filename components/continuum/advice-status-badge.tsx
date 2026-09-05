import { cn } from '@/lib/utils'
import type { AdviceStatus } from '@/lib/data'

const styles: Record<AdviceStatus, string> = {
  Raised: 'bg-card text-foreground border-border',
  'Under Review': 'bg-primary/8 text-primary border-primary/25',
  Discussed: 'bg-secondary text-secondary-foreground border-border',
  Accepted: 'bg-signal-positive-muted text-signal-positive border-signal-positive/30',
  Deferred: 'bg-signal-warning-muted text-signal-warning-foreground border-signal-warning/40',
  Rejected: 'bg-muted text-muted-foreground border-border line-through decoration-muted-foreground/50',
  Resurfaced: 'bg-signal-critical-muted text-signal-critical border-signal-critical/30',
}

export function AdviceStatusBadge({
  status,
  size = 'default',
  className,
}: {
  status: AdviceStatus
  size?: 'default' | 'sm'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-5 px-1.5 text-[10px] tracking-wide uppercase' : 'h-6 px-2 text-xs',
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
