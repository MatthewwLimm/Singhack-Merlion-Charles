import { notFound } from 'next/navigation'
import { ClientHeader } from '@/components/continuum/client-header'
import { InsightPanel } from '@/components/continuum/insight-panel'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OverviewTab } from '@/components/continuum/client-tabs/overview-tab'
import { PortfolioTab } from '@/components/continuum/client-tabs/portfolio-tab'

import { FamilyTab } from '@/components/continuum/client-tabs/family-tab'
import { AdviceHistoryTab } from '@/components/continuum/client-tabs/advice-history-tab'
import { RmNotesPanel } from '@/components/continuum/rm-notes-panel'
import { ScenarioBanner } from '@/components/continuum/scenario-banner'
import { getClient360 } from '@/services/client360'
import { getEventsForRecommendations } from '@/services/recommendations'
import { classifyPriority } from '@/services/cockpit'
import { getDemoScenario, getScenarioEvents } from '@/services/scenarios'
import { formatMoney } from '@/lib/format'
import type { RecommendationWithEvents } from '@/components/continuum/advice-timeline'

export const dynamic = 'force-dynamic'

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scenario?: string }>
}) {
  const { id } = await params
  const { scenario: scenarioCode } = await searchParams

  let data: Awaited<ReturnType<typeof getClient360>>
  try {
    data = await getClient360(id)
  } catch (err) {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-6 lg:px-8">
        <div className="rounded-md border border-signal-critical/30 bg-signal-critical-muted px-4 py-3 text-sm text-signal-critical">
          Could not load this client: {err instanceof Error ? err.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  if (!data) notFound()

  const {
    client,
    portfolios,
    holdings,
    mandate,
    mandateAllocations,
    creditFacilities,
    commitments,
    plannedCashNeeds,
    rmNotes,
    insights,
    recommendations,
  } = data

  const eventsByRecommendation = await getEventsForRecommendations(recommendations.map((r) => r.id))
  const adviceItems: RecommendationWithEvents[] = recommendations.map((recommendation) => ({
    recommendation,
    events: eventsByRecommendation[recommendation.id] ?? [],
  }))

  const openInsights = insights.filter((i) => i.status === 'OPEN')
  const severityRank: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
  const primaryInsight = [...openInsights].sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0] ?? null
  const priority = classifyPriority(primaryInsight?.severity ?? null, recommendations.some((r) => ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'DEFERRED'].includes(r.status))) ?? 'REVIEW'

  const primaryFacility = primaryInsight?.insight_type === 'CREDIT_RISK' ? creditFacilities[0] ?? null : null

  const activeRecommendation =
    recommendations.find((r) => r.status === 'DEFERRED') ??
    recommendations.find((r) => ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'SENT'].includes(r.status)) ??
    recommendations[0] ??
    null
  const activeRecommendationEvidence = activeRecommendation?.insight_id
    ? insights.find((i) => i.id === activeRecommendation.insight_id)?.evidence ?? []
    : []

  const collateralPortfolioIds = new Set(creditFacilities.map((f) => f.collateral_portfolio_id))
  const lastContact = rmNotes.length ? [...rmNotes].sort((a, b) => b.note_date.localeCompare(a.note_date))[0].note_date : null

  const scenario = scenarioCode ? await getDemoScenario(scenarioCode) : null
  const scenarioEvents = scenario ? await getScenarioEvents(scenario.id) : []

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:px-8">
      {scenario ? <ScenarioBanner scenario={scenario} hypotheticalEvents={scenarioEvents} /> : null}

      <ClientHeader
        name={client.client_name}
        domicile={client.country_of_residence ?? client.tax_domicile ?? '—'}
        mandate={mandate?.mandate_name ?? client.risk_profile ?? '—'}
        since={portfolios[0]?.inception_date ? new Date(portfolios[0].inception_date).getFullYear().toString() : undefined}
        relationshipValue={formatMoney(client.total_aum_usd, client.base_currency)}
        segment={client.wealth_band ?? '—'}
        lastContact={lastContact ? new Date(lastContact).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        priority={priority}
      />

      <InsightPanel insight={primaryInsight} creditFacility={primaryFacility} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="notes">RM Notes</TabsTrigger>
          <TabsTrigger value="planning">Life & Planning</TabsTrigger>
          <TabsTrigger value="advice">Advice History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-5">
          <OverviewTab
            clientId={client.client_id}
            clientName={client.client_name}
            insights={openInsights}
            objectives={client.objectives}
            recommendation={activeRecommendation}
            evidence={activeRecommendationEvidence}
          />
        </TabsContent>
        <TabsContent value="portfolio" className="pt-5">
          <PortfolioTab
            portfolios={portfolios}
            holdings={holdings}
            mandateAllocations={mandateAllocations}
            collateralPortfolioIds={collateralPortfolioIds}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-5">
          <RmNotesPanel clientId={client.client_id} notes={rmNotes} />
        </TabsContent>
        <TabsContent value="planning" className="pt-5">
          <FamilyTab plannedCashNeeds={plannedCashNeeds} commitments={commitments} />
        </TabsContent>
        <TabsContent value="advice" className="pt-5">
          <AdviceHistoryTab items={adviceItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}