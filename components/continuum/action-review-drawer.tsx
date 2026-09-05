'use client'

import * as React from 'react'
import {
  PenLineIcon,
  SparklesIcon,
  MessageSquareQuoteIcon,
  LightbulbIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SourceCitation } from './source-citation'
import { SpecialistReviewBadge } from './specialist-review-badge'
import {
  editRecommendationAction,
  transitionRecommendationAction,
} from '@/app/clients/[id]/recommendation-actions'
import type { RecommendationWithClient } from '@/services/recommendations'

function sourceTableToSystem(table: string): import('@/lib/data').SourceSystem {
  const map: Record<string, import('@/lib/data').SourceSystem> = {
    holdings: 'Holdings',
    credit_facilities: 'Credit Facility',
    credit_facility_snapshots: 'Credit Facility',
    mandate_allocations: 'Mandate',
    portfolios: 'Mandate',
    planned_cash_needs: 'CRM',
    rm_notes: 'RM Note',
  }
  return map[table] ?? 'Advice Ledger'
}

/**
 * Generates personalized talking points and strategy based on client data & recommendation type
 */
function getBehavioralGuidance(rec: RecommendationWithClient) {
  const firstName = rec.client_name?.split(' ')[0] ?? 'Client'
  const title = rec.title ?? ''
  const insightType = rec.insight_type ?? ''
  const rationale = rec.rationale ?? ''

  // 1. Liquidity & Cash Flow Gap
  if (
    insightType.toLowerCase().includes('credit') ||
    insightType.toLowerCase().includes('liquidity') ||
    title.toLowerCase().includes('short') ||
    title.toLowerCase().includes('cash')
  ) {
    return {
      script: `"Hi ${firstName}, looking ahead to your capital commitments, our projection shows ${title.toLowerCase()}. I'd like to share a few flexible options—such as a short-term credit line or minor yield reallocations—to bridge this smoothly without disrupting your core investments."`,
      strategy: `Frame as proactive liquidity architecture rather than a deficit. Highlight that acting early preserves long-term compounding assets.`,
    }
  }

  // 2. Portfolio Concentration & Over-exposure
  if (
    insightType.toLowerCase().includes('portfolio') ||
    title.toLowerCase().includes('concentrated') ||
    title.toLowerCase().includes('%') ||
    rationale.toLowerCase().includes('holdings sit in')
  ) {
    return {
      script: `"Hi ${firstName}, during our asset review, we noticed a significant concentration (${title}). To protect recent gains and mitigate downside volatility, we've drafted a balanced rebalancing strategy to diversify into complementary exposures."`,
      strategy: `Focus on risk-adjusted returns and locking in gains. Avoid criticizing past asset performance; position rebalancing as an opportunity for strategic defense.`,
    }
  }

  // 3. Fallback / General Recommendation
  return {
    script: `"Hi ${firstName}, following up on our recent portfolio monitoring regarding ${title}, we've prepared a brief action plan on ${rec.recommendation.toLowerCase()}. Let's schedule a brief call to align on how this fits your broader wealth goals."`,
    strategy: `Maintain a high-touch advisory tone. Emphasize client choice and tailored alignment with their broader family office or personal mandate.`,
  }
}

interface ActionReviewDrawerProps {
  recommendation: RecommendationWithClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActionReviewDrawer({
  recommendation,
  open,
  onOpenChange,
}: ActionReviewDrawerProps) {
  const [pending, startTransition] = React.useTransition()
  const [editing, setEditing] = React.useState(false)
  const [message, setMessage] = React.useState(recommendation?.recommendation ?? '')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (recommendation) {
      setMessage(recommendation.recommendation)
    }
  }, [recommendation])

  if (!recommendation) return null

  const guidance = getBehavioralGuidance(recommendation)
  const evidenceList = recommendation.evidence ?? []

  function handleSaveEdit() {
    setError(null)
    startTransition(async () => {
      try {
        await editRecommendationAction(
          recommendation!.client_id,
          recommendation!.id,
          message
        )
        setEditing(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save edit.')
      }
    })
  }

  function handleTransition(
    eventType: 'RM_APPROVED' | 'CLIENT_DEFERRED' | 'CLIENT_REJECTED'
  ) {
    setError(null)
    startTransition(async () => {
      try {
        await transitionRecommendationAction(
          recommendation!.client_id,
          recommendation!.id,
          eventType
        )
        onOpenChange(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update action.')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col justify-between overflow-y-auto sm:max-w-[540px] p-0">
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-semibold text-foreground">
              {recommendation.title}
            </SheetTitle>
            <SheetDescription className="text-sm font-medium text-muted-foreground">
              {recommendation.client_name}
            </SheetDescription>
          </SheetHeader>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Recommended Action Box */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended Action
              </span>
              <span className="rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                Drafted, RM-Editable
              </span>
            </div>

            {editing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="text-sm leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={pending}>
                    Save Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-base font-medium leading-normal text-foreground">
                  {message}
                </p>
              </div>
            )}

            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="self-start gap-1.5 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                <PenLineIcon className="h-3.5 w-3.5" />
                Edit message
              </Button>
            )}
          </div>

          {/* Personalised Behavioral Agent Guidance */}
          <div className="flex flex-col gap-3 rounded-lg border border-indigo-200/60 bg-gradient-to-b from-indigo-50/50 to-transparent p-4 dark:border-indigo-900/50 dark:from-indigo-950/20">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300">
              <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Behavioral Agent Guidance
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-foreground/90">
              <div className="flex items-start gap-2">
                <MessageSquareQuoteIcon className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">
                    Suggested Client Script:
                  </span>
                  <p className="mt-1 italic leading-relaxed text-muted-foreground">
                    {guidance.script}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                <LightbulbIcon className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground font-medium">
                    Communication Strategy:
                  </strong>{' '}
                  {guidance.strategy}
                </p>
              </div>
            </div>
          </div>

          {/* Rationale / Why This Is Recommended */}
          {recommendation.rationale && (
            <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/20 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Why this is recommended
              </span>
              <p className="text-xs leading-relaxed text-foreground/90">
                {recommendation.rationale}
              </p>
            </div>
          )}

          {/* Supporting Evidence List */}
          {evidenceList.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-lg border bg-muted/20 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Supporting Evidence
              </span>
              <ul className="flex flex-col gap-2 divide-y divide-border/50">
                {evidenceList.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 pt-2 first:pt-0 text-xs"
                  >
                    <span className="font-medium text-foreground/90">
                      {e.description}
                    </span>
                    <SourceCitation
                      source={sourceTableToSystem(e.source_table)}
                      compact
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specialist Review Priority Badge */}
          {(recommendation.priority === 'Urgent' ||
            recommendation.priority === 'High') && (
            <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2.5">
              <SpecialistReviewBadge
                label={`${recommendation.priority} priority — specialist review recommended`}
              />
            </div>
          )}

          {/* Disclaimer Note */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Approving here does not send anything automatically. It records an RM
            decision on this recommendation; client communication and execution
            happen outside this system.
          </p>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between gap-2 border-t bg-card p-4">
          <Button
            onClick={() => handleTransition('RM_APPROVED')}
            disabled={pending}
            className="flex-1 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing((v) => !v)}
            disabled={pending}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => handleTransition('CLIENT_DEFERRED')}
            disabled={pending}
          >
            Defer
          </Button>
          <Button
            variant="outline"
            onClick={() => handleTransition('CLIENT_REJECTED')}
            disabled={pending}
            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
          >
            Reject
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}