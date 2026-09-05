'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export interface AllocationItem {
  name: string
  value: number
}

function getAssetColor(label: string): string {
  const name = label.toLowerCase()
  if (name.includes('equity') || name.includes('eq')) return '#3b82f6'       // Blue
  if (name.includes('fixed') || name.includes('bond')) return '#a855f7'     // Purple
  if (name.includes('alt')) return '#f97316'                                // Orange
  if (name.includes('cash')) return '#06b6d4'                               // Cyan
  if (name.includes('commodity') || name.includes('real')) return '#22c55e' // Green
  return '#64748b'                                                          // Slate
}

interface PortfolioGaugeProps {
  title: string
  data: AllocationItem[]
}

export function PortfolioGauge({ title, data }: PortfolioGaugeProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map((item) => ({
    ...item,
    color: getAssetColor(item.name),
  }))

  const topAsset = [...chartData].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <div className="relative h-56 w-full max-w-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as AllocationItem & { color: string }
                  return (
                    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md">
                      {item.name}: <span className="font-bold">{item.value}%</span>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Donut Text */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {topAsset?.value}%
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {topAsset?.name}
          </p>
        </div>
      </div>
    </div>
  )
}