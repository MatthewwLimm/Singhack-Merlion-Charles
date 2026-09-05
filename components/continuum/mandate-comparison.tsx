import { cn } from '@/lib/utils'

interface Row {
  asset: string
  pct: number
  value?: string
  target: string // e.g. "40–55%"
}

function parseRange(target: string): [number, number] {
  const m = target.match(/(\d+)\D+(\d+)/)
  return m ? [Number(m[1]), Number(m[2])] : [0, 100]
}

/**
 * MandateComparison: current allocation bars against permitted mandate ranges.
 * Out-of-range allocations are flagged without decoration.
 */
export function MandateComparison({ rows, max = 100 }: { rows: Row[]; max?: number }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const [lo, hi] = parseRange(r.target)
        const out = r.pct < lo || r.pct > hi
        return (
          <li key={r.asset} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{r.asset}</span>
              <span className="tabular flex items-center gap-2">
                <span className={cn('font-medium', out && 'text-signal-critical')}>{r.pct}%</span>
                <span className="text-xs text-muted-foreground">target {r.target}</span>
                {out ? (
                  <span className="rounded-sm bg-signal-critical-muted px-1.5 text-[10px] font-semibold tracking-wide text-signal-critical uppercase">
                    Outside
                  </span>
                ) : null}
              </span>
            </div>
            <div className="relative h-2.5 rounded-sm bg-muted">
              <div
                className="absolute inset-y-0 rounded-sm bg-primary/12 ring-1 ring-inset ring-primary/20"
                style={{ left: `${(lo / max) * 100}%`, width: `${((hi - lo) / max) * 100}%` }}
                aria-hidden
              />
              <div
                className={cn('absolute inset-y-0.5 left-0 rounded-sm', out ? 'bg-signal-critical' : 'bg-primary')}
                style={{ width: `${(r.pct / max) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
