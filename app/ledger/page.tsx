import { LedgerClient } from './ledger-client'
import { listRecommendations, getEventsForRecommendations } from '@/services/recommendations'
import { PageHeader } from '@/components/continuum/page-header'
import type { LedgerRow } from '@/lib/data'
import { toAdviceStatus, toCategoryLabel, eventLabel, formatDate } from '@/lib/recommendation-display'

export const dynamic = 'force-dynamic'

export default async function AdviceLedgerPage() {
  let rows: LedgerRow[] = []
  let loadError: string | null = null

  try {
    const recommendations = await listRecommendations()
    const eventsByRec = await getEventsForRecommendations(recommendations.map((r) => r.id))

    rows = recommendations.map((r) => {
      const events = eventsByRec[r.id] ?? []
      const latest = events.at(-1)
      const status = toAdviceStatus(r.status, latest?.event_type)
      return {
        id: r.id,
        clientId: r.client_id,
        client: r.client_name,
        recommendation: r.title,
        category: toCategoryLabel(r.insight_type),
        created: formatDate(r.created_at),
        status,
        nextReview: '—',
        reviewTrigger: r.rationale ?? '—',
        lastAction: latest ? `${eventLabel(latest.event_type)} · ${formatDate(latest.created_at)}` : '—',
        highlighted: status === 'Resurfaced',
        lifecycle: events.map((e) => ({
          date: formatDate(e.created_at),
          event: eventLabel(e.event_type),
          status: toAdviceStatus(r.status, e.event_type),
          note: e.notes ?? undefined,
        })),
      }
    })
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load the advice ledger.'
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      <PageHeader title="Advice Ledger" subtitle="Recommendations should not disappear after one conversation." />

      {loadError ? (
        <div className="rounded-md border border-signal-critical/30 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
          Could not load the advice ledger: {loadError}
        </div>
      ) : (
        <LedgerClient rows={rows} />
      )}
    </div>
  )
}
