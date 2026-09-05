import { cn } from '@/lib/utils'
import type { Priority } from '@/lib/data'

const styles: Record<Priority, string> = {
  'ACTION REQUIRED': 'bg-signal-critical text-signal-critical-foreground border-transparent',
  'RM CHECK-IN': 'bg-signal-warning-muted text-signal-warning-foreground border-signal-warning/40',
  'FOLLOW-UP': 'bg-secondary text-secondary-foreground border-border',
  REVIEW: 'bg-card text-muted-foreground border-border',
}

const dot: Record<Priority, string> = {
  'ACTION REQUIRED': 'bg-signal-critical-foreground',
  'RM CHECK-IN': 'bg-signal-warning',
  'FOLLOW-UP': 'bg-primary/60',
  REVIEW: 'bg-muted-foreground/60',
}

export function PriorityBadge({
  priority,
  size = 'default',
  className,
}: {
  priority: Priority
  size?: 'default' | 'sm'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm border font-semibold tracking-[0.08em] uppercase',
        size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-[11px]',
        styles[priority],
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', dot[priority])} />
      {priority}
    </span>
  )
}
