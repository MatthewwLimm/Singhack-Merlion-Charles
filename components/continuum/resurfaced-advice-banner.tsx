import { HistoryIcon } from 'lucide-react'

export function ResurfacedAdviceBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-signal-critical/25 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
      <HistoryIcon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
