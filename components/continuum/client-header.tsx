import Link from 'next/link'
import { ChevronLeftIcon, FilePenLineIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PriorityBadge } from './priority-badge'
import type { Priority } from '@/lib/data'

export function ClientHeader({
  name,
  domicile,
  mandate,
  since,
  relationshipValue,
  segment,
  lastContact,
  priority,
}: {
  name: string
  domicile: string
  mandate: string
  since?: string
  relationshipValue: string
  segment: string
  lastContact: string
  priority: Priority
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-3.5" />
        Morning Cockpit
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-12 rounded-md">
            <AvatarFallback className="rounded-md bg-primary font-serif text-lg text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-serif text-3xl font-medium tracking-tight">{name}</h1>
            <dl className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <dt className="sr-only">Domicile</dt>
                <dd>{domicile}</dd>
              </div>
              <span aria-hidden>·</span>
              <div className="flex gap-1">
                <dt className="sr-only">Mandate</dt>
                <dd>{mandate}</dd>
              </div>
              {since ? (
                <>
                  <span aria-hidden>·</span>
                  <div className="flex gap-1">
                    <dt className="sr-only">Client since</dt>
                    <dd>Client since {since}</dd>
                  </div>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <div className="flex gap-1">
                <dt>Relationship value</dt>
                <dd className="tabular font-medium text-foreground">{relationshipValue}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              {segment} · Last contact {lastContact} · RM: Priscilla Ong
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PriorityBadge priority={priority} />
          <Button render={<Link href="/actions" />} nativeButton={false}>
            <FilePenLineIcon data-icon="inline-start" />
            Prepare Action
          </Button>
        </div>
      </div>
    </header>
  )
}
