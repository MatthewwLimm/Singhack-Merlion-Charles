import {
  BookOpenIcon,
  CalendarIcon,
  ContactIcon,
  FileCheckIcon,
  FileTextIcon,
  LandmarkIcon,
  LayersIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SourceSystem } from '@/lib/data'

const icons: Record<SourceSystem, React.ComponentType<{ className?: string }>> = {
  Holdings: LayersIcon,
  'Credit Facility': LandmarkIcon,
  Mandate: ScaleIcon,
  'RM Note': FileTextIcon,
  'Advice Ledger': BookOpenIcon,
  CRM: ContactIcon,
  Calendar: CalendarIcon,
  Valuations: FileCheckIcon,
  Suitability: ShieldCheckIcon,
}

/**
 * SourceCitation labels where a figure came from.
 * Deterministic system sources are rendered in neutral tones so they are
 * visually distinct from AI-drafted text (see AssistLabel).
 */
export function SourceCitation({
  source,
  asOf,
  className,
  compact,
}: {
  source: SourceSystem
  asOf?: string
  className?: string
  compact?: boolean
}) {
  const Icon = icons[source]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase',
        className,
      )}
      title={asOf ? `${source} · as of ${asOf}` : source}
    >
      <Icon className="size-3 shrink-0 opacity-70" />
      <span>{source}</span>
      {!compact && asOf ? <span className="normal-case opacity-70">· {asOf}</span> : null}
    </span>
  )
}

/** Marks text that was drafted by the assistant rather than computed by a system. */
export function AssistLabel({ className, children = 'AI-drafted' }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border border-assist/30 bg-assist-muted px-1.5 font-mono text-[10px] tracking-wide text-assist uppercase',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-assist" />
      {children}
    </span>
  )
}

/** Marks a figure as a deterministic system calculation. */
export function SystemLabel({ className, children = 'System calculated' }: { className?: string; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-sm border bg-muted px-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-sm bg-primary/70" />
      {children}
    </span>
  )
}
