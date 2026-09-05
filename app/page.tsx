import { 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react'
import { PriorityClientCard } from '@/components/continuum/priority-client-card'
import { PageHeader } from '@/components/continuum/page-header'
import { cn } from '@/lib/utils'
import type { PriorityClient } from '@/lib/data'
import { toAdviceStatus } from '@/lib/recommendation-display'
import { getCockpitClients } from '@/services/cockpit'
import { listRecommendations } from '@/services/recommendations'

export const dynamic = 'force-dynamic'

export default async function MorningCockpitPage() {
  let cockpitClients: Awaited<ReturnType<typeof getCockpitClients>> = []
  let recommendations: Awaited<ReturnType<typeof listRecommendations>> = []
  let loadError: string | null = null

  try {
    ;[cockpitClients, recommendations] = await Promise.all([getCockpitClients(), listRecommendations()])
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load the Morning Cockpit.'
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-6 lg:px-8">
        <PageHeader title="Morning Cockpit" />
        <div className="rounded-lg border border-signal-critical/30 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
          Could not load cockpit data: {loadError}
        </div>
      </div>
    )
  }

  const priorityClients: PriorityClient[] = cockpitClients.map((c) => ({
    id: c.client.client_id,
    name: c.client.client_name,
    priority: c.priority,
    reason: c.reason,
    evidence: c.evidence,
    exposure: { label: c.exposureLabel, value: c.exposureValue },
    previousAdvice: c.previousAdvice
      ? { status: toAdviceStatus(c.previousAdvice.status), date: c.previousAdvice.date, summary: c.previousAdvice.summary }
      : undefined,
    nextAction: c.nextAction,
    domicile: c.client.country_of_residence ?? c.client.tax_domicile ?? '—',
  }))

  const counts = {
    'ACTION REQUIRED': cockpitClients.filter((c) => c.priority === 'ACTION REQUIRED').length,
    'RM CHECK-IN': cockpitClients.filter((c) => c.priority === 'RM CHECK-IN').length,
    'FOLLOW-UP': cockpitClients.filter((c) => c.priority === 'FOLLOW-UP').length,
    REVIEW: cockpitClients.filter((c) => c.priority === 'REVIEW').length,
  }

  const summary = [
    { 
      label: 'Action Required', 
      value: counts['ACTION REQUIRED'], 
      tone: 'critical' as const,
      icon: AlertTriangle,
      borderColor: 'border-l-red-500',
      badgeBg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    },
    { 
      label: 'RM Check-in', 
      value: counts['RM CHECK-IN'], 
      tone: 'warning' as const,
      icon: UserCheck,
      borderColor: 'border-l-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    },
    { 
      label: 'Follow-ups', 
      value: counts['FOLLOW-UP'], 
      tone: 'default' as const,
      icon: Clock,
      borderColor: 'border-l-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    },
    { 
      label: 'For Review', 
      value: counts.REVIEW, 
      tone: 'default' as const,
      icon: CheckCircle2,
      borderColor: 'border-l-slate-400',
      badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  ]

  const timeSensitive = cockpitClients.filter((c) => c.priority === 'ACTION REQUIRED').length
  const rmName = cockpitClients[0]?.client.rm_name?.split(' ')[0] ?? 'there'
  const totalClients = cockpitClients.length || 1

  // Dynamic status distribution calculation for visual progress bar
  const actionPct = ((counts['ACTION REQUIRED'] / totalClients) * 100).toFixed(0)
  const checkInPct = ((counts['RM CHECK-IN'] / totalClients) * 100).toFixed(0)
  const followUpPct = ((counts['FOLLOW-UP'] / totalClients) * 100).toFixed(0)
  const reviewPct = (100 - Number(actionPct) - Number(checkInPct) - Number(followUpPct)).toFixed(0)

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="Morning Cockpit · Saturday, 5 September 2026"
        title={`Good morning, ${rmName}`}
        subtitle={
          cockpitClients.length
            ? `${cockpitClients.length} client${cockpitClients.length === 1 ? '' : 's'} require attention today. ${timeSensitive} ${timeSensitive === 1 ? 'is' : 'are'} time-sensitive.`
            : 'No clients currently require attention.'
        }
      />

      {/* Visual Executive KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summary.map((s) => {
          const IconComponent = s.icon
          return (
            <div
              key={s.label}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md border-l-4',
                s.borderColor
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <div className={cn('rounded-md p-1.5', s.badgeBg)}>
                  <IconComponent className="size-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span
                  className={cn(
                    'text-3xl font-extrabold tracking-tight',
                    s.tone === 'critical' && 'text-red-600 dark:text-red-400',
                    s.tone === 'warning' && 'text-amber-600 dark:text-amber-400',
                    s.tone === 'default' && 'text-foreground'
                  )}
                >
                  {s.value}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {((s.value / totalClients) * 100).toFixed(0)}% of feed
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Visual Portfolio Risk Distribution Summary Strip */}
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <ShieldAlert className="size-4 text-muted-foreground" />
            <span>Client Portfolio Health Breakdown</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Action Required ({counts['ACTION REQUIRED']})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> Check-in ({counts['RM CHECK-IN']})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" /> Follow-up ({counts['FOLLOW-UP']})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300" /> Review ({counts.REVIEW})</span>
          </div>
        </div>

        {/* Multi-segment distribution bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div style={{ width: `${actionPct}%` }} className="bg-red-500 transition-all duration-500" />
          <div style={{ width: `${checkInPct}%` }} className="bg-amber-500 transition-all duration-500" />
          <div style={{ width: `${followUpPct}%` }} className="bg-blue-500 transition-all duration-500" />
          <div style={{ width: `${reviewPct}%` }} className="bg-slate-300 dark:bg-slate-600 transition-all duration-500" />
        </div>
      </div>

      {/* Full-width Priority Client Feed */}
      <section aria-labelledby="feed-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <h2 id="feed-heading" className="text-xs font-bold uppercase tracking-wider text-foreground">
              Priority Client Feed
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Ranked by deterministic risk signals & deferred advice
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {priorityClients.length ? (
            priorityClients.map((client, i) => (
              <PriorityClientCard key={client.id} client={client} rank={i + 1} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-12 text-center shadow-sm">
              <Sparkles className="mb-2 size-8 text-emerald-500" />
              <p className="text-base font-semibold text-foreground">All Client Portfolios are Healthy</p>
              <p className="text-xs text-muted-foreground max-w-md mt-1">
                Every client is currently within mandate, credit, and liquidity tolerances. No open risk signals right now.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}