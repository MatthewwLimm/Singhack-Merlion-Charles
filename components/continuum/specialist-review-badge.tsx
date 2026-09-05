import { UserCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SpecialistReviewBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/8 px-2 py-1 text-xs font-medium text-primary',
        className,
      )}
    >
      <UserCheckIcon className="size-3.5" />
      {label}
    </span>
  )
}
