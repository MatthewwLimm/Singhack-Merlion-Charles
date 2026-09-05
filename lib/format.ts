export function formatMoney(value: number | null | undefined, currency: string | null = 'USD'): string {
  if (value == null) return '—'
  const abs = Math.abs(value)
  const ccy = currency ?? 'USD'
  if (abs >= 1_000_000) return `${ccy} ${(value / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000) return `${ccy} ${(value / 1_000).toFixed(0)}k`
  return `${ccy} ${value.toLocaleString()}`
}

export function formatPct(value: number | null | undefined, digits = 2): string {
  if (value == null) return '—'
  return `${value.toFixed(digits)}%`
}
