/**
 * Minimal SVG line chart for LTV over time with threshold reference lines.
 * Intentionally undecorated: no gradients, no area fill.
 */
export function LtvProgression({
  data,
  warning,
  liquidation,
  min = 55,
  max = 72,
}: {
  data: { date: string; ltv: number }[]
  warning: number
  liquidation: number
  min?: number
  max?: number
}) {
  const w = 600
  const h = 160
  const padL = 36
  const padR = 12
  const padT = 10
  const padB = 22
  const innerW = w - padL - padR
  const innerH = h - padT - padB

  const x = (i: number) => padL + (i / (data.length - 1)) * innerW
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * innerH

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.ltv).toFixed(1)}`).join(' ')
  const last = data[data.length - 1]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-40 w-full"
      role="img"
      aria-label={`LTV progression from ${data[0].ltv}% to ${last.ltv}%`}
    >
      {/* gridlines */}
      {[60, 65, 70].map((g) => (
        <g key={g}>
          <line x1={padL} x2={w - padR} y1={y(g)} y2={y(g)} className="stroke-border" strokeWidth={1} />
          <text x={padL - 6} y={y(g) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">
            {g}%
          </text>
        </g>
      ))}
      {/* thresholds */}
      <line
        x1={padL}
        x2={w - padR}
        y1={y(warning)}
        y2={y(warning)}
        className="stroke-signal-warning"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={padL}
        x2={w - padR}
        y1={y(liquidation)}
        y2={y(liquidation)}
        className="stroke-signal-critical"
        strokeWidth={1.25}
        strokeDasharray="4 3"
      />
      <text x={w - padR} y={y(liquidation) - 4} textAnchor="end" className="fill-signal-critical font-mono text-[10px]">
        Liquidation trigger
      </text>
      <text x={w - padR} y={y(warning) - 4} textAnchor="end" className="fill-signal-warning font-mono text-[10px]">
        Warning
      </text>

      {/* line */}
      <path d={path} fill="none" className="stroke-primary" strokeWidth={1.75} strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle
          key={d.date}
          cx={x(i)}
          cy={y(d.ltv)}
          r={i === data.length - 1 ? 3.5 : 2.25}
          className={i === data.length - 1 ? 'fill-signal-critical' : 'fill-primary'}
        />
      ))}
      {/* x labels */}
      {data.map((d, i) => (
        <text
          key={d.date}
          x={x(i)}
          y={h - 6}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {d.date}
        </text>
      ))}
      {/* last value label */}
      <text
        x={x(data.length - 1) - 8}
        y={y(last.ltv) - 8}
        textAnchor="end"
        className="fill-foreground font-mono text-[11px] font-medium"
      >
        {last.ltv.toFixed(2)}%
      </text>
    </svg>
  )
}
