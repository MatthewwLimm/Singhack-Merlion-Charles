import { cn } from '@/lib/utils'

/**
 * Restrained horizontal visual for LTV against warning and liquidation thresholds.
 * Scale is fixed 50–75% so the proximity to the trigger is legible.
 */
export function LtvThresholdBar({
  current,
  warning,
  liquidation,
  min = 50,
  max = 75,
  className,
  showLabels = true,
}: {
  current: number
  warning: number
  liquidation: number
  min?: number
  max?: number
  className?: string
  showLabels?: boolean
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const headroom = (liquidation - current).toFixed(2)

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      {showLabels ? (
        <figcaption className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Loan-to-value against facility thresholds</span>
          <span className="tabular">
            Headroom to liquidation:{' '}
            <span className="font-medium text-signal-critical">{headroom} pp</span>
          </span>
        </figcaption>
      ) : null}

      <div className="relative h-9">
        {/* track */}
        <div className="absolute inset-x-0 top-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-primary/70"
            style={{ width: `${pct(current)}%` }}
          />
          {/* warning to liquidation band */}
          <div
            className="absolute inset-y-0 bg-signal-warning/25"
            style={{ left: `${pct(warning)}%`, width: `${pct(liquidation) - pct(warning)}%` }}
          />
          {/* beyond liquidation */}
          <div
            className="absolute inset-y-0 bg-signal-critical/20"
            style={{ left: `${pct(liquidation)}%`, right: 0 }}
          />
        </div>

        {/* warning marker */}
        <div
          className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${pct(warning)}%` }}
        >
          <span className="h-5 w-px bg-signal-warning" />
          <span className="tabular mt-0.5 text-[10px] text-muted-foreground">Warn {warning.toFixed(0)}%</span>
        </div>

        {/* liquidation marker */}
        <div
          className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${pct(liquidation)}%` }}
        >
          <span className="h-5 w-0.5 bg-signal-critical" />
          <span className="tabular mt-0.5 text-[10px] font-medium text-signal-critical">
            Trigger {liquidation.toFixed(0)}%
          </span>
        </div>

        {/* current marker */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${pct(current)}%` }}
        >
          <span className="tabular -mt-4 rounded-sm bg-primary px-1.5 py-px text-[10px] font-medium text-primary-foreground">
            {current.toFixed(2)}%
          </span>
          <span className="size-2 rotate-45 border border-card bg-primary" />
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground tabular">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </figure>
  )
}
