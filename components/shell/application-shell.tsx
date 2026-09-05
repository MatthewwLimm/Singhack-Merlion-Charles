'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BellIcon,
  BookOpenIcon,
  DatabaseIcon,
  InboxIcon,
  SearchIcon,
  SettingsIcon,
  SunriseIcon,
  UsersIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DemoScenarioSelector } from './demo-scenario-selector'
import type { DemoScenario } from '@/services/scenarios'

function buildPrimaryNav(actionQueueCount: number) {
  return [
    { href: '/', label: 'Morning Cockpit', icon: SunriseIcon },
    { href: '/clients', label: 'Clients', icon: UsersIcon },
    { href: '/actions', label: 'Action Queue', icon: InboxIcon, badge: actionQueueCount || undefined },
    { href: '/ledger', label: 'Advice Ledger', icon: BookOpenIcon },
  ]
}

const secondaryNav = [
  { href: '/data-sources', label: 'Data Sources', icon: DatabaseIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-2 bottom-2 -left-3 w-0.5 rounded-r bg-sidebar-primary"
        />
      )}
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="tabular rounded-sm bg-sidebar-primary/15 px-1.5 py-px text-[11px] font-semibold text-sidebar-primary">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export function ApplicationShell({
  children,
  actionQueueCount = 0,
  scenarios = [],
}: {
  children: React.ReactNode
  actionQueueCount?: number
  scenarios?: DemoScenario[]
}) {
  const pathname = usePathname()
  const today = 'Saturday, 5 September 2026'
  const primaryNav = buildPrimaryNav(actionQueueCount)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Left navigation */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
          <span
            aria-hidden
            className="flex size-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground"
          >
            <span className="block size-2 rounded-full border-[1.5px] border-current" />
          </span>
          <span className="font-serif text-lg font-medium tracking-tight text-sidebar-primary">
            Continuum
          </span>
        </div>

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-3 pt-4">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/45 uppercase">
            Workbench
          </p>
          {primaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        <nav aria-label="Secondary" className="flex flex-col gap-0.5 border-t border-sidebar-border px-3 py-3">
          {secondaryNav.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-3">
          <p className="text-[10px] text-sidebar-foreground/45">
            RM Workbench · Asia Pacific Desk
          </p>
          <p className="text-[10px] text-sidebar-foreground/45">Build 2026.09 · Internal use</p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="font-serif text-lg font-medium tracking-tight lg:hidden">Continuum</span>

          <div className="relative hidden w-72 md:block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients"
              aria-label="Search clients"
              className="h-8 bg-card pl-8 text-[13px]"
            />
          </div>

          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <DemoScenarioSelector scenarios={scenarios} />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal-positive/60 [animation-duration:2.4s]" />
                <span className="relative inline-flex size-2 rounded-full bg-signal-positive" />
              </span>
              Portfolio monitoring active
            </div>

            <time
              dateTime="2026-09-05"
              className="hidden text-xs text-muted-foreground md:block"
            >
              {today}
            </time>

            <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
              <BellIcon />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-signal-critical" />
            </Button>

            <div className="flex items-center gap-2.5 border-l pl-4">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-[11px] font-medium text-primary-foreground">
                  PO
                </AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight md:block">
                <p className="text-[13px] font-medium">Priscilla Ong</p>
                <p className="text-[11px] text-muted-foreground">Senior Relationship Manager</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
