import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Evidence } from '@/lib/data'
import { SourceCitation } from './source-citation'

/**
 * EvidenceChip: a compact label/value pair.
 * Hovering reveals the source system and as-of timestamp so every figure is inspectable.
 */
export function EvidenceChip({
  evidence,
  tone = 'default',
  className,
}: {
  evidence: Evidence
  tone?: 'default' | 'critical' | 'warning'
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'inline-flex h-7 cursor-default items-center gap-1.5 rounded-md border bg-card px-2 text-xs',
              tone === 'critical' && 'border-signal-critical/30 bg-signal-critical-muted',
              tone === 'warning' && 'border-signal-warning/40 bg-signal-warning-muted',
              className,
            )}
          />
        }
      >
        <span className="text-muted-foreground">{evidence.label}</span>
        <span
          className={cn(
            'tabular font-medium text-foreground',
            tone === 'critical' && 'text-signal-critical',
          )}
        >
          {evidence.value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-col gap-1">
        <SourceCitation source={evidence.source} asOf={evidence.asOf} className="text-primary-foreground/80" />
        <span className="text-xs">
          {evidence.label}: <span className="tabular font-medium">{evidence.value}</span>
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
