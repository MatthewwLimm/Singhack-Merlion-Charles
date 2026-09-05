import { listRecommendations } from '@/services/recommendations'
import { toActionStatus } from '@/lib/recommendation-display'
import { PageHeader } from '@/components/continuum/page-header'
import { ActionQueueCard } from '@/components/continuum/action-queue-card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ActionStatus } from '@/lib/data'

export const dynamic = 'force-dynamic'

const tabs: { value: string; label: string; statuses: ActionStatus[] }[] = [
  { value: 'awaiting', label: 'Awaiting Review', statuses: ['Awaiting Review'] },
  { value: 'approved', label: 'Approved', statuses: ['Approved'] },
  { value: 'deferred', label: 'Deferred', statuses: ['Deferred'] },
  { value: 'completed', label: 'Completed', statuses: ['Completed', 'Rejected'] },
]

export default async function ActionQueuePage() {
  let items: Awaited<ReturnType<typeof listRecommendations>> = []
  let loadError: string | null = null

  try {
    items = await listRecommendations()
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load the action queue.'
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      <PageHeader
        title="Action Queue"
        subtitle="Review and approve proposed client actions before anything is sent or executed."
      />

      {loadError ? (
        <div className="rounded-md border border-signal-critical/30 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
          Could not load the action queue: {loadError}
        </div>
      ) : (
        <Tabs defaultValue="awaiting">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="tabular ml-1 text-muted-foreground">
                  {items.filter((i) => t.statuses.includes(toActionStatus(i.status))).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => {
            const filtered = items.filter((i) => t.statuses.includes(toActionStatus(i.status)))
            return (
              <TabsContent key={t.value} value={t.value} className="flex flex-col gap-3 pt-5">
                {filtered.length ? (
                  filtered.map((r) => <ActionQueueCard key={r.id} recommendation={r} />)
                ) : (
                  <p className="rounded-md border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                    No actions in this state.
                  </p>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}
